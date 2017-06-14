/**
 * Created by Mick on 13.06.2017.
 */

'use strict';
const DBs = require('./db.json');
var bCrypt = require('bcrypt');
var mongoose = require('mongoose');


class UserDataManager {

    constructor() {

        var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
            replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };

        mongoose.connect(DBs.userDB.old, options);
       // mongoose.auth(DBs.userDB.user,DBs.userDB.pw);
        var conn = mongoose.connection;

        conn.on('error', console.error.bind(console, 'connection error:'));

        conn.once('open', function() {
            // Wait for the database connection to establish, then start the app.
        });

    }

    /**
     * logs in a user
     * @param user
     * @param password
     * @returns the user object, if login credentials were corectly, or null, if they were not correctly
     */
    login(user, password){
       // return bCrypt.compareSync(password, user.password);

        // TODO: impl
        if(user!="mick" || password!="test")
            return null;

        return {
            username:user
        };
    }

    /**
     * gets public user data based on id
     * @param id
     */
    getUser(user){
        console.log("getUser",user);
        //TODO: impl
        return {
            username:user.username
        };
    }
}

module.exports = UserDataManager;