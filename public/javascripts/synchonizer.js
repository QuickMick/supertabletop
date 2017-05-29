/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

const Ticks = require('./../../core/ticks.json');
var Packages = require("./../../core/packages");
var UpdateQueue = require('./../../core/updatequeue');

//var GameState = require("./gamestate");

//var EntityManager = require("./entitymanager");


/**
 * Receives all data from the server and changed data from the client and distributes it.
 */
class Synchronizer{
    constructor(gameManager){
        this.socket = null;

        /**
         *  contains all necessary client infos
         * @type {object} like{
         * socket,
            id,
            color,
            name,
            verification
            }
         */
        this.CLIENT_INFO = {};

        /**
         * used to detect updates which were done by the client
         * @type {EntityUpdateQueue}
         */
        this.updateQueue = new UpdateQueue();

        /**
         * socket to connect to the server
         * @type {null}
         */
        this.socket = null;

        this.gameManager = gameManager;

        // following files are set in the init method
        this.entityManager = null;
        this.toolManager = null;
        this.playerManager = null;

        /**
         * contains the timestamp of the last received gameState update
         * @type {number}
         */
        this.lastGameStateUpdateEventTimeStamp = 0;

        /**
         * contains the last time when the gameState updates was processed
         * @type {number}
         */
        this.lastGameStateUpdateTimeStamp = 0;

    }

    init(){
        if (this.socket){
            console.warn("synchronizer already initialized!");
            return;
        }

        this.entityManager = this.gameManager.entityManager;
        this.playerManager = this.gameManager.playerManager;
        this.toolManager = this.gameManager.toolManager;

        this.socket = require('socket.io-client').connect();
        this._initHandlers();
    }

    /**
     * sends game updates from client to server, if changes are detected,
     * is started as soon as client_info is received
     * @private
     */
    _startUpdating(){
        //this interval sends the entityupdates.
        this.updateQueue.flush();
        setInterval(function(){
            if(!this.updateQueue.updateRequired) return;

            this.sendMessage(Packages.PROTOCOL.CLIENT.SEND_STATE,Packages.createEvent(
                this.CLIENT_INFO.id,
                this.updateQueue.popUpdatedData()
                )
            );
        }.bind(this),Ticks.CLIENT_UPDATE_INTERVAL);
    }

    /**
     * init all socket handlers,
     * if data was sent by the server, this method (to be more exact, the handlers initialized in this method),
     * receives and processes/distributes it.
     * @private
     */
    _initHandlers(){
        // get clientdata of this client
        this.socket.on(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED, function(evt) {
            this.CLIENT_INFO = evt.data;
            console.log("Clientdata received");
            this.playerManager.initCurrentPlayer(evt.data);
            this._startUpdating();
            window.hideLoadingDialog();
        }.bind(this));

        // receive data about the dame (after initialisation, or gamechange
        this.socket.on(Packages.PROTOCOL.SERVER.INIT_GAME, function (evt) {
            this.gameManager.initGame(evt.data);
        }.bind(this));

        // receive game updates
        this.socket.on(Packages.PROTOCOL.SERVER.UPDATE_STATE, function (evt) {
            if(evt.timeStamp < this.lastGameStateUpdateEventTimeStamp) return;    // if update is old, do not apply it
            var currentTime = new Date().getTime();
            this.processServerUpdates(evt.data,currentTime-this.lastGameStateUpdateTimeStamp);
            this.lastGameStateUpdateEventTimeStamp = evt.timeStamp;
            this.lastGameStateUpdateTimeStamp = currentTime;
        }.bind(this));

        // another player connected
        this.socket.on(Packages.PROTOCOL.SERVER.CLIENT_CONNECTED, function (evt) {
            this.playerManager.addPlayer(evt.data)
        }.bind(this));

        // an client disconnects
        this.socket.on(Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED, function (evt) {
            this.playerManager.removePlayer(evt.data.id)
        }.bind(this));
    }

    sendMessage(type,msg){
        this.socket.emit(type,msg);
    }

    /**
     * processes the batched updates, received from the server
     * @param updateData
     * @param timeSinceLastUpdate the time since the last update was received from the server
     */
    processServerUpdates(updateData,timeSinceLastUpdate){
        for(var type in updateData){
            if(!updateData.hasOwnProperty(type)) continue;

            var updates = updateData[type];
            switch (type){
                // entity position or rotation has updated
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_TRANSFORMATION_UPDATE:
                    this.entityManager.batchUpdateEntityTransformation(updates,timeSinceLastUpdate);
                    break;
                // mouse of other players moves
                case Packages.PROTOCOL.GAME_STATE.CLIENT.SERVER_CLIENT_POSITION_UPDATE:
                    this.playerManager.batchUpdatePlayerPosition(updates);
                    break;
                // an entity gets deleted by a player or by the server
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_DELETED:
                    this.entityManager.removeEntity(Object.keys(updates));//just the entityIDs are passed
                    break;
                // an entity was turned by a player or by the server
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_TURN_ENTITY:
                    this.entityManager.batchTurnEntities(updates);
                    break;
                // the state of an entiy changes
                case Packages.PROTOCOL.GAME_STATE.ENTITY.STATE_CHANGE:
                    this.toolManager.batchUpdateEntityStateChange(updates);
                    break;
                // a users Action was rejected
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_REJECT_ACTION:
                    this._batchHandleRejections(updates);
                    break;
            }
        }
    }

    /**
     * is called when something needs to be reverted
     * @param data
     * @private
     */
    _batchHandleRejections(data){
        if(!data){
            console.warn("rejections: no update data passed");
            return;
        }
        for(var userID in data){
            if(!data.hasOwnProperty(userID))continue;
            var rejected =data[userID].rejected;
            for(var i=0; i< rejected.length;i++){
                var action = rejected[i].action;
                var entityID = rejected[i].entity;
                this._handleRejection(userID,action,entityID);
            }
        }
    }

    _handleRejection(userID,action,entityID){
      //TODO: implemetn if necessary
    }

}

module.exports = Synchronizer;