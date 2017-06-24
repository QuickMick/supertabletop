/**
 * Created by Mick on 12.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');

var Util = require('./../core/util');

const uuidV1 = require('uuid/v1');

// TODO: von baseserver ableiten
class LobbyConnectionHandler {

    /**
     *
     * @param io
     * @param serverModules
     */
    constructor(io,userManager) {
        this.io = io;
        this.userManager = userManager;

        this.ID = uuidV1();

        this.io.on('connection', this._onConnectionReceived.bind(this));

        this.serverModules = [];

        /**
         * contains all sockets of the connected clients
         * necessary for broadcast
         * @type {Array}
         */
        this.allSockets = [];
    }

    use(serverModule){
        if(!serverModule)
            throw "passed module does not exist";

        this.serverModules.push(serverModule);
        serverModule.init({
            SERVER_ID:this.ID,
            _broadcast:this._broadcast.bind(this),
            _broadcastExpectSender:this._broadcastExceptSender.bind(this),
            _sendToClient:this._sendToClient.bind(this)
        })
    }

    _onConnectionReceived(socket){
        socket.on('disconnect', this._onDisconnect.bind({self:this,socket:socket}));

        this.allSockets.push(socket);

        for(var i=0; i< this.serverModules.length; i++){
            this.serverModules[i].onConnectionReceived(socket);
        }

        // share info with client (that he is connected and his own info)
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
            Packages.createEvent(
                this.ID,
                {
                    clientInfo:{},
                    serverID: this.ID
                }
            )
        );
    }

    _onDisconnect (data) {
        if(!data){
            console.log("disconnect: no data received");
            return;
        }

        for(var i=0; i< this.self.serverModules.length; i++){
            this.self.serverModules[i].onConnectionLost(this.socket);
        }

        this.self.allSockets = Util.removeByValue(this.self.allSockets,this.socket);


        if(!this.socket.request.session) return; //TODO: remove

        this.self._broadcastExceptSender(
            this.socket,
            Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,
            Packages.createEvent(
                this.self.ID,
                {id: this.socket.request.session.USER_ID} //this.socket.id}
            )
        );
    }


    _broadcast(type,msg){
        //this.io.sockets.emit(type,msg);
        this.io.emit(type,msg);
    }

    _broadcastExceptSender(senderSocket, type, msg){
        senderSocket.broadcast.emit(type,msg);
    }

    _sendToClient(clientConnectionSocket,type,msg){
        clientConnectionSocket.emit(type,msg);
    }
}

module.exports = LobbyConnectionHandler;