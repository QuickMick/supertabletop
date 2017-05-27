/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

var Path = require('path');
var fs = require('fs');
var EventEmitter3 = require('eventemitter3');

var Matter = require('matter-js');
var Constraint = Matter.Constraint;

var Packages = require('./../core/packages');

var GameConfig = require('./gameconfig.json');

var DefaultGame = require('./../public/resources/default_game.json');

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

var Config = require('./../public/resources/config.json');

var Globals = require('./globals');

const DEFAULT_BODY_SIZE = 100;

const EVT_BEFORE_UPDATE = 'beforeUpdate';

class EntityServerManager extends EventEmitter3 {

    constructor(ticks=60,updateQueue,clientManager){
        super();
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
         * contains all contstraings, created by user input
         * @type {Constraint}
         */
        this.constraints = null;

        /**
         * detected to broadcast just the changes to the clients
         * @type {EntityUpdateQueue}
         */
        this.updateQueue = updateQueue;

        /**
         * used to get info about the users mous positions
         */
        this.clientManager = clientManager;

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
        this.constraints={};
        this.game = Object.assign({},DefaultGame);
        this.engine = Engine.create();

        // no gravity, because topdown
        this.engine.world.gravity.y = this.engine.world.gravity.x= 0;

        // add before update event, so that all received updates from the clients
        // can be executed before an engine-step
        Matter.Events.on(this.engine,
        'beforeUpdate', function () {
           this.emit(EVT_BEFORE_UPDATE);
        }.bind(this));
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

        var updateRequired = false;
        var data ={};

        // send just the changed values
        if (oldData.x != body.position.x){
            data.position = data.position || {};
            data.position.x = body.position.x;
            updateRequired=true;
        }
        if(oldData.y != body.position.y ){
            data.position = data.position || {};
            data.position.y = body.position.y;
            updateRequired=true;
        }
        if(oldData.angle != body.angle){
            data.angle = body.angle;
            updateRequired=true;
        }

        // if the body has not changed, nothing to do, nothing to send
        if(!updateRequired) return;

        this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_TRANSFORMATION_UPDATE,
            body.ENTITY_ID,
            data
        );

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
        var resource_path = Path.join(Globals.ROOT,"public",Config.PATHS.USERS_RESOURCES,user,game,GameConfig.GAME_DEFINITION_FILE); //path.join(global.appRoot, content_file);
        console.log("load game: "+resource_path);

        this._resetGame();

        this.game = JSON.parse(fs.readFileSync(resource_path));

        var keys = Object.keys(this.entities);

        // create entities for unstacked entities
        for(var i=0; i< this.game.unstacked.length; i++){
            var c = this.game.unstacked[i];

            this.addEntity(this._reviveEntity(this.game.object_def[c.type],c));
        }

        //TODO: handle stacked, currently just unstacked entities are handled

        delete this.game.unstacked;
        delete this.game.stacked;

        this.game.entities = Object.keys(this.entities).map(function(key) {
            return this.entities[key];
        }.bind(this));/*.sort(function(a, b) {
            return a.state.timestamp - b.state.timestamp
        });*/
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
     * creates an default state for an entity
     * @returns {{state: string, timestamp: number}}
     * @private
     */
    _createDefaultEntityState(){
        return {
            state:Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_DEFAULT_STATE,
            timestamp:new Date().getTime()
        };
    }

    /**
     * adds an entity to the entitymanager and creates
     * @param entity
     * @private
     */
    addEntity(entity){
        this.lastID++; //increment id
        entity.id=this.lastID;
        this.entities[this.lastID] = entity;
        this.entities[this.lastID].state = this._createDefaultEntityState();

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

        // if an value is missing, replace it with zero
        entity.position.x = entity.position.x || 0;
        entity.position.y = entity.position.y || 0;
        entity.hitArea.offset.x = entity.hitArea.offset.x || 0;
        entity.hitArea.offset.y = entity.hitArea.offset.y || 0;

        //shorten the paths and calculate initial body position
        var x = entity.position.x + entity.hitArea.offset.x;
        var y = entity.position.y + entity.hitArea.offset.y;

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

        body.ENTITY_ID = entity.id;
        body.frictionAir = GameConfig.ENTITY_FRICTION;

        body.claimedBy = entity.claimedBy = "";
        this.bodies[entity.id] = body;
        //this.bodies[entity.id].entityData = this.entities[this.lastID];

        World.add(this.engine.world,body);
    }

    /**
     * removes an entity and postes it to the update que
     * @param id of the entity, which should be removed
     * @private
     */
    removeEntity(id){

        if(!id || !id.length ||  id.length <0 || !this.entities[id]){
            console.warn("entity does not exist or no id passed :",id);
            return;
        }

        delete this.entities[id];

        if(this.constraints[id]) {
            World.add(this.engine.world, this.constraints[id]);
            delete this.constraints[id];
        }

        if(this.bodies[id]){
            World.add(this.engine.world, this.bodies[id]);
            delete this.bodies[id];
        }

        this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_DELETED,
            id,
            {}
        );
    }

    claimEntity(userID, claimedEntityIDs){
        if(!this.clientManager.doesClientExist(userID)){
            console.warn("user does not exist");
            return;
        }

        if(!claimedEntityIDs || claimedEntityIDs.length <=0){
            console.warn("nothing to claim passed");
            return;
        }

        // if passed value is no array, then converte it to one
        claimedEntityIDs = [].concat(claimedEntityIDs);

        // iterated the claimed ids
        for(var i =0; i<claimedEntityIDs.length; i++) {
            var claimedEntityID = claimedEntityIDs[i];

            if (this.constraints[userID] && this.constraints[userID][claimedEntityID]) {
                console.log("constraint already exists fot user ", userID, " and entity ", claimedEntityID);
               // this._rejectAction(userID,claimedEntityID,Packages.PROTOCOL.GAME_STATE.ENTITY.USER_CLAIM_ENTITY);
                return;
            }

            if (!this.bodies[claimedEntityID]) {
                console.warn("claimed entity ", claimedEntityID, " does not exist!");
                return;
            }

            // create the constraint
            var cPos = this.clientManager.getPosition(userID);

            var constraint = Constraint.create({
                label: userID,
                pointA: cPos,
                bodyB: this.bodies[claimedEntityID],
                pointB: {x: 0, y: 0},
                length: 0.01,
                stiffness: 0.1,
                angularStiffness: 1
            });

            this.bodies[claimedEntityID].frictionAir = GameConfig.GRABBED_ENTITY_FRICTION;
            this.bodies[claimedEntityID].isSensor = true;       //this means->"no" collision with normal entities
        //    console.log("claim sensor",this.bodies[claimedEntityID].isSensor,claimedEntityID);
            // save the constraint
            if (!this.constraints[userID]) {
                this.constraints[userID] = {};
            }

            // set the claimedBy value to the userID, so we know that the entity is claimed by whom.
            this.entities[claimedEntityID].claimedBy = this.bodies[claimedEntityID].claimedBy = userID;

            constraint.ENTITY_ID = claimedEntityID;
            this.constraints[userID][claimedEntityID] = constraint;
            World.add(this.engine.world, constraint);            // finally add the constraint to the world

            // post, that the entity is now claimed by a user
            this._postStateChange(
                claimedEntityID,
                userID,
                Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED
            );
        }
    }

    /**
     * call to send info to the clients, that a action was rejected by the server
     * @param userID
     * @param entityID
     * @param action
     * @private
     */
    _rejectAction(userID,entityID,action){
           this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_REJECT_ACTION,
            userID,
           {
               rejected:{action:action,entity:entityID},
               _mode:"pushAvoidDuplicates"
           }
        );
    }

    /**
     *
     * @param userID
     * @param claimedEntityIDs {Array}
     */
    releaseEntities(userID, claimedEntityIDs){
        if(!this.clientManager.doesClientExist(userID)){
            console.warn("user does not exist");
            return;
        }
        if(!claimedEntityIDs){
            console.warn("nothing to claime passed");
        }

        claimedEntityIDs = [].concat(claimedEntityIDs);
        for(var i=0; i<claimedEntityIDs.length;i++){
            var curEntityID = claimedEntityIDs[i];

            // check if there is a constraint
            if(!this.constraints[userID] || !this.constraints[userID][curEntityID]){
                console.log("constraint does not exists fot user ",userID," and entity ",curEntityID);
                return;
            }

            // remove the claim value
            this.entities[curEntityID].claimedBy = this.bodies[curEntityID].claimedBy = "";

            this.bodies[curEntityID].isSensor = false;
            this.bodies[curEntityID].frictionAir = GameConfig.ENTITY_FRICTION;
           // console.log("releas sensor",this.bodies[curEntityID].isSensor,curEntityID);
            this._postStateChange(curEntityID);

            // if constraint exist, delete it
            World.remove(this.engine.world,this.constraints[userID][curEntityID]);
            delete this.constraints[userID][curEntityID];
        }
    }

    batchRotateEntities(userID, data){
        for(var i =0; i<data.rotatedEntities.length;i++){

            this.rotateEntity(userID,data.rotatedEntities[i],data.rotationAmount);
        }
    }

    /**
     * roates an entity by an user, about an certain amount.
     * if the user has no rights to rotate the entity (if he has not claimed it)
     * then the rotation is aported/skiped
     * @param userID
     * @param entityID
     * @param rotationAmount
     */
    rotateEntity(userID,entityID,rotationAmount){
        if(!rotationAmount){
            return; // nothing to do, when rotation amount does not exist or equals 0
        }

        if(!userID || userID.length <=0){
            console.log("rotation: no userID passed!");
            return;
        }

        if(!entityID){
            console.log("rotation: no entity id passed!",entityID);
            return;
        }

        if(!this.bodies[entityID]){
            console.log("rotation: entity",entityID,"does not exist!");
            return;
        }

        if(this.bodies[entityID].claimedBy != userID){
            console.log("rotation: entity",entityID,"not claimed by user",userID,"rotation aborted");
            return;
        }

        // multiply the passed value by the rotation speed
        Body.setAngularVelocity(this.bodies[entityID],rotationAmount*GameConfig.ROTATION_SPEED);
    }

    /**
     * posts state changes,
     * if just an entity id is passed,
     * the entity will be set to the default state.
     * @param entityID
     * @param userID
     * @param state new state of the entity
     * @param data {object}
     * @private
     */
    _postStateChange(entityID,userID,state,data){
        if(!entityID){
            console.warn("no entityID for statechange was passed");
            return;
        }

        if(!this.entities[entityID]){
            console.warn("entiy",entityID,"does not exist, no states can be changed");
            return;
        }

        var result = this._createDefaultEntityState();

        // if there is all data available, do the state change,
        // otherwise the entity is set to default state
        if(userID && state){
            if (!userID || userID.length <= 0) {
                console.warn("no user which causes the statechange was passed for entity", entityID);
            }
            data = data || {};  // if null, create empty object
            data.state = state;
            // assign passed data to dataset, which is posted
            result = Object.assign(result, data);
            result.userID= userID;
        }

        this.entities[entityID].state = result;

        this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.STATE_CHANGE,
            entityID,
            result
        );
    }

}

module.exports = EntityServerManager;