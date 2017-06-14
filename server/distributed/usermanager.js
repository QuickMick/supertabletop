/**
 * Created by Mick on 13.06.2017.
 */


'use strict';

var LocalStrategy = require('passport-local').Strategy;
var UserDataManager = require('./userdatamanager');

class UserManager {

    constructor(passport) {
        this.userDataManager = new UserDataManager();




        this._initRoutes(passport);
    }

    _initRoutes(passport) {


        passport.serializeUser(function(user, done) {
            console.log("serializeUser",user);
            done(null, user);
        });

        passport.deserializeUser(function(id, done) {
            done(null,this.userDataManager.getUser(id));        //TODO: error
        }.bind(this));

        // passport/login.js
        passport.use('login', new LocalStrategy({
                passReqToCallback: true
            },
            function (req, username, password, done) {
                if(typeof username != "string" || typeof password != "string"){
                    return done(null, false,
                        req.flash('error', 'wrong_input_format'));
                }

                var user = this.userDataManager.login(username,password);

                if(!user){
                    console.log('User Not Found with username ' + username);
                    return done(null, false,
                        req.flash('error', 'user_or_pw_wrong'));
                }
                req.flash('message', 'user_login_successfully');
                return done(null, user,req);

                // check in mongo if a user with username exists or not
                /*User.findOne({'username': username},
                    function (err, user) {
                        // In case of any error, return using the done method
                        if (err)
                            return done(err);
                        // Username does not exist, log error & redirect back
                        if (!user) {
                            console.log('User Not Found with username ' + username);
                            return done(null, false,
                                req.flash('message', 'User Not found.'));
                        }
                        // User exists but wrong password, log the error
                        if (!isValidPassword(user, password)) {
                            console.log('Invalid Password');
                            return done(null, false,
                                req.flash('message', 'Invalid Password'));
                        }
                        // User and password both match, return user from
                        // done method which will be treated like success
                        return done(null, user);
                    }
                );*/
            }.bind(this)));





        passport.use('signup',
            new LocalStrategy(
                {
                    passReqToCallback : true
                },
                function(req, username, password, done) {
                    /*var findOrCreateUser = function(){
                        // find a user in Mongo with provided username
                        User.findOne({'username':username},function(err, user) {
                            // In case of any error return
                            if (err){
                                console.log('Error in SignUp: '+err);
                                return done(err);
                            }
                            // already exists
                            if (user) {
                                console.log('User already exists');
                                return done(null, false,
                                    req.flash('message','User Already Exists'));
                            } else {
                                // if there is no user with that email
                                // create the user
                                var newUser = new User();
                                // set the user's local credentials
                                newUser.username = username;
                                newUser.password = createHash(password);
                                newUser.email = req.param('email');
                                newUser.firstName = req.param('firstName');
                                newUser.lastName = req.param('lastName');

                                // save the user
                                newUser.save(function(err) {
                                    if (err){
                                        console.log('Error in Saving user: '+err);
                                        throw err;
                                    }
                                    console.log('User Registration succesful');
                                    return done(null, newUser);
                                });
                            }
                        });
                    };

                    // Delay the execution of findOrCreateUser and execute
                    // the method in the next tick of the event loop
                    process.nextTick(findOrCreateUser);*/
                }
            )
        );




    }
}

module.exports = UserManager;