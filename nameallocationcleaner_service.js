/**
 * Created by Mick on 05.07.2017.
 */

'use strict';

/**
 * this service is used to clean all allocated names from redis
 */


var Redis = require("redis");
require('node-redis-streamify')(Redis);
var DBs = require('./server/distributed/db.json');

const CLEAN_INTERVAL = 10*(1000*60); // 10 minutes

var clean = function(onDoneCallback) {
    console.log("perform cleansing action");
    var redisClient = Redis.createClient({
        port: DBs.sessionStore_redis.port,
        host: DBs.sessionStore_redis.host,
        password: DBs.sessionStore_redis.password,
        db: DBs.sessionStore_redis.database
    });

    const KEY_PATH = DBs.sessionStore_redis.prefix.session + DBs.sessionStore_redis.table.allocated_names;

    var lastName = "";
    redisClient.streamified('HSCAN')(KEY_PATH, '*')
        .on('data', function (data) {

            if (!data.startsWith(DBs.sessionStore_redis.prefix.id)) {
                lastName = data;
                return;
            }


            var id = data.replace(DBs.sessionStore_redis.prefix.id, "");

            let n = lastName;

            redisClient.exists(DBs.sessionStore_redis.prefix.session + id, (e, k)=> {
                if (!e && !k) {
                 //   remove.push(n);
                    redisClient.hdel(KEY_PATH, n, (e, k)=> {
                        console.log(n,e,k);
                    });
                }
            });
        })
        .on('error', function (error) {
            console.log(error);
        }).on('end', function () {
            console.log("done");
            console.log("waiting for next operation...");
        });
};

console.log("start name allocation cleaning service in intervall",CLEAN_INTERVAL,"ms =>",CLEAN_INTERVAL/60/1000,"min");

clean(()=>{
    setInterval(clean,CLEAN_INTERVAL);
});

