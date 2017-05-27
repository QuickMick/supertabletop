/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

var Packages = require("./../../core/packages");
var UpdateQueue = require('./../../core/updatequeue');

//var GameState = require("./gamestate");

//var EntityManager = require("./entitymanager");


/**
 * Receives all data from the server and changed data from the client and distributes it.
 */
class Synchronizer{
    constructor(gameManager,entityManager,playerManager){
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
        this.CLIENT_INFO = null;

        /**
         * used to detect updates which were done by the client
         * @type {EntityUpdateQueue}
         */
        this.updateQueue = new UpdateQueue();
        //this._queue = {};

        if(!entityManager)
            throw "entityManager is required in order to establish a connection";
        if(!gameManager)
            throw "gameManager is required in order to establish a connection";

        this.entityManager = entityManager;
        this.gameManager = gameManager;
        this.playerManager = playerManager;

        if (this.socket){
            console.warn("synchronizer already initialized!");
            return;
        }

        this.socket = require('socket.io-client').connect();
        this._initHandlers();

        //this intervall sends the entityupdates.
        setInterval(this._sendEntityUpdates.bind(this), Packages.PROTOCOL.CLIENT_UPDATE_INTERVAL);
    }

    /**
     * sends game updates from client to server, if changes are detected
     * @private
     */
    _sendEntityUpdates(){
        if(!this.updateQueue.updateRequired) return;

        this.sendMessage(Packages.PROTOCOL.CLIENT.SEND_STATE,Packages.createEvent(
            this.CLIENT_INFO.id,
            this.updateQueue.popUpdatedData()
            )
        );
    }

    /**
     * processes the batched updates, received from the server
     * @param updateData
     */
    processServerUpdates(updateData){
        for(var type in updateData){
            if(!updateData.hasOwnProperty(type)) continue;

            var updates = updateData[type];
            switch (type){
                // entity position or rotation has updated
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_TRANSFORMATION_UPDATE:
                    this.entityManager.batchUpdateEntityTransformation(updates);
                    break;
                // mouse of other players moves
                case Packages.PROTOCOL.GAME_STATE.CLIENT.SERVER_CLIENT_POSITION_UPDATE:
                    this.playerManager.batchUpdatePlayerPosition(updates);
                    break;
                // an entity gets deleted by an player or by the server
                case Packages.PROTOCOL.GAME_STATE.ENTITY.SERVER_ENTITY_DELETED:
                    this.entityManager.removeEntity(Object.keys(updates));
                    break;
                // the state of an entiy changes
                case Packages.PROTOCOL.GAME_STATE.ENTITY.STATE_CHANGE:
                    this.entityManager.batchUpdateEntityStateChange(updates);
                    break;
            }
        }
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
            window.hideLoadingDialog();
        }.bind(this));

        // receive data about the dame (after initialisation, or gamechange
        this.socket.on(Packages.PROTOCOL.SERVER.INIT_GAME, function (evt) {
            this.gameManager.initGame(evt.data);
        }.bind(this));

        // receive game updates
        this.socket.on(Packages.PROTOCOL.SERVER.UPDATE_STATE, function (evt) {
            this.processServerUpdates(evt.data);
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

}

module.exports = Synchronizer;