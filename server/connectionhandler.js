/**
 * Created by Mick on 08.06.2017.
 */

'use strict';
var Packages = require('./../core/packages');


var GameConnectionHandler = require('./gameconnectionhandler');
var LobbyConnectionHandler = require('./lobbyconnectionhandler');

var ChatModule = require('./servermodules/chatmodule');
var LobbyOnlineUserModule = require('./servermodules/lobbyonlineusermodule');

var Redis = require("redis");
const DBs = require('./distributed/db.json');

const REDIS_CONNECTION_SET_PREFIX = "sc";

class ConnectionHandler {

    constructor() {
        this.gameNsp = null;
        this.lobbyNsp = null;
    }

    start(io, options) {
        this.io = io;



        this.gameNsp = this.io.of(Packages.NAMESPACES.GAME);
        this.lobbyNsp = this.io.of(Packages.NAMESPACES.LOBBY);

        if(options.sessionMiddleware) {
            this.gameNsp.use(options.sessionMiddleware);
            this.lobbyNsp.use(options.sessionMiddleware);

            var redisClient = Redis.createClient({
                port: DBs.connectionHandlingDB_redis.port,
                host: DBs.connectionHandlingDB_redis.host,
                password: DBs.connectionHandlingDB_redis.password,
                db: DBs.connectionHandlingDB_redis.database
            });

            redisClient.flushdb( function (err, succeeded) {
                console.log(succeeded); // will be true if successfull
            });

            this.gameNsp.use(preventMultiSessions(redisClient,REDIS_CONNECTION_SET_PREFIX));
            this.lobbyNsp.use(preventMultiSessions(redisClient,REDIS_CONNECTION_SET_PREFIX));
        }

        this.gameConnectionHandler = new GameConnectionHandler(this.gameNsp);
        this.lobbyConnectionHandler = new LobbyConnectionHandler(this.lobbyNsp, options.userManager);

        this.lobbyConnectionHandler.use(new ChatModule());
        this.lobbyConnectionHandler.use(new LobbyOnlineUserModule());
    }
}

/**
 * if a client connects, his id is saved in redis.
 * if he tries to connect again with the same user,
 * then the connection is blocked.
 * @param redisClient
 * @param key
 * @returns {Function}
 */
function preventMultiSessions(redisClient,key){
    var redis = redisClient;
    var setKey = key+":runningsessions";
    return function(socket,agree){
        if (!socket.request.session) {
            return agree(new Error('no_session_found'), false);
        }

        var user = socket.request.getNormalizedUser();

        if(!user){
            return agree(new Error('no_user_found'), false);
        }

        redis.sismember(setKey,user.id,(e,k)=>{
            if(e){
                return agree(new Error('unknown_error'), false);
            }
            if(k) { // if key is already in store
                return agree(new Error('cannot_open_tab_twice'), false);
            }

            //this is the firs connection of the client, initialize him

            // create a hearthbeat, so the session does not run out
            var intervalID = setInterval(function () {
                socket.request.session.reload( function () {
                    socket.request.session.touch().save();
                });
            }, 60 * 1000);


            // add the user id to redis and add a event, which removes it again on disconnect
            redis.sadd([setKey,user.id]);

            socket.on('disconnect', ()=> {
                console.log('A socket with sessionID ' + socket.request.sessionID+ ' disconnected!');
                clearInterval(intervalID);
                redis.srem(setKey, user.id);
            });

            return agree(null, true);
        });
    }
}


module.exports = ConnectionHandler;