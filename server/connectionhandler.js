/**
 * Created by Mick on 08.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');
const uuidV1 = require('uuid/v1');

var GameServer = require('./gameserver');

class ConnectionHandler {

    constructor(io) {



        /**
         * contains all game instances
         * @type {{id:GameServer}}
         */
        this.runningGames = {};

        this.startGame();       //TODO: sollte von spielenr aufgerufenwerden
    }

    start(io){
        this.io = io;
        this.io.on('connection', this._onConnectionReceived.bind(this));
    }

    _onConnectionReceived(socket){
        console.log("connection received from:"+socket.handshake.address);

        var gameID = socket.handshake.query.gameid;

        if(!gameID || !this.runningGames[gameID]) {
            socket.emit(Packages.PROTOCOL.SERVER.ERROR, {msg: "game_not_found"});       //TODO: entfernen
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

module.exports = new ConnectionHandler();