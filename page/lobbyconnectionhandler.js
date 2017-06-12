/**
 * Created by Mick on 12.06.2017.
 */

'use strict';

var EventEmitter3 = require('eventemitter3');
var Packages = require('./../core/packages');

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

    init(){
        this.socket = require('socket.io-client').connect({
            query:"gameid="+GAME_ID
        });

        this._initHandlers();
    }

    stop(){

    }

    _initHandlers(){
        this.socket.on(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED, this._onClientAccepted.bind(this));
    }

    _removeHandlers(){
        this.socket.on(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED, this._onClientAccepted.bind(this));
    }


    _onClientAccepted(evt) {
        if(this.connectedServerID && this.CLIENT_INFO) return;    // another received package could be from another game, to which the client is connected
        this.connectedServerID = evt.data.serverID;
        this.CLIENT_INFO = evt.data.clientInfo;

        if(this.connectedServerID) return;

        console.log("Clientdata received");


        window.hideLoadingDialog();
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
            Packages.PROTOCOL.CHAT.CLIENT_CHAT_MSG,
            Packages.createEvent(this.CLIENT_INFO.id,{message:msg},this.CLIENT_INFO.token)
        );
    }
}

module.exports = LobbyConnectionHandler;