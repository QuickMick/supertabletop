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

    start(io, options) {
        this.io = io;


        this.gameNsp = this.io.of(Packages.NAMESPACES.GAME);
        this.lobbyNsp = this.io.of(Packages.NAMESPACES.LOBBY);


        this.gameNsp.on('connection', this._clientConnected.bind(this));
        this.lobbyNsp.on('connection', this._clientConnected.bind(this));

        this.gameConnectionHandler = new GameConnectionHandler(this.gameNsp);
        this.lobbyConnectionHandler = new LobbyConnectionHandler(this.lobbyNsp, options.userManager);

        this.lobbyConnectionHandler.use(new ChatModule());
        this.lobbyConnectionHandler.use(new LobbyOnlineUserModule());

        /*  this.gameNsp.on('connection', this.gameConnectionHandler._onConnectionReceived.bind(this.gameConnectionHandler));
         this.lobbyNsp.on('connection',this.lobbyConnectionHandler._onConnectionReceived.bind(this.lobbyConnectionHandler));*/
    }

    /**
     * check if the client is able to connect.
     * just one connection per session is allowed
     * @param socket
     * @private
     */
    _clientConnected(socket){

        // if player is connected in another tab, refues the connection
        if (socket.request.session.opened) {
            console.log(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_REJECTED);
            socket.emit(
                Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_REJECTED,

                Packages.createEvent(
                    this.ID,
                    {
                        reason: "cannot_open_tab_twice"
                    }
                )
            );
            socket.forceDisconnected = true;
            socket.disconnect();
            return;
        }

        // if player is not connected, mark him as connected
        socket.request.session.opened = true;
        socket.request.session.save();

        // if he disconnects, release him, so he can connect again
        socket.on('disconnect', ()=> {
                socket.request.session.opened = false;
                socket.request.session.save();
            }
        );
    }

}


module.exports = ConnectionHandler;