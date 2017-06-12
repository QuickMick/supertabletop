/**
 * Created by Mick on 12.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');
const uuidV1 = require('uuid/v1');


class LobbyConnectionHandler {

    constructor(io) {
        this.io = io;
        this.ID = uuidV1();
        this.io.on('connection', this._onConnectionReceived.bind(this));


    }

    _onConnectionReceived(socket){


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

module.exports = LobbyConnectionHandler;