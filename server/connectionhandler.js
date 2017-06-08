/**
 * Created by Mick on 08.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');
const uuidV1 = require('uuid/v1');

var GameServer = require('./gameserver');

class ConnectionHandler {

    constructor(io) {
        this.io = io;
        this.io.on('connection', this._onConnectionReceived.bind(this));


        /**
         * contains all game instances
         * @type {{id:GameServer}}
         */
        this.runningGames = {};

        this.startGame();
    }

    _onConnectionReceived(socket){
        console.log("connection received from:"+socket.handshake.address);

        var gameID = socket.handshake.query.gameid;

        if(!gameID || !this.runningGames[gameID]) {
            socket.emit(Packages.PROTOCOL.SERVER.ERROR, {msg: "game_not_found - neuer link ist jetz http://92.219.114.19:3000/?id=testID&lang=en-EN (lang kann auch auf e-DE gesetzt werden)"});       //TODO: entfernen
            console.log(socket.handshake.address,"wants to connect to an invalid seassion:",gameID);
            socket.disconnect();
            return;
        }

        var game = this.runningGames[gameID];

        if(game.isServerFull){
            socket.emit(Packages.PROTOCOL.SERVER.ERROR, {msg: "server_full"});
            console.log(socket.handshake.address,"wants to connect to a full server:",gameID);
            socket.disconnect();
            return;
        }

        game.onConnectionReceived(socket);
    }


    startGame(){
        var gameID = "testID"; // uuidV1();
        console.log("starting new game with id",gameID);
        this.runningGames[gameID] = new GameServer();

        return gameID;
    }

}

module.exports = ConnectionHandler;