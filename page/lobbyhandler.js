/**
 * Created by Mick on 09.06.2017.
 */

'use strict';

var ChatHandler = require('./../public/javascripts/chathandler');
var LobbyConnectionHandler = require('./lobbyconnectionhandler');

class LobbyHandler {

    constructor() {

        this.lobbyConnectionHandler = new LobbyConnectionHandler();

        this.chatHandler = new ChatHandler("lobby-chat-container",false,150);
    }

    start(){
        this.socket = require('socket.io-client').connect({
            query:"gameid="+GAME_ID
        });
    }

    show(){

    }
}

module.exports = LobbyHandler;