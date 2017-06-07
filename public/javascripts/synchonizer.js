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
            name
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
        this.gameTable = null;
        this.chatHandler = null;

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


        /**
         * once the client is connected,
         * he receives the ID of the server
         * @type {string}
         */
        this.connectedServerID = "";

    }

    init(){
        if (this.socket){
            console.warn("synchronizer already initialized!");
            return;
        }

        this.entityManager = this.gameManager.entityManager;
        this.playerManager = this.gameManager.playerManager;
        this.toolManager = this.gameManager.toolManager;
        this.gameTable = this.gameManager.gameTable;
        this.chatHandler = this.gameManager.chatHandler;

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

            this.sendPackage(Packages.PROTOCOL.CLIENT.SEND_STATE,Packages.createEvent(
                this.CLIENT_INFO.id,
                this.updateQueue.popUpdatedData(),
                this.CLIENT_INFO.token
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
            this.CLIENT_INFO = evt.data.clientInfo;
            console.log("Clientdata received");
            this.playerManager.initCurrentPlayer(this.CLIENT_INFO);
            this.gameTable.initCurrentPlayer(this.CLIENT_INFO);

            if(this.CLIENT_INFO.playerIndex <0 || this.CLIENT_INFO.color <0){
                this.gameManager.showSeatChooser();
            }

            this.connectedServerID = evt.data.serverID;
            this._startUpdating();
            window.hideLoadingDialog();
        }.bind(this));

        // receive data about the dame (after initialisation, or gamechange
        this.socket.on(Packages.PROTOCOL.SERVER.INIT_GAME, function (evt) {
            if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
            this.chatHandler.pushMessage(I18N.translate("load_game",evt.data.name,evt.data.creator),"system",evt.timeStamp);
            this.gameManager.initGame(evt.data);
            this.lastGameStateUpdateEventTimeStamp=this.lastGameStateUpdateTimeStamp = new Date().getTime();
        }.bind(this));

        // receive game updates
        this.socket.on(Packages.PROTOCOL.SERVER.UPDATE_STATE, function (evt) {
            if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
            if(evt.timeStamp < this.lastGameStateUpdateEventTimeStamp) return;    // if update is old, do not apply it
            var currentTime = new Date().getTime();
            this.processServerUpdates(evt.data,currentTime-this.lastGameStateUpdateTimeStamp);
            this.lastGameStateUpdateEventTimeStamp = evt.timeStamp;
            this.lastGameStateUpdateTimeStamp = currentTime;
        }.bind(this));

        // another player connected
        this.socket.on(Packages.PROTOCOL.SERVER.CLIENT_CONNECTED, function (evt) {
            if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
            this.playerManager.addPlayers(evt.data);
        }.bind(this));

        // an client disconnects
        this.socket.on(Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED, function (evt) {
            if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
            this.playerManager.removePlayer(evt.data.id)
        }.bind(this));

        // a value of a client/player has changed
        this.socket.on(Packages.PROTOCOL.SERVER.CLIENT_VALUE_UPDATE, function (evt) {
            if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
            this.playerManager.updatePlayerValue(evt.data.clientID,evt.data.changes);
        }.bind(this));

        // if chat message from server is received
        this.socket.on(Packages.PROTOCOL.CHAT.SERVER_CHAT_MSG, function (evt) {
            if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
            var from = this.playerManager.getPlayer(evt.data.clientID);
            this.chatHandler.pushMessage(evt.data.message,evt.data.type,evt.timeStamp, from);
        }.bind(this));

        this.socket.on('disconnect',function (evt) {
           console.log("DISCONNECT",evt);
        });
    }

    /**
     * checks if id is the current server
     * @param id
     * @returns {*|boolean}
     * @private
     */
    _vertifyServer(id){
        return id && id == this.connectedServerID;
    }

    sendPackage(type, msg){
        this.socket.emit(type,msg);
    }

    sendChatMessage(msg){
        this.socket.emit(
            Packages.PROTOCOL.CHAT.CLIENT_CHAT_MSG,
            Packages.createEvent(this.CLIENT_INFO.id,{message:msg},this.CLIENT_INFO.token)
        );
    }

    /**
     * sends a message to the server which means, that one value of this client has changed
     * key e.g. "color"
     * value e.g. 0xFFFFFF
     * @param {[{key,value}]}
     */
    sendPlayerUpdate(data){
        this.sendPackage(Packages.PROTOCOL.CLIENT.CLIENT_VALUE_UPDATE,
            Packages.createEvent(
                this.CLIENT_INFO.id,
                data,
                this.CLIENT_INFO.token
            )
        );
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
                // an entity was added on the server, e.g. a new stack was created
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_ADDED:
                    if(!updates[this.connectedServerID])break; //just handle events from the server
                    this.entityManager.batchCreateEntities(updates[this.connectedServerID].newEntities);
                    break;
                // entity position or rotation has updated
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_TRANSFORMATION_UPDATE:
                    this.entityManager.batchUpdateEntityTransformation(updates,timeSinceLastUpdate);
                    break;
                // mouse of other players moves
                case Packages.PROTOCOL.GAME_STATE.CLIENT.SERVER_CLIENT_POSITION_UPDATE:
                    this.playerManager.batchUpdatePlayerPosition(updates,timeSinceLastUpdate);
                    break;
                // an entity was turned by a player or by the server
                // case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_TURN_ENTITY:
                //     this.entityManager.batchTurnEntities(updates);
                //     break;
                // a value of an entity was changed
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_VALUE_CHANGED:
                    this.entityManager.batchApplyValueChanges(updates);
                    break;
                // the state of an entiy changes
                case Packages.PROTOCOL.GAME_STATE.ENTITY.STATE_CHANGE:
                    this.toolManager.batchUpdateEntityStateChange(updates);
                    break;
                // a users Action was rejected
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_REJECT_ACTION:
                    this._batchHandleRejections(updates);
                    break;
                // an entity gets deleted by a player or by the server, e.g. a stack was removed
                // do it last, in case there are still updates in the queue for this entity
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_REMOVED:
                    if(!updates[this.connectedServerID])break; //just handle events from the server
                    this.entityManager.removeEntity(updates[this.connectedServerID].removedEntities);//just the entityIDs are passed
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