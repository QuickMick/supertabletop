/**
 * Created by Mick on 12.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');

var Util = require('./../core/util');

const uuidV1 = require('uuid/v1');

//var Redis = require("redis");
//const DBs = require('./distributed/db.json');


// TODO: von baseserver ableiten
class LobbyConnectionHandler {

    /**
     *
     * @param io
     * @param serverModules
     */
    constructor(io, pubSub, userManager) {
        this.io = io;
        this.pubSub = pubSub;
        this.userManager = userManager;

        this.ID = uuidV1();

        this.io.on('connection', this._onConnectionReceived.bind(this));

        this.serverModules = [];

        /**
         * contains all sockets of the connected clients
         * necessary for broadcast
         * @type {Array}
         */
       //  this.allSockets = [];
/*

        this.redis = Redis.createClient({
            port: DBs.lobbyDB_redis.port,
            host: DBs.lobbyDB_redis.host,
            password: DBs.lobbyDB_redis.password,
            db: DBs.lobbyDB_redis.database
        });

        this.redis.on("error", function (err) {
            console.log("LobbyConnectionHandler;Redis-Error " + err);
        });



        this.redis.set("string key", "string val", Redis.print);
        this.redis.hset("hash key", "hashtest 1", "some value", Redis.print);
        this.redis.hset(["hash key", "hashtest 2", "some other value"], Redis.print);
        this.redis.hkeys("hash key",  (err, replies) =>{
            console.log(replies.length + " replies:");
            replies.forEach( (reply, i) =>{
                console.log("    " + i + ": " + reply);
            });
            this.redis.quit();
        });*/
    }

    use(serverModule) {
        if (!serverModule)
            throw "passed module does not exist";

        this.serverModules.push(serverModule);
        serverModule.init({
            SERVER_ID: this.ID,
            _broadcast: this._broadcast.bind(this),
            _broadcastExceptSender: this._broadcastExceptSender.bind(this),
            _sendToClient: this._sendToClient.bind(this),
            _pubSub:this.pubSub
        })
    }

    _onConnectionReceived(socket) {

        if(socket.forceDisconnected) return;

        socket.on('disconnect', this._onDisconnect.bind({self: this, socket: socket}));

        // create a function, which normalizes the user
        // socket.getNormalizedUser = function () {
        //     return this.request.user || this.request.session.guestUser;/* {
        //             displayName: this.request.session.guestName,
        //             id: this.request.session.TMP_SESSION_USER_ID,
        //             status: 0 // 0 is equal to "guest"
        //         };*/
        // };

        // share info with client (that he is connected and his own info)
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
            Packages.createEvent(
                this.ID,
                {
                    clientInfo: {
                        id: (socket.request.getNormalizedUser() || {}).id
                    },
                    serverID: this.ID
                }
            )
        );

        for (var i = 0; i < this.serverModules.length; i++) {
            this.serverModules[i].onConnectionReceived(socket);
        }
    }

    _onDisconnect(data) {
        if (!data) {
            console.log("disconnect: no data received");
            return;
        }

        for (var i = 0; i < this.self.serverModules.length; i++) {
            this.self.serverModules[i].onConnectionLost(this.socket);
        }

        if (!this.socket.request.session) return; //TODO: remove

     /*   this.self._broadcastExceptSender(
            this.socket,
            Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,
            Packages.createEvent(
                this.self.ID,
                {id: this.socket.request.session.TMP_SESSION_USER_ID} //this.socket.id}
            )
        );*/
    }


    _broadcast(type, msg) {
        this.io.emit(type, msg);
    }

    _broadcastExceptSender(senderSocket, type, msg) {
        senderSocket.broadcast.emit(type, msg);
    }

    _sendToClient(clientConnectionSocket, type, msg) {
        clientConnectionSocket.emit(type, msg);
    }
}

module.exports = LobbyConnectionHandler;