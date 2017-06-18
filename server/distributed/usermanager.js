/**
 * Created by Mick on 13.06.2017.
 */


'use strict';

var LocalStrategy = require('passport-local').Strategy;
var UserDataManager = require('./userdatamanager');
var SharedConfig = require('./../../core/sharedconfig.json');
var Models = require('./model/useraccountdatamodel');
var UserAccountModel = Models.UserAccountModel;
var DeprecatedMailModel = Models.DeprecatedMailModel;

class UserManager {

    constructor(passport) {
        this.userDataManager = new UserDataManager();

        this.userDataManager.init(
            (e) => this._initRoutes(passport),
            (e) => console.error("ERROR DB CONNECT",e)
        );
    }

    /**
     * body: { username: 'adsfasdf',
  displayname: 'asdfasdf',
  password: 'asdfsadf',
  confirmpassword: 'asdfasdf',
  language: 'de',
  color: '4',
  agree: 'on' }
     query: {}
     * @param obj
     * @param field
     * @returns {*}
     */

    lookup(obj, field) {
        if (!obj) { return null; }
        var chain = field.split(']').join('').split('[');
        for (var i = 0, len = chain.length; i < len; i++) {
            var prop = obj[chain[i]];
            if (typeof(prop) === 'undefined') { return null; }
            if (typeof(prop) !== 'object') { return prop; }
            obj = prop;
        }
        return null;
    };

    /**
     *
     * @param req
     * @param callback {function} (request,user,error);
     * @returns {*}
     */
    updateUser(req,callback){

        var user = req.user;

        var mail = this.lookup(req.body, "email") || this.lookup(req.query, "email");
        var password = this.lookup(req.body, "password") || this.lookup(req.query, "password");
        var language = this.lookup(req.body, "language") || this.lookup(req.query, "language");
        var color = parseInt(this.lookup(req.body, "color") || this.lookup(req.query, "color"));

        var changes = [];

        // password change?
        if(password) {
            if(password.length < SharedConfig.MIN_PASSWORD_LENGTH
                || password.length > SharedConfig.MAX_PASSWORD_LENGTH){
                return callback(req,null,['incorrect_password_length']);
            }

            if(!user.validatePassword(password)){   // if password is not == the old password
                changes.push({key: "password", value: password});
            }
        }

        // color changed?
        if(!isNaN(color) && color >= 0 && color != user.color){
            changes.push({key: "color", value: color});
        }

        // language changed?
        if(language && language != user.preferredLanguage){
            changes.push({key: "preferredLanguage", value: language});
        }

        // mail changed?
        if(mail && mail != user.email){
            changes.push({
                key: "oldMailAdresses",
                value: new DeprecatedMailModel({
                    email:user.email,
                    verifiedOn:user.verifiedOn
                })
                , $push:true    // just push, dont delete old mails
            });

            // the new mail is now not vertified anymore, it has to get vertified again.
            changes.push({key:"verifiedOn",value:undefined});
            // also add the new mail
            changes.push({key:"email",value:mail});
        //TODO: resend vertification mail
        }

        this.userDataManager.updateUser(
            changes,
            user.id,
            (user)=>{   // success case
                req.flash('message', 'user_updated_successfully');
                return callback(req, user,null);
            },
            (e) =>{
                // error case
                // the ui just shows the message, so just send the messages - field names are not necessary in the ui
                for (var k in e) {
                    if (!e.hasOwnProperty([k])) continue;
                    req.flash('error', e[k]);
                }
                return callback(req,null,e);
            }
        );
    }

    _initRoutes(passport) {
        passport.serializeUser(function(user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function(id, done) {
            this.userDataManager.getUser({"id":id},
                (err,user) =>{
                    done(err, user);
                }
            );
           // done(null,this.userDataManager.getUser("id",id));        //TODO: error
        }.bind(this));

        // passport/login.js
        passport.use('login', new LocalStrategy(
                {
                    passReqToCallback: true
                },
                function (req, username, password, done) {
                    if(typeof username != "string" || typeof password != "string"){
                        return done(null, false, req.flash('error', 'wrong_input_format'));
                    }

                    this.userDataManager.login(
                        username,
                        password,
                        function (err,user) {
                            if(!user){
                                console.log('User Not Found with username ' + username);
                                return done(null, false,
                                    req.flash('error', 'user_or_pw_wrong'));
                            }
                            req.flash('message', 'user_login_successfully');
                            return done(null, user,req);
                        }
                    );
                }.bind(this)
            )
        );

        passport.use('signup-local',
            new LocalStrategy(  //TODO create own stragedy
                {
                    passReqToCallback : true
                },
                function(req, username, password, done) {

                    var mail = this.lookup(req.body, "email") || this.lookup(req.query, "email");
                    var name = username;
                    var language = this.lookup(req.body, "language") || this.lookup(req.query, "language");
                    var color = this.lookup(req.body, "color") || this.lookup(req.query, "color");
                    var agreed = this.lookup(req.body, "agree") || this.lookup(req.query, "agree");

                    agreed = (agreed === "true");

                    // db validation cannot be used, because the hash is stored there, and it is always equally long
                    if(!password
                        || password.length < SharedConfig.MIN_PASSWORD_LENGTH
                        || password.length > SharedConfig.MAX_PASSWORD_LENGTH){
                        return done(null, false,req.flash('error', 'incorrect_password_length'));
                    }


                    if(!agreed){
                        return done(null, false,req.flash('error', 'terms_and_conditions_not_agreed'));
                    }

                    if(color < 0){
                        return done(null, false,req.flash('error', 'no_color_chosen'));
                    }

                    this.userDataManager.createUser(
                        mail,
                        password,
                        name,
                        color,
                        language,
                        agreed,
                        null,
                        (user)=>{
                            req.flash('message', 'user_created_successfully');
                            return done(null, user,req);
                        },
                        (e) =>{
                            for (var k in e) {
                                if (!e.hasOwnProperty([k])) continue;
                                req.flash('error', e[k]);
                            }
                            return done(null, false,req);
                        }
                    );
                }.bind(this)
            )
        );

    }
}

module.exports = UserManager;