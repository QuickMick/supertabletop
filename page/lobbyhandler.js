/**
 * Created by Mick on 09.06.2017.
 */

'use strict';

var ChatHandler = require('./../public/javascripts/chathandler');
var LobbyConnectionHandler = require('./lobbyconnectionhandler');

var LoginDialog = require('./dialogs/logindialog');

class LobbyHandler {

    constructor() {

        this.lobbyConnectionHandler = new LobbyConnectionHandler();

        this.chatHandler = new ChatHandler("lobby-chat-container",false,150);

        var log_in_btn = document.getElementById("log-in");
        if(log_in_btn){
            log_in_btn.onclick = () => { new LoginDialog().show();}
        }
    }

    show(){
        this.lobbyConnectionHandler.start();
    }
}

module.exports = LobbyHandler;