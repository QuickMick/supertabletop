/**
 * Created by Mick on 13.06.2017.
 */


'use strict';

var LocalStrategy = require('passport-local').Strategy;
var UserDataManager = require('./userdatamanager');
var SharedConfig = require('./../../core/sharedconfig.json');

class UserManager {

    constructor(passport) {
        this.userDataManager = new UserDataManager();

        this.userDataManager.init(
            (e) => this._initRoutes(passport),
            (e) => console.error("ERROR DB CONNECT",e)
        );
    }

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


    _initRoutes(passport) {
        passport.serializeUser(function(user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function(id, done) {
            this.userDataManager.getUser("id",id,
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
                    var mail = username;
                    var displayname = this.lookup(req.body, "displayname") || this.lookup(req.query, "displayname");
                    var confirmpassword = this.lookup(req.body, "confirmpassword") || this.lookup(req.query, "confirmpassword");
                    var language = this.lookup(req.body, "language") || this.lookup(req.query, "language");
                    var color = this.lookup(req.body, "color") || this.lookup(req.query, "color");
                    var agreed = this.lookup(req.body, "agree") || this.lookup(req.query, "agree");

                    if(!password
                        || password.length < SharedConfig.MIN_PASSWORD_LENGTH
                        || password.length > SharedConfig.MAX_PASSWORD_LENGTH){
                        return done(null, false,req.flash('error', 'incorrect_password_length'));
                    }

                    if(password != confirmpassword){
                        return done(null, false,req.flash('error', 'password_confirmation_wrong'));
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
                        displayname,
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