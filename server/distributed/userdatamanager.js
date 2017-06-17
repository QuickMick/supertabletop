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
//TODO use memcached und des heir eigentlich als service -> die classe connectet zum service beim laden, aber saved alles im memcached
class UserDataManager {

    constructor() {


    }

    init(successCallback,errorCallback) {
        var options = {
            server: {socketOptions: {keepAlive: 300000, connectTimeoutMS: 30000}},
            replset: {socketOptions: {keepAlive: 300000, connectTimeoutMS: 30000}}
        };

        mongoose.connect(DBs.userDB.old, options);
        // mongoose.auth(DBs.userDB.user,DBs.userDB.pw);
        var conn = mongoose.connection;

        conn.on('error', errorCallback);

        conn.once('open', successCallback);

    }

    /**
     * logs in a user
     * @param email
     * @param password
     * @param callback @type{function}
     * @returns the user object, if login credentials were corectly, or null, if they were not correctly
     */
    login(email, password,callback) {
        if(!email || typeof email != "string" || !password || typeof password != "string"){
            callback({message:"invalid_input"},null);
        }

        // check if the passed value is found as mail or as username
        var x=email.toLowerCase();
        this.getUser( //{"email":email.toLowerCase()},
            {
                $or: [
                    {email: x},
                    {name: x}
                ]
            },
            (err,user)=>{
                if (err) {
                    callback(err,null);
                    return null;
                }

                if(!user){
                    callback({message:"user_not_found"},null);
                    return;
                }

                // User exists but wrong password, log the error
                if (!user.validatePassword(password)) {
                    console.log('Invalid Password');
                    callback(err,null);
                    return null;
                }
                // User and password both match, return user from
                // done method which will be treated like success
                callback(err,user);
                return user;
            }
        );
    }


    /**
     *
     * @param mail @type{string]
     * @param password @type{string]
     * @param name @type{string]
     * @param color @type{number]
     * @param language @type{string]
     * @param linkedAccounts
     * @param successCallback @type{function]
     * @param failCallback @type{function]  returns: {{fieldName:errorMessage}} also can contain a field called "code" with an errorcode
     */
    createUser(mail, password, name, color, language, agreed, linkedAccounts, successCallback, failCallback) {

        var newUserID = uuidv1();
        var accounts = [];

        // create local account
        accounts.push(new AccountLinkDataModel({
            id: uuidv1(),
            type: ACCOUNT_TYPE_ENUM[0],
            userID: newUserID
        }));


        if (linkedAccounts) {
            // TODO: add google, facebook, etc. later.
        }

        var user = new UserAccountDataModel({
            id: newUserID,
            email: mail || undefined,
            hash: password || undefined,
            name: name || undefined,
            displayName: name || undefined,
            color: color,
            preferredLanguage: language || undefined,
            linkedAccounts: accounts,
            agreedTAC:agreed,
            verifiedOn: accounts.length <= 1 ? null : Date.now // if there are more accounts, then it is google or fb or something else, then set as verified.
        });

        process.nextTick(function () {
            user.save().then(function (v) {
                if (successCallback) {
                    successCallback(user,v);
                }
            }, function (err) {
                if (!failCallback)return;
                failCallback(this.parseMongoErrors(err));
            }.bind(this));
        }.bind(this));
    }

    /**
     * parsers the errrors received from mongo
     * @param err
     * @returns {{}}
     */
    parseMongoErrors(err){
        var errors = {};
        for (var k in err.errors) {

            if (!err.errors.hasOwnProperty([k])) continue;
            var cur = err.errors[k];
            // errors.push({type:k,message:cur.message});
            var r = "";
            switch(cur.properties.type){
                case 'required' : r="value_require"; break;
                case 'enum' : r="value_not_defined"; break;
                default: r=cur.message; break;
            }
            errors[k] = r;
        }

        if (err.code || err.code == 0) {
            // see https://github.com/mongodb/mongo/blob/master/src/mongo/base/error_codes.err
            // errors.push({type:"code",message:err.code});
            errors.code = err.code+"";
        }

        return errors;
    }


    /**
     *
     * @param changes @type{Array} one element contains {key:field, value:newValue}
     * @param user Userinstance (model) of the user which should be changed
     * @param successCallback
     * @param failCallback
     */
    updateUser(changes, userID, successCallback, failCallback) {

        if(!changes || changes.length <=0){
            successCallback({none:"no_changes_detected"});
        }

        // get the user, update the values, and save it again
        process.nextTick(function () {
            UserAccountDataModel.findOne({"id":userID}, //{'id': id},
                function (err, user) {

                    // Username does not exist, log error & redirect back
                    if (!user) {
                        if (!failCallback)return;
                        failCallback(this.parseMongoErrors(err));
                    }

                    // apply the passed changes to the userobject
                    for(var i=0; i< changes.length; i++){
                        var cur = changes[i];
                        if(!cur || !cur.key)continue; // if the object does not exist, or no key was passed --> continue

                        if(user[cur.key].$push){
                            user[cur.key].push(cur.value);
                        }else {
                            user[cur.key] = cur.value;
                        }
                    }

                    // set to false, so it is not created as new object
                    user.isNew = false;

                    process.nextTick(function () {
                        user.save().then(function (v) {
                            if (successCallback) {
                                successCallback(user,v);
                            }
                        }, function (err) {
                            if (!failCallback)return;
                            failCallback(this.parseMongoErrors(err));
                        }.bind(this));
                    }.bind(this));
                }.bind(this)
            );
        });
    }

    linkAccount(userID) {
        //TODO:
    }

    /**
     * gets public user data based on id
     *
     * also query is allowed e.g.  {$or: [
         {email: req.body.email},
         {phone: req.body.phone}
         ]}
     * @param query {object like {key:value}
     * @param callback @type{function} the value will be passed as 2nd parameter to the callback, first parameter is the error
     */
    getUser(query, callback) {
        if (!query) {
            callback({message: "wrong_input_parameters"}, null);
            return;
        }
        process.nextTick(function () {
            UserAccountDataModel.findOne(query, //{'id': id},
                function (err, user) {
                    // In case of any error, return using the done method
                    if (err) {
                        callback(err, null);
                        return null;
                    }
                    // Username does not exist, log error & redirect back
                    if (!user) {
                        //       console.log('User Not Found with username ' + email);
                        callback(err, null);
                        return null;
                    }
                    callback(err, user);
                    return user;
                }
            );
        });
    }
}

module.exports = UserDataManager;