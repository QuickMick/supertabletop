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

var pubSubFactory = require("mq-pubsub").default;


class ConnectionHandler {

    constructor() {
        this.gameNsp = null;
        this.lobbyNsp = null;

        /**
         * connection the amqp message broker
         * @type {null}
         */
        this.pubSub = null;
    }

    start(io, options) {
        this.io = io;

        options = options || {};

        this.pubSub = options.pubSub || pubSubFactory(options.pubSubUrl || DBs.messageBroker.url);

        this.gameNsp = this.io.of(Packages.NAMESPACES.GAME);
        this.lobbyNsp = this.io.of(Packages.NAMESPACES.LOBBY);

        /**
         * add session middleware to the namespaces,
         * which shares the request-sessions with socket.io,
         * so that you have every information wich you also have in the get/post-routes
         */
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

            this.gameNsp.use(preventMultiSessions(redisClient,
                DBs.connectionHandlingDB_redis.prefixes.connection_handler,
                DBs.connectionHandlingDB_redis.tables.running_sessions,
                DBs.connectionHandlingDB_redis.tables.allocated_names
            ));
            this.lobbyNsp.use(preventMultiSessions(redisClient,
                DBs.connectionHandlingDB_redis.prefixes.connection_handler,
                DBs.connectionHandlingDB_redis.tables.running_sessions,
                DBs.connectionHandlingDB_redis.tables.allocated_names
            ));
        }

        this.gameConnectionHandler = new GameConnectionHandler(this.gameNsp);
        this.lobbyConnectionHandler = new LobbyConnectionHandler(this.lobbyNsp, this.pubSub, options.userManager);

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
function preventMultiSessions(redisClient,key,setNameRunningSessions){
    var redis = redisClient;
    var setKeyRunningSessions = key+":"+setNameRunningSessions;

    return function(socket,agree){
        if (!socket.request.session) {
            return agree(new Error('no_session_found'), false);
        }

        var user = socket.request.getNormalizedUser();

        if(!user){
            return agree(new Error('no_user_found'), false);
        }

        redis.sismember(setKeyRunningSessions,user.id,(e,k)=>{
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
            }, 5 * 1000);


            // add the user id to redis and add a event, which removes it again on disconnect
            redis.sadd([setKeyRunningSessions,user.id]);

            socket.on('disconnect', ()=> {
                console.log('A socket with sessionID ' + socket.request.sessionID+ ' disconnected!');
                clearInterval(intervalID);
                // remove the session token from redis, which is used to block multiple connections
                redis.srem(setKeyRunningSessions, user.id);
            });

            return agree(null, true);
        });
    }
}


module.exports = ConnectionHandler;