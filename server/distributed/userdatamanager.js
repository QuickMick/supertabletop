/**
 * Created by Mick on 13.06.2017.
 */

'use strict';
const DBs = require('./db.json');
var bCrypt = require('bcrypt');
var mongoose = require('mongoose');

var UserEntry = require('./model/useraccountdatamodel');
var AccountLinkDataModel = UserEntry.AccountLinkModel;
var UserAccountDataModel = UserEntry.UserAccountModel;
var ACCOUNT_TYPE_ENUM = UserEntry.ACCOUNT_TYPE_ENUM;

var uuidv1 = require('uuid/V1');

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
            this.createUser("test@web.de","test","mick",0x9242f4,"de");
        }.bind(this));

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


    createUser(mail, password, displayName, color, language,linkedAccounts){

        var newUserID = uuidv1();
        var accounts = [];

        // create local account
        accounts.push(new AccountLinkDataModel({
            id: uuidv1(),
            type: ACCOUNT_TYPE_ENUM[0],
            userID: newUserID
        }));

        // TODO: add google, facebook, etc. later.
        if(linkedAccounts){

        }

        var user = new UserAccountDataModel({
            id                  : newUserID,
            email               : mail,
            hash                : password,
            displayName         : displayName,
            color               : color,
            preferredLanguage   : language,
            linkedAccounts      : account,
            verifiedOn          : accounts.length <=1?null:Date.now // if there are more accounts, then it is google or fb or something else, then set as verified.
        });

        process.nextTick(function() {
            user.save().then(function (v) {
                console.log("created account", v);
            }, function (err) {
                console.log("error:", err);
            });
        });
    }

    linkAccount(userID){

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