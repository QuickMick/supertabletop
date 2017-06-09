/**
 * Created by Mick on 09.06.2017.
 */

'use strict';

var ChatHandler = require('./../public/javascripts/chathandler');

class LobbyHandler {

    constructor() {
        this.chatHandler = new ChatHandler("lobby-chat-container",false,150);
    }

    show(){

    }
}

module.exports = LobbyHandler;