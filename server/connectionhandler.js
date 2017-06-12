/**
 * Created by Mick on 08.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');



var GameConnectionHandler = require('./gameconnectionhandler');
var LobbyConnectionHandler = require('./lobbyconnectionhandler');

class ConnectionHandler {

    constructor(io) {
        this.gameNsp = null;
        this.lobbyNsp = null;


    }

    start(io){
        this.io = io;
        this.gameNsp = this.io.of(Packages.NAMESPACES.GAME);
        this.lobbyNsp = this.io.of(Packages.NAMESPACES.LOBBY);

        this.gameConnectionHandler = new GameConnectionHandler(this.gameNsp);
        this.lobbyConnectionHandler = new LobbyConnectionHandler(this.lobbyNsp);

      /*  this.gameNsp.on('connection', this.gameConnectionHandler._onConnectionReceived.bind(this.gameConnectionHandler));
        this.lobbyNsp.on('connection',this.lobbyConnectionHandler._onConnectionReceived.bind(this.lobbyConnectionHandler));*/
    }

}


module.exports = new ConnectionHandler();