/**
 * Created by Mick on 12.06.2017.
 */

'use strict';

var EventEmitter3 = require('eventemitter3');
var Packages = require('./../core/packages');

const EVT_CHATMESSAGE_RECEIVED = 'chatmessagereceived';

class LobbyConnectionHandler extends EventEmitter3{

    constructor() {
        super();

        /**
         * once the client is connected,
         * he receives the ID of the server
         * @type {string}
         */
        this.connectedServerID = "";

        /**
         *  contains all necessary client infos.
         *  containts the data which is shown on the screen, if logged in
         * @type {object} like{
            id,
            color,
            name
            }
         */
        this.CLIENT_INFO = {};
    }

    start(){
        this.socket = require('socket.io-client').connect(Packages.NAMESPACES.LOBBY);

        this._initHandlers();
    }

    stop(){

    }

    _initHandlers(){
        this.socket.on(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED, this._onClientAccepted.bind(this));
        // if chat message from server is received
        this.socket.on(Packages.PROTOCOL.MODULES.CHAT.SERVER_CHAT_MSG, this._onChatMessageReceived.bind(this));
    }

    _removeHandlers(){
        this.socket.removeListener(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED, this._onClientAccepted.bind(this));

        // if chat message from server is received
        this.socket.removeListener(Packages.PROTOCOL.MODULES.CHAT.SERVER_CHAT_MSG, this._onChatMessageReceived.bind(this));
    }


    _onClientAccepted(evt) {
        if(this.connectedServerID && this.CLIENT_INFO) return;    // another received package could be from another game, to which the client is connected
            this.connectedServerID = evt.data.serverID;
        this.CLIENT_INFO = evt.data.clientInfo;

        console.log("Clientdata received");

        window.hideLoadingDialog();

        if(this.connectedServerID) return;
    }

    _onChatMessageReceived (evt) {
        if(!this._vertifyServer(evt.senderID)){console.log("message is not from server"); return; }
       // var from = this.playerManager.getPlayer(evt.data.clientID);
        //this.chatHandler.pushMessage(evt.data.message,evt.data.type,evt.timeStamp, from);
        this.emit(EVT_CHATMESSAGE_RECEIVED,evt);
    }

    /**
     * checks if id is the current server
     * @param id
     * @returns {*|boolean}
     * @private
     */
    _vertifyServer(id){
        return id && id == this.connectedServerID;
    }

    sendPackage(type, msg){
        this.socket.emit(type,msg);
    }

    sendChatMessage(msg){
        this.socket.emit(
            Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG,
            Packages.createEvent(this.CLIENT_INFO.id,{message:msg},this.CLIENT_INFO.token)
        );
    }
}

module.exports = LobbyConnectionHandler;