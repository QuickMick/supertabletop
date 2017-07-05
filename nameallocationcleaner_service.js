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

const CLEAN_INTERVAL = 10*(1000*60*60); // 10 minutes

var clean = function(onDoneCallback) {
    console.log("perform cleansing action");
    var redisClient = Redis.createClient({
        port: DBs.sessionStore_redis.port,
        host: DBs.sessionStore_redis.host,
        password: DBs.sessionStore_redis.password,
        db: DBs.sessionStore_redis.database
    });

    const KEY_PATH = DBs.sessionStore_redis.prefix.session + DBs.sessionStore_redis.table.allocated_names;

    var x = redisClient.streamified('HSCAN');

    var remove = [];
    var lastName = "";
    x(KEY_PATH, '*')
        .on('data', function (data) {

            if (!data.startsWith(DBs.sessionStore_redis.prefix.id)) {
                lastName = data;
                return;
            }


            var id = data.replace(DBs.sessionStore_redis.prefix.id, "");

            let n = lastName;

            redisClient.exists(DBs.sessionStore_redis.prefix.session + id, (e, k)=> {
                if (!e && !k) {
                    remove.push(n);
                }
            });

        })
        .on('error', function (error) {
            console.log(error);
        })
        .on('end', function () {
            setTimeout(()=> {
                console.log("iteration done");

                if (!remove) {
                    console.log("remove list is null");
                    redisClient.quit();
                    console.log("done");
                    console.log("waiting for next operation...");
                    if(onDoneCallback)onDoneCallback();
                    return;
                }

                console.log("start cleaning");
                for (let i = 0; i < remove.length; i++) {
                    redisClient.hdel(KEY_PATH, remove[i], (e, k)=> {
                        //console.log(e,k);
                    });
                }
                console.log("done");
                console.log("waiting for next operation...");
                redisClient.quit();
                if(onDoneCallback)onDoneCallback();
            }, 1000);
        });
};

console.log("start name allocation cleaning service in intervall",CLEAN_INTERVAL,"ms =>",CLEAN_INTERVAL/60/60/1000,"min");

clean(()=>{
    setInterval(clean,CLEAN_INTERVAL);
});

