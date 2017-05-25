/**
 * Created by Mick on 19.05.2017.
 */
'use strict';


var Packages = require('./../core/packages');
var Util = require('./../core/util');

const uuidV4 = require('uuid/v4');
/*var Statics = require('./../core/statics');





var Path = require('path');
var Config = require('./../public/resources/config.json');*/

var EntityServerManager = require('./entityservermanager');
var ClientManager = require('./clientmanager');

class GameServer{

    constructor(io){
        this.io = io;
        this.ID = uuidV4();
        this.entityServerManager = new EntityServerManager();
        this.clientManager = new ClientManager();
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
        if(!this.entityServerManager.entityUpdateQueue.updateRequired) return;

        this._boradcast(Packages.PROTOCOL.SERVER.UPDATE_STATE,Packages.createEvent(
            this.ID,
            this.entityServerManager.entityUpdateQueue.getUpdatedEntityData()
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
            this.entityServerManager.processPlayerUpdates(evt.data);
        }.bind(this));

            // client.on('event', function(data){console.log("evt")});
            /*
             client.on(Statics.PROTOCOL.CLIENT.DRAG_START,
             function(data){

             if(this.entities[data.data.id].grabbedBy) return;

             this.entities[data.data.id].alpha = data.data.alpha;
             this.entities[data.data.id].scale = data.data.scale;
             this.entities[data.data.id].grabbedBy = client.id;
             data.data.grabbedBy = client.id;
             this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.DRAG_START,data);
             }.bind(this)
             );

             client.on(Statics.PROTOCOL.CLIENT.DRAG_END,
             function(data){
             if(this.entities[data.data.id].grabbedBy != client.id) return;
             this.entities[data.data.id].alpha = data.data.alpha;
             this.entities[data.data.id].scale = data.data.scale;
             this.entities[data.data.id].grabbedBy = undefined;
             this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.DRAG_END,data);
             }.bind(this)
             );

             client.on(Statics.PROTOCOL.CLIENT.DRAG_MOVE,
             function(data){
             if(this.entities[data.data.id].grabbedBy != client.id) return;
             this.entities[data.data.id].position.x = data.data.x;
             this.entities[data.data.id].position.y = data.data.y;
             this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.DRAG_MOVE,data);
             }.bind(this)
             );

             client.on(Statics.PROTOCOL.CLIENT.TURN_CARD,
             function(data){
             if(this.entities[data.data.id].grabbedBy && this.entities[data.data.id].grabbedBy != client.id) return;
             this.entities[data.data.id].top = data.data.top;
             this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.TURN_CARD,data);
             }.bind(this)
             );


             client.on(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,
             function(data){
             data.data.id = client.id;
             this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,data);
             }.bind(this)
             );
             */

            /*
             for (var k in this.entities) {
             if (!this.entities.hasOwnProperty(k))
             continue;
             this._sendToClient(client,Statics.PROTOCOL.SERVER.ADD_ENTITY,{msg:"",data:this.entities[k]});
             }*/

    }


    initClient(socket){

        // TODO: load clientinfo from database
        var clientInfo = {
            name:"ranz",
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
                {clientInfo:this.clientManager.getPrivateClientInfo(socket.id)}
            )
        );

        // share public info of newly connected client with everyone
        this._boradcastExceptSender(
            socket,
            Packages.PROTOCOL.SERVER.CLIENT_CONNECTED,
            Packages.createEvent(
                this.ID,
                {connectedClient: this.clientManager.getPublicClientInfo(socket.id)}
            )
        );

        // share info about the current serverstate with the newly connected client
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.INIT_GAME,
            Packages.createEvent(
                this.ID,
                {game: this.entityServerManager.getCurrentGameState()}
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