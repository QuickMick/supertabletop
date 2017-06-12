/**
 * Created by Mick on 12.06.2017.
 */

'use strict';

class LobbyConnectionHandler {

    constructor(io) {
        this.io = io;
        this.io.on('connection', this._onConnectionReceived.bind(this));
    }

    _onConnectionReceived(socket){

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