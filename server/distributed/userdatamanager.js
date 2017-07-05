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
var MailVerificationDataModel = UserEntry.MailVerificationModel;
var ACCOUNT_TYPE_ENUM = UserEntry.ACCOUNT_TYPE_ENUM;

const RANDOM_NAMES = require('./../../core/random_names.json');
const ADJECTIVES = require('./../../core/adjectives.json');


var Redis = require("redis");


var uuidv1 = require('uuid/V1');
//TODO use redis for user loading und des heir eigentlich als service -> die classe connectet zum service beim laden, aber saved alles im memcached
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



        this.redisClient = Redis.createClient({
            port: DBs.sessionStore_redis.port,
            host: DBs.sessionStore_redis.host,
            password: DBs.sessionStore_redis.password,
            db: DBs.sessionStore_redis.database
        });
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
                failCallback(UserDataManager.parseMongoErrors(err));
            });
        });
    }


    createVerification(userID,language, email, successCallback, failCallback) {
        var verification = new MailVerificationDataModel({
            userID:userID,
            language:language,
            email:email,
            token: uuidv1()
        });

        process.nextTick(function () {
            verification.save().then(function (v) {
                if (successCallback) {
                    successCallback(verification,v);
                }
            }, function (err) {
                if (!failCallback)return;
                failCallback(UserDataManager.parseMongoErrors(err));
            });
        });
    }

    /**
     * vertifies a mail account,
     * redeems a mailVertify token
     * @param token
     * @param callback
     */
    verifyMail(token,callback){
        if (!token) {
            callback({error: "wrong_input_parameters"}, null);
            return;
        }
        process.nextTick(() =>{
            MailVerificationDataModel.findOne({token:token}, // first find the database entry for the token
                (err, mailVerification) => {
                    // In case of any error, return using the done method
                    if (err) {
                        callback(err, null);
                        return null;
                    }
                    // Username does not exist, log error & redirect back
                    if (!mailVerification) {
                        callback({error: "verification_token_invalid"}, null);
                        return null;
                    }

                    // was already redeemed
                    if (mailVerification.redeemed) {
                        callback({error: "verification_already_redeemed"}, null);
                        return null;
                    }

                    // verification is expired
                    if (mailVerification.expiresOn.getTime() < new Date().getTime()) {
                        callback({error: "verification_expired"}, null);
                        return null;
                    }

                    // everything is fine
                    // update the user, that is mail is verified
                    this.updateUser(
                        [
                            {
                                key:"verifiedOn",
                                value: new Date()
                            }
                        ],
                        mailVerification.userID,
                        (s)=>{
                            // update the mailVerification, that it was redeemed
                            mailVerification.redeemed = true;
                            mailVerification.isNew = false;
                            process.nextTick(function () {
                                mailVerification.save().then(function (v) {
                                    // finally, callback, that the mail is verified
                                    callback(null, {message: "mail_verified"});
                                }, function (err) {
                                    callback(err, null);
                                });
                            });
                        },
                        (err)=>{
                            callback(err, null);
                        }
                    );
                }
            );
        });
    }

    /**
     * parsers the errrors received from mongo
     * @param err
     * @returns {{}}
     */
    static parseMongoErrors(err){
        var errors = {};

        if(!err){
            return errors;
        }

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
                        failCallback(UserDataManager.parseMongoErrors(err));
                        return;
                    }

                    // apply the passed changes to the userobject
                    for(var i=0; i< changes.length; i++){
                        var cur = changes[i];
                        if(!cur || !cur.key)continue; // if the object does not exist, or no key was passed --> continue
                        if(cur.$push){
                            if(!user[cur.key]) user[cur.key]=[];    //if array does not exist, create one
                            user[cur.key].push(cur.value);          // afterwards push value
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
                            failCallback(UserDataManager.parseMongoErrors(err));
                        });
                    });
                }
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
            callback({error: "wrong_input_parameters"}, null);
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

    getVerification(query, callback) {
        if (!query) {
            callback({error: "wrong_input_parameters"}, null);
            return;
        }
        process.nextTick(function () {
            MailVerificationDataModel.findOne(query, //{'id': id},
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

    updateVerification(changes, query, successCallback, failCallback) {
        if(!changes || changes.length <=0){
            successCallback({none:"no_changes_detected"});
        }

        // get the user, update the values, and save it again
        process.nextTick(function () {
            MailVerificationDataModel.findOne(query, //{'id': id},
                function (err, verification) {

                    // Username does not exist, log error & redirect back
                    if (!verification) {
                        if (!failCallback)return;
                        failCallback(UserDataManager.parseMongoErrors(err));
                        return;
                    }

                    // apply the passed changes to the userobject
                    for(var i=0; i< changes.length; i++){
                        var cur = changes[i];
                        if(!cur || !cur.key)continue; // if the object does not exist, or no key was passed --> continue
                        if(cur.$push){
                            if(!verification[cur.key]) verification[cur.key]=[];    //if array does not exist, create one
                            verification[cur.key].push(cur.value);          // afterwards push value
                        }else {
                            verification[cur.key] = cur.value;
                        }
                    }

                    // set to false, so it is not created as new object
                    verification.isNew = false;

                    process.nextTick(function () {
                        verification.save().then(function (v) {
                            if (successCallback) {
                                successCallback(verification,v);
                            }
                        }, function (err) {
                            if (!failCallback)return;
                            failCallback(UserDataManager.parseMongoErrors(err));
                        });
                    });
                }
            );
        });
    }

    /**
     * creates a ranom name for a guest
     * @param guestUserID
     * @param callback {function} callback(name,error)
     */
   /* getAndAllocateRandomGuestName(guestSessionID,callback){

            this.getRandomName(0, (name)=> {
                this.redisClient.hmset(
                    DBs.sessionStore_redis.prefix.session + DBs.sessionStore_redis.table.allocated_names,
                    name.toLowerCase(),
                    DBs.sessionStore_redis.prefix.id+guestSessionID,
                    (e, k)=> {
                        callback(name); // callback the created name
                    }
                );
            });

    }*/

    getAndAllocateRandomGuestName(guestSessionID,callback){

        this.getRandomName(0, (name)=> {
            this.redisClient.hmset(
                DBs.sessionStore_redis.prefix.session + DBs.sessionStore_redis.table.allocated_names,
                name.toLowerCase(),
                DBs.sessionStore_redis.prefix.id+guestSessionID+(this.i||""),
                (e, k)=> {
                    console.log(this.i,'save');
                    this.i = (this.i||0)+1;

                    if (this.i == 9999)
                        callback(name);
                    else{
                        this.getAndAllocateRandomGuestName(guestSessionID,callback);
                    }
                }
            );
        });

    }




    /**
     * get a random name. If the name is already assigned, take another one
     * @param allocatedNames {Set} contains the allocated names
     * @returns {*}
     */
    getRandomName(i=0,callback){

        var result = RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)];

        if(i>5){    // if it is called mare then 5 times recursively, then combine two random names
            result = ADJECTIVES[Math.floor(Math.random()*RANDOM_NAMES.length)]+"-"+RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)];
        }else if(i>10){
           // return this.getAlternativeNameIfOccupied(result);
            // force a name, if there is no free one found after 10 tries
            this.redisClient.hexists(DBs.sessionStore_redis.prefix.session+DBs.sessionStore_redis.table.allocated_names,(result+" ("+i+")").toLowerCase(),(e,k)=>{
                    if(e) return callback("unknown");  // error -> namecreation not possible
                    if(!k) {
                        return callback(result+" ("+(i-9)+")"); // name not in set -> done
                    }

                    i++;
                    this.getRandomName(i,callback);
                }
            );
        }

        this.redisClient.hexists(DBs.sessionStore_redis.prefix.session+DBs.sessionStore_redis.table.allocated_names,result.toLowerCase(),(e,k)=>{
                if(e) return callback("unknown");  // error -> namecreation not possible
            console.log("exists",k,e);
                if(!k) {
                    console.log("n",result);
                    return callback(result); // name not in set -> done
                }

                i++;
                this.getRandomName(i,callback);
            }
        );
    }
}

module.exports = UserDataManager;