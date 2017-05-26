/**
 * Created by Mick on 19.05.2017.
 */
'use strict';


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
        this.entityServerManager = new EntityServerManager(60,this.updateQueue);
    }

    start(){
        this.io.on('connection', this._onConnectionReceived.bind(this));

        setInterval(this._sendEntityUpdates.bind(this), Packages.PROTOCOL.CLIENT_UPDATE_INTERVAL);

        this.entityServerManager.loadGame("mick","codewords"); //TODO nicht statisch machen und durch user triggern lassen
    }

    /**
     * Broadcasts the recent updates to all clients
     * @private
     */
    _sendEntityUpdates(){
        if(!this.updateQueue.updateRequired) return;

        this._boradcast(Packages.PROTOCOL.SERVER.UPDATE_STATE,Packages.createEvent(
            this.ID,
            this.updateQueue.getUpdatedEntityData()
            )
        );
    }

    _onConnectionReceived(socket) {

        this.initClient(socket);

        //removes this client from the serverclient list and broadcasts the information to all remaining clients
        socket.on('disconnect', function (data) {
            this.clientManager.clientDisconnected(socket, data);
            this._boradcastExceptSender(socket, Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED, Packages.createEvent(this.ID, {id: socket.id}));
            //TODO: broadcast that client disconnects
        }.bind(this));

        // server receives client entity updates in this event
        socket.on(Packages.PROTOCOL.CLIENT.SEND_STATE, function (evt) {
         //   this.entityServerManager.processPlayerUpdates(evt.data);

            this._processUpdates(evt.data);
        }.bind(this));
    }

    _processUpdates(data){
        for(var type in data){
            if(!data.hasOwnProperty(type)) continue;
            for(var id in data[type]) {
                if(!data[type].hasOwnProperty(id)) continue;

                switch (type) {
                    case Packages.PROTOCOL.GAME_STATE.USER_DRAG_START:
                        this.entityServerManager.dragStart(id, data[type][id].claimedEntity);
                        break;
                    case Packages.PROTOCOL.GAME_STATE.USER_DRAG_END:
                        this.entityServerManager.dragEnd(id, data[type][id].releasedEntities);
                        break;
                    case Packages.PROTOCOL.GAME_STATE.USER_MOUSE_POSITION:
                        var changed = this.clientManager.updateClientPosition(id,data[type][id].position);
                        if(changed) {
                            this.updateQueue.postUpdate(
                                Packages.PROTOCOL.GAME_STATE.SERVER_CLIENT_POSITION_UPDATE,
                                id,
                                data[type][id].position
                            );
                        }
                        break;
                }
            }
        }
    }


    initClient(socket){

        // TODO: load clientinfo from database
        var clientInfo = {
            name:"ranz",
            cursor:"default",
            color:Util.getRandomColor()
        };

        // connect client to this server
        this.clientManager.clientConnected(socket,clientInfo);

        // share info with client (that he is connected and his own info)
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
            Packages.createEvent(
                this.ID,
                this.clientManager.getPrivateClientInfo(socket.id)
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
                [this.clientManager.getPublicClientInfo(socket.id)]
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