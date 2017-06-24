/**
 * Created by Mick on 08.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');



var GameConnectionHandler = require('./gameconnectionhandler');
var LobbyConnectionHandler = require('./lobbyconnectionhandler');

var ChatModule = require('./servermodules/chatmodule');
var LobbyOnlineUserModule = require('./servermodules/lobbyonlineusermodule');

class ConnectionHandler {

    constructor() {
        this.gameNsp = null;
        this.lobbyNsp = null;


    }

    start(io,options){
        this.io = io;
        this.gameNsp = this.io.of(Packages.NAMESPACES.GAME);
        this.lobbyNsp = this.io.of(Packages.NAMESPACES.LOBBY);

        this.gameConnectionHandler = new GameConnectionHandler(this.gameNsp);
        this.lobbyConnectionHandler = new LobbyConnectionHandler(this.lobbyNsp,options.userManager);

        this.lobbyConnectionHandler.use(new ChatModule());

      /*  this.gameNsp.on('connection', this.gameConnectionHandler._onConnectionReceived.bind(this.gameConnectionHandler));
        this.lobbyNsp.on('connection',this.lobbyConnectionHandler._onConnectionReceived.bind(this.lobbyConnectionHandler));*/
    }

}


module.exports = ConnectionHandler;