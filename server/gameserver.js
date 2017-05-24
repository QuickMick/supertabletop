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


        this.entityServerManager.loadGame("mick","codewords"); //TODO nicht statisch machen und durch user triggern lassen
    }

    _onConnectionReceived(socket){
        socket.on(Packages.PROTOCOL.CLIENT.SEND_CLIENT_SESSION, function(data){
            //TODO check for login credentials, and if ok then connect and load clientinfo
            var clientInfo = {
                name:"ranz",
                color:Util.getRandomColor()
            };

            var clientAccepted = true; //TODO: check if client is accepted

            if(!clientAccepted){    //TODO: appropriate reason
                this._sendToClient(socket,Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_REJECTED,Packages.createEvent(this.ID,{"reason":"your are dumb"}));
                return;
            }

            // connect client to this server
            this.clientManager.clientConnected(socket,clientInfo);

            // share info with client (that he is connected and his own info)
            this._sendToClient(
                socket,
                Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
                this.clientManager.getPrivateClientInfo(socket.id)
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

            this._sendToClient(
                socket,
                Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
                Packages.createEvent(
                    this.ID,
                    {userInfo: this.clientManager.getPrivateClientInfo(socket.id)}
                )

            );

        }.bind(this));


        socket.on('disconnect', function(data){
            this.clientManager.clientDisconnected(socket,data);
            this._boradcastExceptSender(socket,Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,Packages.createEvent(this.ID,{id:socket.id}));
            //TODO: broadcast that client disconnects
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
/*
    _s_connected(clientSocket){
        var rc = this.getRandomColor();
        var name = "ranz";
        this.boradcastExceptSender(clientSocket,Packages.PROTOCOL.SERVER.CLIENT_CONNECTED,{msg:"",data:{id:clientSocket.id,color:rc,name:name}});

        this.connections[clientSocket.id] = {socket:clientSocket,color:rc,name:name};
        console.log("Connected: "+clientSocket.id+" Users: "+Object.keys(this.connections).length);

        if(this.admin == null){
            this.admin = clientSocket.id;
            console.log("Admin is now: "+this.admin);
        }


        this._sendToClient(clientSocket,Packages.PROTOCOL.SERVER.USER_INFO,{msg:"",data:{user_id:clientSocket.id,admin:this.admin == clientSocket.id}}); // true, wenn connected is admin


        this.game.entities = Object.keys(this.entities).map(function(key) {
            return this.entities[key];
        }.bind(this));
        this._sendToClient(clientSocket,Packages.PROTOCOL.SERVER.INIT_GAME,{msg:"",data:this.game});


        var keys = Object.keys(this.connections);
        for(var i=0; i<keys.length;i++){
            if(keys[i] == clientSocket.id)continue;
            this._sendToClient(clientSocket,Packages.PROTOCOL.SERVER.CLIENT_CONNECTED ,{msg:"",data: {id:keys[i],color:this.connections[keys[i]].color}});
        }

    }

    _s_disconnected(clientSocket,data){
        console.log("disconnect: "+clientSocket.id);

        this.boradcastExceptSender(clientSocket,Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,{msg:"",data:{id:clientSocket.id}});

        if (this.connections.hasOwnProperty(clientSocket.id)) {
            delete this.connections[clientSocket.id];
        }

        if(this.admin == clientSocket.id){
            this.admin = null;
            var keys = Object.keys(this.connections);
            if(keys.length > 0) {
                this.admin = keys[0];
             //   this._sendToClient(this.connections[this.admin].socket,Statics.PROTOCOL.CLIENT.USERINFO,{admin:true});
                console.log("Admin is now: "+this.admin);
            }
        }
    }
*/
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