/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

var Path = require('path');
var fs = require('fs');

var Matter = require('matter-js');

var Packages = require('./../core/packages');

var DefaultGame = require('./../public/resources/default_game.json');

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

var Config = require('./../public/resources/config.json');

var Globals = require('./globals');

const DEFAULT_BODY_SIZE = 100;

class EntityServerManager {

    constructor(ticks=60,updateQueue){

        Body.update_original = Body.update;
        Body.update = this._bodyUpdateOverwrite.bind(this);

        /**
         * defines the update time of the physics engine
         * 1000/tick will be the intervall in which the pyhsics engine is updated
         * @type {number}
         */
        this.ticks = ticks;

        /**
         *  each entity gets an ID, the IDs are incremential
         * @type {number}
         */
        this.lastID=0;

        /**
         * contains the data of the entity, not the bodies, mapped to id
         * @type {{object}} e.g. {id:entitydata}
         */
        this.entities=null;

        /**
         * contains just the entity bodies, mapped to the corresponding ids
         * @type {{object}} e.g.{id:body}
         */
        this.bodies=null;

        /**
         * detected to broadcast just the changes to the clients
         * @type {EntityUpdateQueue}
         */
        this.updateQueue = updateQueue;

        this.game = null;
        this.engine = null;

        this._resetGame();
        //this.engine = Engine.create();

       // this._queue = {};

        setInterval(function() {
            Engine.update(this.engine, 1000 / this.ticks);
        }.bind(this), 1000 / this.ticks);
    }

    _resetGame(){
        this.bodies={};
        this.entities={};
        this.game = Object.assign({},DefaultGame);
        this.engine = Engine.create();
        this.engine.world.gravity.y = 0;
    }

    /**
     * overwrites the MATTER-JS in order to be able to detect position or angle changes
     * @param body
     * @param deltaTime
     * @param timeScale
     * @param correction
     * @private
     */
    _bodyUpdateOverwrite(body, deltaTime, timeScale, correction) {
        // before update
        var oldData = {
            x: body.position.x,
            y: body.position.y,
            angle: body.angle
        };

        Body.update_original(body, deltaTime, timeScale, correction);//.bind(Body);
        //after update

        // if the body has not changed, nothing to do
        if (oldData.x == body.position.x && oldData.y == body.position.y && oldData.angle == body.angle) return;

        this.updateQueue.postUpdate(Packages.PROTOCOL.ENTITY.SERVER_POSITION_UPDATE, body.ENTITY_ID, {
            position:{
                x:body.position.x,
                y:body.position.y,
                angle:body.angle
            }
        });

        this.entities[body.ENTITY_ID].position.x = body.position.x;
        this.entities[body.ENTITY_ID].position.y = body.position.y;
        this.entities[body.ENTITY_ID].angle = body.angle;
    }

    /**
     * loads a game from the db and creates the entities.
     * @param user
     * @param game
     */
    loadGame(user,game){
        var resource_path = Path.join(Globals.ROOT,"public",Config.PATHS.USERS_RESOURCES,user,game,Globals.GAME_DEFINITION_FILE); //path.join(global.appRoot, content_file);
        console.log("load game: "+resource_path);

        this._resetGame();

        this.game = JSON.parse(fs.readFileSync(resource_path));

        var keys = Object.keys(this.entities);

        // create entities for unstacked entities
        for(var i=0; i< this.game.unstacked.length; i++){
            var c = this.game.unstacked[i];

            this._addEntity(this._reviveEntity(this.game.object_def[c.type],c));
        }

        //TODO: handle stacked, currently just unstacked entities are handled

        delete this.game.unstacked;
        delete this.game.stacked;

        this.game.entities = Object.keys(this.entities).map(function(key) {
            return this.entities[key];
        }.bind(this));
    }

    getCurrentGameState(){
        return this.game;
    }

    /**
     * Overwrites the default values from the basetype.
     * Object.assign was not used, because it would overwrite the arrays completely.
     * This method copies and changes array items
     * @param basetype of the entity, contains all default values
     * @param instance contains all specialized values, e.g. position, or unique texture
     * @private
     */
    _reviveEntity(basetype,instance){
        // load the default entity
        let result = JSON.parse(JSON.stringify(basetype));

        //but override changes
        if(instance.overwrite) {
            for (let key in instance.overwrite) {
                if (!instance.overwrite.hasOwnProperty(key)) continue;

                var overwrite_path = key.split(".");    // get the path of the value, which should be overwritten
                var currentDepthObject = result;        // latest object of the path

                // go down the whole path, till the path can be set
                for(let i=0; i< overwrite_path.length;i++){
                    var curKey = overwrite_path[i]; // current validated key

                    if(i==overwrite_path.length-1){ // if last element, then set the real value
                        currentDepthObject[curKey] = instance.overwrite[key];
                    }else if(!result[curKey]){      // if object does not exist,
                        currentDepthObject[curKey]={};          // then create it
                    }
                    currentDepthObject=currentDepthObject[curKey];  // and set as new depth object
                }
            }
        }
        return result;
    }

    /**
     * adds an entity to the entitymanager and creates
     * @param entity
     * @private
     */
    _addEntity(entity){
        this.lastID++; //increment id
        entity.id=this.lastID;
        this.entities[this.lastID] = entity;

        // if there is no hitarea defined, use entity size or default value of DEFAULT_BODY_SIZE
        if(!entity.hitArea){
            entity.hitArea = {
                type:"rectangle",
                width:entity.width || DEFAULT_BODY_SIZE,
                height:entity.height || DEFAULT_BODY_SIZE
            }
        }

        // create body based on hitarea
        var body = null;

        // if there is no position or hitarea offset, use default values
        if (!entity.position) entity.position = {x: 0, y: 0};
        if (!entity.hitArea.offset) entity.hitArea.offset = {x: 0, y: 0};

        //shorten the paths and calculate initial body position
        var x = (entity.position.x || 0) + (entity.hitArea.offset.x || 0);
        var y = (entity.position.y || 0) + (entity.hitArea.offset.y || 0);

        switch (entity.hitArea.type) {
            case "circle":
                body = Bodies.circle(x,y,entity.hitArea.radius || (DEFAULT_BODY_SIZE/2));
                break;
            case "rectangle":
                body = Bodies.rectangle(x,y,entity.hitArea.width || DEFAULT_BODY_SIZE,entity.hitArea.height || DEFAULT_BODY_SIZE);
                break;
            default:
                console.warn("entity has no hirarea - collisions will not affect it");
                return;
        }
      //  body.entityData=entity;
        body.ENTITY_ID = entity.id;

        this.bodies[entity.id] = body;
        World.add(this.engine.world,body);
    }


    updateEntityPosition(id,x,y){
       // this.entities[id].position.x = x;
       // this.entities[id].position.y = y;

        Body.setVelocity(this.bodies[id], {x:(x || this.bodies[id].velocity.x),y:(y || this.bodies[id].velocity.y)});
    }

  /*  processPlayerUpdates(updateData){
        for(var type in updateData){
            if(!updateData.hasOwnProperty(type)) continue;

            switch (type){
                case Packages.PROTOCOL.GAME_STATE.USER_DRAG_START:

                   for(var entityID in updateData[type]){
                        var cpos_x = updateData[type][entityID].positionDelta_x;
                        var cpos_y = updateData[type][entityID].positionDelta_y;
                        this.updateEntityPosition(entityID,cpos_x,cpos_y);
                    }
                break;
            }
        }
    }*/

  dragStart(userID,claimedEntityID){
        //TODO:
  }

  dragEnd(userID,claimedEntityID){
    //TODO:
  }
}

module.exports = EntityServerManager;