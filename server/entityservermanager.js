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
var Util = require('./../core/util');

var Entity = require('./serverentity');
var BaseEntityData = Entity.BaseEntityData;
var ServerEntity = Entity.ServerEntity;
var ServerEntityStack = Entity.ServerEntityStack;

var GameConfig = require('./gameconfig.json');

var DefaultGame = require('./../public/resources/default_game.json');

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

var Config = require('./../public/resources/config.json');

var Globals = require('./globals');



const EVT_BEFORE_UPDATE = 'beforeUpdate';
/*
 const DEFAULT_BODY_SIZE = 100;
const CLAIMED_COLLISION_CATEGORY = 0x0002;

const DEFAULT_COLLISION_CATEGORY = 0x0001;

const DEFAULT_FILTER = {
    group:DEFAULT_COLLISION_CATEGORY
};

const CLAIMED_FILTER = {
    group:CLAIMED_COLLISION_CATEGORY
};*/

const SEND_PERCISION_POSITION = 3;
const SEND_PERCISION_ROTATION = 4;

class EntityServerManager extends EventEmitter3 {

    constructor(ticks=60,updateQueue,clientManager,gameServer){
        super();
        Body.update_original = Body.update;
        Body.update = this._bodyUpdateOverwrite.bind(this);

        this.gameServer = gameServer;

        /**
         * defines the update time of the physics engine
         * 1000/tick will be the intervall in which the pyhsics engine is updated
         * @type {number}
         */
        this.ticks = ticks;

        /**
         * contains all contstraings, created by user input
         * this.constraints[userID][claimedEntityID] = constraint
         * an constraint is always referenced to an user,
         * this is used to handle the mouse movement
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

        this.gameEntities = null;

        this._resetGame();

        setInterval(function() {
            Engine.update(this.engine, 1000 / this.ticks);
        }.bind(this), 1000 / this.ticks);
    }

    _resetGame(){
        this.gameEntities = {};
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

        // sets the listeners, which are needed for stacking and so on
        Matter.Events.on(this.engine,'collisionActive',this._collisionActive.bind(this));
        Matter.Events.on(this.engine,'collisionEnd',this._collisionEnd.bind(this));
        Matter.Events.on(this.engine,'collisionStart',this._collisionActive.bind(this));
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

        // send just the changed values, values are rounded,
        // because it is not necessary to send 0.0001 changes
        if (Util.round(oldData.x,SEND_PERCISION_POSITION) != Util.round(body.position.x,SEND_PERCISION_POSITION)){
            data.position = data.position || {};
            data.position.x = body.position.x;
            updateRequired=true;
        }
        if(Util.round(oldData.y,SEND_PERCISION_POSITION) != Util.round(body.position.y,SEND_PERCISION_POSITION) ){
            data.position = data.position || {};
            data.position.y = body.position.y;
            updateRequired=true;
        }
        if(Util.round(oldData.angle,SEND_PERCISION_ROTATION) != Util.round(body.angle,SEND_PERCISION_ROTATION)){
            data.angle = body.angle;
            updateRequired=true;
        }

        // if the _body has not changed, nothing to do, nothing to send
        if(!updateRequired) return;

        this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_TRANSFORMATION_UPDATE,
            body.ENTITY_ID,
            data
        );
    }

    /**
     * loads a game from the db and creates the entities.
     * TODO: class für game machn und alle werte normalisieren
     * @param user
     * @param game
     */
    loadGame(user,game){
        var resource_path = Path.join(Globals.ROOT,"public",Config.PATHS.USERS_RESOURCES,user,game,GameConfig.GAME_DEFINITION_FILE); //path.join(global.appRoot, content_file);
        console.log("load game: "+resource_path);

        this._resetGame();

        // load game and override values from the default game
        this.game = Object.assign(this.game,JSON.parse(fs.readFileSync(resource_path)));

        // create entities for unstacked entities
        if(this.game.unstacked) {
            for (var i = 0; i < this.game.unstacked.length; i++) {
                this.addEntity(new ServerEntity(this.game.unstacked[i], this.game.object_def));
            }
            delete this.game.unstacked; // the raw data of the entities is not needed any longer
        }

        if(this.game.stacks) {
            for (var j = 0; j < this.game.stacks.length; j++) {
                this.addEntity(new ServerEntityStack(this.game.stacks[j], this.game.object_def));
            }
            delete this.game.stacks;    // the raw data of the entities is not needed any longer
        }
    }

    getCurrentGameState(){
        //TODO: hier die entities reinsetzen, nicht shcon beim adden
        this.game.entities = Object.keys(this.gameEntities).map(function (key) { return this.gameEntities[key]; }.bind(this));
        return this.game;
    }

    /**
     * adds an entity to the entitymanager and creates
     * @param entity
     * @param send true, if the entity should be broadcasted to the clients
     * @private
     */
    addEntity(entity,send){
        if(!entity){
            console.warn("addEntities: no entity passed!");
            return;
        }

        if(this.gameEntities[entity.ID]){
            console.log("addEntities: enitty already added!");
            return;
        }

        this.gameEntities[entity.ID] = entity;
        World.add(this.engine.world,entity.body);
        entity.isAddedToWorld = true;

        if(send){
            this.updateQueue.postUpdate(
                Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_ADDED,
                this.gameServer.ID,
                {
                    newEntities:entity.toJSON(),
                    _mode:"pushAvoidDuplicates"
                }
            );
        }
    }

    /**
     * removes an entity and postes it to the update que
     * @param id of the entity, which should be removed
     * @param send {boolean} if this is true, the info will be broadcasted to all clients
     * @private
     */
    removeEntity(id,send){
        if(!id || !this.gameEntities[id]){
            console.warn("removeEntity: entity does not exist or no id passed :",id);
            return;
        }
        var entity = this.gameEntities[id];
        entity.isAddedToWorld = false;
        delete this.gameEntities[id];    // remove form game instanz

        // remove claims, if the entity is claimed by a user
        if(entity.claimedBy){
            this.releaseEntities(entity.claimedBy,id);
        }

        World.remove(this.engine.world, entity.body);


        if(send) {
            this.updateQueue.postUpdate(
                Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_REMOVED,
                this.gameServer.ID,
                {
                    removedEntities:id,
                    _mode:"pushAvoidDuplicates"
                }
            );
        }
    }

    /**
     * claims an entity to an user,
     * this means, no other user is able to modify an entity.
     * a user can just modify entities which he has claimed before.
     * @param userID if of the user who wants to claim the entity
     * @param claimedEntityIDs the IDs of the entities he wants to claim
     */
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

        // needs to be in a local variable,
        // to be able to pass it to the getter of the constraint
        var clientManager = this.clientManager;

        // iterated the claimed ids
        for(var i =0; i<claimedEntityIDs.length; i++) {
            var claimedEntityID = claimedEntityIDs[i];
            if(!this.gameEntities[claimedEntityID]){
                console.log("claimEntity: entity does not exist:",claimedEntityID);
                continue;
            }

            if (this.constraints[userID] && this.constraints[userID][claimedEntityID]) {
                console.log("claimEntity: constraint already exists fot user ", userID, " and entity ", claimedEntityID);
               // this._rejectAction(userID,claimedEntityID,Packages.PROTOCOL.GAME_STATE.ENTITY.USER_CLAIM_ENTITY);
                continue;
            }

            var entity = this.gameEntities[claimedEntityID];

            entity.claim(userID);
            entity.setMode("move"); //TODO: des jetz nur zu testzwecken, spaeter wieder entfernen

            // create the constraint
            var constraint = Constraint.create({    //TODO: des hier iwie auslagern
                label: userID,
                userID: userID,
                entityID: entity.ID,
                get pointA() {
                    var cPos = clientManager.getPosition(this.userID);
                  //  console.log(this.userID,cPos,this.relativePosition);
                    var result = {x: cPos.x, y: cPos.y};

                    if (this.relativePosition) {
                        result.x += this.relativePosition.x;
                        result.y += this.relativePosition.y;
                    }

                    return result;
                },
                bodyB: entity.body,
                pointB: {x: 0, y: 0},
                length: 0.01,
                stiffness: 0.1,
                angularStiffness: 1
            });

            // save the constraint
            // an user can create several constraints
            if (!this.constraints[userID]) {
                this.constraints[userID] = {};
            }

            //mark identifier (entity id)
            constraint.ENTITY_ID = claimedEntityID;

            // cache the constraint
            this.constraints[userID][claimedEntityID] = constraint;

            // finally add the constraint to the world
            World.add(this.engine.world, constraint);

            // post, that the entity is now claimed by a user
            this._postStateChange(  //TODO: nach oben bringen (entityevent)?
                entity
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
   /* _rejectAction(userID,entityID,action){
           this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_REJECT_ACTION,
            userID,
           {
               rejected:{action:action,entity:entityID},
               _mode:"pushAvoidDuplicates"
           }
        );
    }*/

    /**
     * releases all constraints for a user, e.g. when he disconnects
     * @param userID
     */
    releaseAllContraintsForUser(userID){
        if(!this.constraints[userID]){
            console.log(userID,"has no constraints");
            return;
        }
        this.releaseEntities(userID,Object.keys(this.constraints[userID]));
    }

    /**
     *
     * @param userID
     * @param claimedEntityIDs {Array}
     */
    releaseEntities(userID, claimedEntityIDs){
        if(!this.clientManager.doesClientExist(userID)){
            console.warn("releaseEntities: user does not exist");
            return;
        }
        if(!claimedEntityIDs){
            console.warn("releaseEntities: nothing to release passed");
            return;
        }

        claimedEntityIDs = [].concat(claimedEntityIDs);
        for(var i=0; i<claimedEntityIDs.length;i++){
            var curEntityID = claimedEntityIDs[i];

            // check if there is a constraint
            if(!this.constraints[userID]){
                console.log("releaseEntities: no constraints does not exists fot user ",userID," and entity ",curEntityID);
                return;
            }

            if(!this.constraints[userID][curEntityID]){
                console.log("releaseEntities: constraint does not exists fot user ",userID," and entity ",curEntityID);
                continue;
            }

            if(!this.gameEntities[curEntityID]){
                console.warn("releaseEntities: entitiy",curEntityID,"does not exist");
                continue;
            }

            var entity = this.gameEntities[curEntityID];

            // remove the claim value
            entity.release();

            // release the entity by just posting the id in state change,
            // default state will be generated
            this._postStateChange(entity);

            // if constraint exist, delete it
            World.remove(this.engine.world,this.constraints[userID][curEntityID]);
            delete this.constraints[userID][curEntityID];
        }
    }


    /**
     * sets the relative position for all passed entites by a user,
     *
     * if no data is passed, all realtiva positions of all claimed entities are deleted
     *
     * @param userID id who sets the positions
     * @param relativePositions {object} looks like {<entity_id>:{x:0,y:0}}
     */
    batchSetRelativeConstraintPosition(userID,relativePositions){
        if(!relativePositions){
            this.cleanRelativeConstraintPositions(userID);
            return;
        }

        for(var entityID in relativePositions){
            if(!relativePositions.hasOwnProperty(entityID)) continue;

            var rPos = relativePositions[entityID];
            this.setRelativeConstraintPosition(userID,entityID,rPos);
        }
    }

    /**
     * checks if user has contraints,
     * if yes, all relative positions are deleted
     * @param userID to check
     */
    cleanRelativeConstraintPositions(userID){
        if(!userID){
            console.log("setRelativeConstraintPosition: no userID passed");
            return;
        }

        if(!this.clientManager.doesClientExist(userID)){
            console.log("setRelativeConstraintPosition: user",userID,"does not exist");
            return;
        }

        if(!this.constraints[userID]){  // no constrains exist for this user
            return;
        }

        var cCur = this.constraints[userID];
        // iterate all constraints
        for(var entityID in cCur){
            if(!cCur.hasOwnProperty(entityID)) continue;
            var constraint = cCur[entityID];
            delete constraint.relativePosition; // remove the relative position
        }
    }

    /**
     * sets the relative position of a constraint.
     * it is usesd e.g. to implement snap points or multiselection,
     * the final point of the contraint is caluculated by using the
     * client position summed up with the relative position.
     *
     * @param userID contraint of user
     * @param entityID contraint for entity
     * @param rPos the relative position
     */
    setRelativeConstraintPosition(userID,entityID,rPos){
        if(!userID){
            console.log("setRelativeConstraintPosition: no userID passed");
            return;
        }

        if(!this.clientManager.doesClientExist(userID)){
            console.log("setRelativeConstraintPosition: user",userID,"does not exist");
            return;
        }

        if(!entityID){
            console.log("setRelativeConstraintPosition: no entity id passed!",entityID);
            return;
        }

        if(!this.gameEntities[entityID]){
            console.log("setRelativeConstraintPosition: entity",entityID,"does not exist!");
            return;
        }

        if(this.gameEntities[entityID].claimedBy != userID){
           // console.log("setRelativeConstraintPosition: entity",entityID,"not claimed by user",userID,"- aborted");
            return;
        }

        if(!this.constraints[userID] || !this.constraints[userID][entityID]){
            console.log("setRelativeConstraintPosition: no constrain exist for user:",userID," and entity",entityID);
            return;
        }

        if(!rPos){
            console.log("setRelativeConstraintPosition:no relative data for entity",entityID,"and user",userID,"passed");
            return;
        }

        // set the relative position
        this.constraints[userID][entityID].relativePosition = {
            x:rPos.x||0,
            y:rPos.y||0
        };
    }

    /**
     * turn all entities to the passed side
     * @param userID user who wnats to turn the entity
     * @param data the entities to turn looks like:
     *  {turnedEntities:[<ids of entities>],surface:<index, or "next", "previous" or "random">}
     */
    batchTurnEntities(userID,data){
        if(!data || !data.turnedEntities){
            console.log("batchTurnEntities: no data passed for user",userID);
            return;
        }

        for(var i =0; i<data.turnedEntities.length;i++){
            this.turnEntity(userID,data.turnedEntities[i],data.surface);
        }
    }

    /**
     * turns the surface of an entity
     * @param userID user who wants to turn the entitie
     * @param surface accepts the actual index of the surface, "next", "previous" or "random".
     */
    turnEntity(userID,entityID,surface){
        if(!userID || userID.length <=0){
            console.log("turnEntity: no userID passed!");
            return;
        }

        if(!this.clientManager.doesClientExist(userID)){
            console.log("turnEntity: user",userID,"does not exist!");
            return;
        }

        var curEntity = this.gameEntities[entityID];

        if(!curEntity){
            console.log("turnEntity: entity",entityID,"does not exist!");
            return;
        }

        if(curEntity.claimedBy != userID){
            console.log("turnEntity: entity not claimed by user",userID);
            return;
        }

        var turned = curEntity.turn(surface);

        if(turned) {    //TODO: nach oben bringen?
          /*  this.updateQueue.postUpdate(
                Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_TURN_ENTITY,
                entityID,
                {surfaceIndex: curEntity.surfaceIndex}
            );*/

            this.updateQueue.postUpdate(
                Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_VALUE_CHANGED,
                entityID,
                {
                    changes:[
                        {
                            keyPath:"surfaceIndex",
                            value:curEntity.surfaceIndex
                        }
                    ],
                    _mode:"push"
                }
            );

        }
    }

    batchStackEntities(userID,data){
        if(!data || !data.stackPairs){
            console.log("batchRotation: no data passed for user",userID);
            return;
        }

        for(var i =0; i<data.stackPairs.length;i++){
            var currentPair = data.stackPairs[i];
            this.stackEntities(userID,currentPair.sourceID,currentPair.targetID,true);
        }
    }

    /**
     * stacks two entities,
     * this means, when one entity is no stack,
     * then both are deleted, and a stack is generated.
     *
     * NOTE: first element of the stack is always on the bottom,
     *      last element is always on the top
     *
     * NODE: everytime an stack entity is stacked, a new stack is created, even if one of the two entities is
     *      already a stack
     * @param userID user who wants to stack
     * @param sourceID entity he drags
     * @param targetID entiy on which he tracks the source entity
     * @param send {boolean} if true, the changes are broadcasted to the users
     */
    stackEntities(userID,sourceID,targetID,send){
        if(!userID || userID.length <=0){
            console.log("stackEntities: no userID passed!");
            return;
        }
//TODO: stack refactoring
        if(!this.clientManager.doesClientExist(userID)){
            console.log("stackEntities: user does not exist!",userID);
        }

        if(!sourceID || !this.gameEntities[sourceID]){
            console.log("stackEntities: source entity",sourceID,"does not exist!");
            return;
        }

        if(!targetID || !this.gameEntities[targetID]){
            console.log("stackEntities: target entity",targetID,"does not exist!");
            return;
        }

        if(this.gameEntities[targetID].type != this.gameEntities[targetID].type){
            console.log("stackEntities: target and source entity are not both of the same type!",this.entities[targetID].type,"and",this.entities[targetID].type);
            return;
        }

        if(this.gameEntities[sourceID].claimedBy != userID){
            console.log("stackEntities: source entity",sourceID,"not claimed by user",userID,"stacking not possible");
            return;
        }

        if(this.gameEntities[targetID].claimedBy){
            console.log("stackEntities: target entity",sourceID," already claimed by a user - stacking not possible");
            return;
        }

        // actual code
        var targetEntity = this.gameEntities[targetID];
        var sourceEntity = this.gameEntities[sourceID];

        //TODO muss man doch schaun ob entity oder stack
        var wasStack = targetEntity.isStack;
        var targetStack;
        if(wasStack){
            targetStack = targetEntity;
        }else{
            // create new stack out of entity
            targetStack = new ServerEntityStack(targetEntity);
            this.removeEntity(targetID,true);     // remove the entity from the game, because it is now in the stack
        }


        // merge the source entity/stack with the new stack
        // if the source entity was a stack, take its content, otherwise concat the entity itself to the new stack
        targetStack.pushContent(sourceEntity);

        // first, release the source entity, because it will be deleted on the client
        this.releaseEntities(userID,sourceID);
        this.removeEntity(sourceID,true);    // remove the entity, because it is now also in the stack



       if(wasStack){
           // send content changed

           if(send) {

               var data={_mode:"push"};

               this.updateQueue.postUpdate(
                   Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_VALUE_CHANGED,
                   targetStack.ID,
                   {
                       changes:[
                           {
                               keyPath:"surfaces",
                               value:targetStack.surfaces
                           },
                           {
                               keyPath:"surfaceIndex",
                               value:targetStack.surfaceIndex
                           }
                       ],
                       _mode:"push"
                   }
               );
           }

       }else {
           // finaly add the new stack to the entity manager, and send it (done with the addEntities function)
           this.addEntity(targetStack, true);
       }
    }

    /**
     * rotate all entitys by an amout and by an user
     * @param userID user who wants to rotate
     * @param data should look like:
     *  {rotatedEntites:[<list of entity ids>], rotationAmount:<amount of rotation>}
     */
    batchRotateEntities(userID, data){
        if(!data || !data.rotatedEntities){
            console.log("batchRotation: no data passed for user",userID);
            return;
        }

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

        if(!userID){
            console.log("rotation: no userID passed!");
            return;
        }

        if(!this.clientManager.doesClientExist(userID)){
            console.log("rotation: user does not exist!",userID);
        }

        if(!entityID){
            console.log("rotation: no entity id passed!",entityID);
            return;
        }

        if(!this.gameEntities[entityID]){
            console.log("rotation: entity",entityID,"does not exist!");
            return;
        }

        if(this.gameEntities[entityID].claimedBy != userID){
            console.log("rotation: entity",entityID,"not claimed by user",userID,"rotation aborted");
            return;
        }

        // multiply the passed value by the rotation speed
        this.gameEntities[entityID].rotateEntity(rotationAmount*GameConfig.ROTATION_SPEED);
        // changes will be postet in the engine.update overrite method,
        // because the changes are done during the enigne step
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
    _postStateChange(entity){
        if(!entity) {
            console.warn("entiy does not exist, no states can be changed");
            return;
        }

        this.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.ENTITY.STATE_CHANGE,
            entity.ID,
            entity.state
        );
    }


    /**
     *
         Event Payload:

         event Object

         An event object
         pairs

         List of affected pairs
         timestamp Number

         The engine.timing.timestamp of the event
         source

         The source object of the event
         name

         The name of the event


     * @param evt
     * @private
     */
    _collisionStart(evt){

    }

    /**
     *
     Event Payload:

     event Object

     An event object
     pairs

     List of affected pairs
     timestamp Number

     The engine.timing.timestamp of the event
     source

     The source object of the event
     name

     The name of the event


     * @param evt
     * @private
     */
    _collisionEnd(evt){

    }

    /**
     *
     Event Payload:

     event Object

     An event object
     pairs

     List of affected pairs
     timestamp Number

     The engine.timing.timestamp of the event
     source

     The source object of the event
     name

     The name of the event


     * @param evt
     * @private
     */
    _collisionActive(evt){

    }

}

module.exports = EntityServerManager;