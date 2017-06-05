/**
 * Created by Mick on 19.05.2017.
 */
'use strict';

const Ticks = require('./../core/ticks.json');
var Packages = require('./../core/packages');
var Util = require('./../core/util');

const uuidV4 = require('uuid/v4');

var UpdateQueue = require("./../core/updatequeue");
var EntityServerManager = require('./entityservermanager');
var ClientManager = require('./clientmanager');

class GameServer{
    constructor(io){
        this.io = io;
        this.ID = uuidV4();
        this.clientManager = new ClientManager();
        this.updateQueue =  new UpdateQueue();
        this.entityServerManager = new EntityServerManager(60,this.updateQueue,this.clientManager,this);
        this.entityServerManager.on('afterUpdate',this._processReceivedUpdateQueue.bind(this));

        /**
         * all updates, which are received by the clients are stored in this array
         * and processed, before a physic engines step
         * @type {Array}
         */
        this.receivedUpdateQueue = [];
    }

    start(){
        this.io.on('connection', this._onConnectionReceived.bind(this));
        setInterval(this._sendEntityUpdates.bind(this), Ticks.SERVER_UPDATE_INTERVAL);

        this.entityServerManager.loadGame("mick","codewords"); //TODO nicht statisch machen und durch user triggern lassen
    }

    /**
     * processes the received updates
     * @private
     */
    _processReceivedUpdateQueue(){
        var currentQueue = this.receivedUpdateQueue;
        this.receivedUpdateQueue = [];
        for(var i=0; i< currentQueue.length;i++){
            this._processUpdates(currentQueue[i]);
        }
    }

    /**
     * Broadcasts the recent updates to all clients,
     * is called in an regular interval
     * @private
     */
    _sendEntityUpdates(){
        if(!this.updateQueue.updateRequired) return;

        this._boradcast(Packages.PROTOCOL.SERVER.UPDATE_STATE,Packages.createEvent(
            this.ID,
            this.updateQueue.popUpdatedData()
            )
        );
    }

    /**
     * is called once for every client who connects,
     * everything necessary for the gameplay / client is initialized here
     * @param socket of the connected client
     * @private
     */
    _onConnectionReceived(socket) {
        this._initClient(socket);

        socket.on(Packages.PROTOCOL.CLIENT.CLIENT_VALUE_UPDATE, function (evt) {
            var valid = this._processClientValueUpdates(evt);
            if(valid) {
                this._boradcast(    // if the change was valid, send everyone the new information
                    Packages.PROTOCOL.SERVER.CLIENT_VALUE_UPDATE,
                    Packages.createEvent(
                        this.ID,
                        {
                            clientID: evt.senderID,
                            changes: evt.data
                        }
                    )
                );
            }
        }.bind(this));

        //removes this client from the serverclient list and broadcasts the information to all remaining clients
        socket.on('disconnect', function (data) {
            this.entityServerManager.releaseAllContraintsForUser(socket.id);
            this.clientManager.clientDisconnected(socket, data);
            this._boradcastExceptSender(
                socket,
                Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,
                Packages.createEvent(
                    this.ID,
                    {id: socket.id}
                )
            );
        }.bind(this));

        // server receives client entity updates in this event
        socket.on(Packages.PROTOCOL.CLIENT.SEND_STATE, function (evt) {
            // the received updates are processes everytime before the engine is processed.
            this.receivedUpdateQueue.push(evt.data);
        }.bind(this));
    }

    /**
     *
     * @returns {boolean} true, if accepted/ valid change
     * @private
     */
    _processClientValueUpdates(evt){
        if(!this.clientManager.doesClientExist(evt.senderID)){
            console.log("_processClientValueUpdates: client",evt.senderID,"does not exist!");
            return false;
        }

        var result = false;
        for(var i=0; i<evt.data.length;i++) {
            var cur = evt.data[i];
            switch (cur.key) {
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.COLOR:
                    result=this.clientManager.updateClientColor(evt.senderID, cur.value);
                    break;
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.PLAYER_INDEX:
                    result = this.clientManager.updateClientIndex(evt.senderID, cur.value);
                    break;
            }
        }

        return result;
    }

    /**
     * process the posted updates of all players
     * @param data
     * @private
     */
    _processUpdates(data){
        for(var type in data){
            if(!data.hasOwnProperty(type)) continue;
            for(var id in data[type]) {
                if(!data[type].hasOwnProperty(id)) continue;

                if(!this.clientManager.doesClientExist(id)){
                    console.log("_processUpdates: user does not exist!");
                    continue;
                }

                if(!this.clientManager.isClientReady(id)){
                    console.log("_processUpdates: client",id,"is not ready");
                    continue;
                }

                switch (type) { // claim and release entiy is updaated first, becuase the other functions need the claim

                    // an user copys an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_COPY_ENTITY:
                        this.entityServerManager.copyEntities(id,data[type][id].copyRequest);
                        break;
                    // an user claimes an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_CLAIM_ENTITY:
                        this.entityServerManager.claimEntity(id, data[type][id].claimedEntity);
                        break;
                    // user wants to stack two entities
                    // has to be before releasing, because releasing signal just is send after stacking signal
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_STACK_ENTITY:
                        this.entityServerManager.batchStackEntities(id, data[type][id]);
                        break;
                    // an user releases an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_RELEASE_ENTITY:
                        this.entityServerManager.releaseEntities(id, data[type][id].releasedEntities);
                        break;
                    // an user wants to rotate an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_ROTATE_ENTITY:
                        this.entityServerManager.batchRotateEntities(id, data[type][id]);
                        break;
                    // am user wants to turn an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_TURN_ENTITY:
                        this.entityServerManager.batchTurnEntities(id, data[type][id]);
                        break;
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_DRAW_ENTITY:
                        this.entityServerManager.batchDrawFromStack(id, data[type][id].drawFromStacks);
                        break;
                    // an user moves his mouse
                    case Packages.PROTOCOL.GAME_STATE.CLIENT.USER_POSITION_CHANGE:
                        var changed = this.clientManager.updateClientPosition(id,data[type][id].position);
                        this.entityServerManager.batchSetRelativeConstraintPosition(id,data[type][id].relativePositions);
                        // distribute the new position to every other users
                        if(changed) {
                            this.updateQueue.postUpdate(
                                Packages.PROTOCOL.GAME_STATE.CLIENT.SERVER_CLIENT_POSITION_UPDATE,
                                id,
                                data[type][id].position
                            );
                        }
                        break;
                }
            }
        }
    }

    /**
     * a new client enters the server,
     * distribute the information about the client to itself and to every other player
     * @param socket
     */
    _initClient(socket){
        // TODO: load clientinfo from database
        var clientInfo = {
            name:"ranz",
            cursor:"default"/*,
            color:Util.getRandomColor()*/
        };

        // connect client to this server
        this.clientManager.clientConnected(socket,clientInfo);

        // share info with client (that he is connected and his own info)
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
            Packages.createEvent(
                this.ID,
                {
                    clientInfo:this.clientManager.getClient(socket.id).privateInfo,
                 //   assignments:this.clientManager.assignments(),
                    serverID: this.ID
                }
            )
        );

        // share info about all other players with newly connected client
        var alreadyKnownClients = this.clientManager.getAllPublicClientinfo(socket.id);
        if(alreadyKnownClients && alreadyKnownClients.length >0) {
            this._sendToClient(
                socket,
                Packages.PROTOCOL.SERVER.CLIENT_CONNECTED,
                Packages.createEvent(
                    this.ID,
                    this.clientManager.getAllPublicClientinfo(socket.id)
                )
            );
        }

        // share public info of newly connected client with everyone
        this._boradcastExceptSender(
            socket,
            Packages.PROTOCOL.SERVER.CLIENT_CONNECTED,
            Packages.createEvent(
                this.ID,
                [this.clientManager.getClient(socket.id).publicInfo]
            )
        );

        // share info about the current serverstate with the newly connected client
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.INIT_GAME,
            Packages.createEvent(
                this.ID,
                this.entityServerManager.getCurrentGameState()
            )
        );
    }


    _boradcast(type,msg){
        this.io.sockets.emit(type,msg);
    }

    _boradcastExceptSender(senderSocket,type,msg){
        senderSocket.broadcast.emit(type,msg);
    }

    _sendToClient(clientConnectionSocket,type,msg){
        clientConnectionSocket.emit(type,msg);
    }
}

module.exports = GameServer;