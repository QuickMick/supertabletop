/**
 * Created by Mick on 12.06.2017.
 */

'use strict';
var GameServer = require('./gameserver');
const uuidV1 = require('uuid/v1');

class GameConnectionHandler {

    constructor(io) {
        this.io = io;
        this.io.on('connection', this._onConnectionReceived.bind(this));

        /**
         * contains all game instances
         * @type {{id:GameServer}}
         */
        this.runningGames = {};

        this.startGame();       //TODO: sollte von spielenr aufgerufenwerden
    }

    _onConnectionReceived(socket){
        console.log("connection received from:"+socket.handshake.address);

        var gameID = socket.handshake.query.gameid;

        if(!gameID || !this.runningGames[gameID]) {
            socket.emit(Packages.PROTOCOL.SERVER.ERROR, {data:{reason:Packages.PROTOCOL.GAME_SERVER_ERRORS.GAME_NOT_FOUND}});       //TODO: entfernen
            console.log(socket.handshake.address,"wants to connect to an invalid seassion:",gameID);
            socket.disconnect();
            return;
        }

        var game = this.runningGames[gameID];

        if(game.isServerFull){
            socket.emit(Packages.PROTOCOL.SERVER.ERROR, {data:{reason:Packages.PROTOCOL.GAME_SERVER_ERRORS.NO_FREE_SLOT_AVAILABLE}});
            console.log(socket.handshake.address,"wants to connect to a full server:",gameID);
            socket.disconnect();
            return;
        }

        socket.join(gameID);

      /*  var onevent = socket.onevent;
        socket.onevent = function (packet) {
            onevent.call (this, packet);
            if(socket.request.session) {
                socket.request.session.touch();
            }
        };*/


        game.onConnectionReceived(socket);
    }

    startGame(){
        var gameID = "testID"; // uuidV1();
        console.log("starting new game with id",gameID);

        var newServer = new GameServer(this.io,gameID );
        // TODO: später anstat gameID, newServer.ID verwenden
        // gameID = newServer.ID;
        this.runningGames[gameID] = newServer;

        return gameID;
    }
}

module.exports = GameConnectionHandler;