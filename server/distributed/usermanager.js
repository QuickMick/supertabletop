/**
 * Created by Mick on 13.06.2017.
 */


'use strict';

var LocalStrategy = require('passport-local').Strategy;
var UserDataManager = require('./userdatamanager');
var SharedConfig = require('./../../core/sharedconfig.json');
var Util = require('./../../core/util');
var Models = require('./model/useraccountdatamodel');
var UserAccountModel = Models.UserAccountModel;
var DeprecatedMailModel = Models.DeprecatedMailModel;

var Hosts = require('./hosts.json');


var I18N = require('./../../core/i18n');

var uuidv1 = require('uuid/V1');

var Mails = require('./../mails.json');
const nodemailer = require('nodemailer');

class UserManager {

    constructor(passport) {
        this.userDataManager = new UserDataManager();

        this.userDataManager.init(
            (e) => this._initRoutes(passport),
            (e) => console.error("ERROR DB CONNECT",e)
        );


        // create reusable transporter object using the default SMTP transport
        this.mailTransporter = nodemailer.createTransport({
            host: Hosts.MAIL.host,
            port: Hosts.MAIL.port,
            secure: Hosts.MAIL.secure, // secure:true for port 465, secure:false for port 587
            auth: {
                user: Hosts.MAIL.auth.user,
                pass: Hosts.MAIL.auth.password
            }
        });
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
     * sends an email to the user with a verification link it
     * and also creates a database "mailVerification" entry
     * @param user @type{User} user who has changed his mail
     * @param callback {function(error,success)}
     * @private
     */
    sendVerificationMail(user,callback){
        this.userDataManager.createVerification(user.id,
            user.email,
            (verification,v)=>{
                // get language of the user
                var lang = Mails[user.preferredLanguage || "en"];

                // setup email data with unicode symbols
                let mailOptions = {
                    from: Mails.account.sender, // sender address
                    to: user.email, // list of receivers
                    subject: lang.verify_mail_subject, // Subject line
                    text: I18N.replace(lang.verify_mail,Hosts.MAIL_VERIFICATION_LINK+verification.token), // plain text body
                    html: I18N.replace(lang.verify_mail_html,Hosts.MAIL_VERIFICATION_LINK+verification.token) // html body
                };

                // send mail with defined transport object
                this.mailTransporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        if(callback){
                            callback(error,null);
                        }
                        return console.log("SendMail:",error);
                    }
                    console.log('Message %s sent: %s', info.messageId, info.response);
                    if(callback){
                        callback(false,{message:"mail_sent_successfully"});
                    }
                });

            },
            (err)=>{
                console.log("sendVerification",err);
                if(callback){
                    callback(err,null);
                }
            }
        );
    }

    /**
     *
     * @param req
     * @param callback function(request,error,success)
     * @returns {*}
     */
    resendVerificationMail(req,callback){

        var mailAdress = this.lookup(req.body, "email") || this.lookup(req.query, "email");

        if(!mailAdress || typeof mailAdress != "string"){
            req.flash('error',"invalid_mail");
            return callback(req,true,null);
        }

        mailAdress = mailAdress.trim().toLowerCase();

        if(!Util.isValidMail(mailAdress)){
            req.flash('error',"invalid_mail");
            return callback(req,true,null);
        }

        this.userDataManager.getUser({"email":mailAdress},
            (err,user) =>{
                if(err || !user){
                    req.flash('error',"account_for_email_not_found");
                    return callback(req,true,null);
                }

                if(user.verifiedOn){
                    req.flash('message',"mail_already_verified");
                    return callback(req,null,true);
                }

                this.sendVerificationMail(user,
                    (err,success)=>{

                        if(err){
                            console.log("resendVerificationMail",err);
                            req.flash('error',"error_while_sending_verification");
                            return callback(req,true,null);
                        }

                        req.flash('message',"verification_successfully_sent");
                        return callback(req,true,null);
                    }
                );
            }
        );
    }

    /**
     *
     * @param req
     * @param callback function(request,success,error)
     */
    verifyMail(req,callback){
        var token = this.lookup(req.query,"t");

        if(!token){
            req.flash('error',"invalid_verification_token");
            callback(req,false,true);
            return;
        }

        this.userDataManager.verifyMail(token,(e,succes)=>{
            if(e) {
                for (var k in e) {
                    if (!e.hasOwnProperty([k])) continue;
                    req.flash('error', e[k]);
                }
                callback(req,false,true);
            }else{
                req.flash('message',"mail_verified");
                callback(req,true,false);
            }
        });
    }

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
                req.flash('error', 'incorrect_password_length');
                return callback(req,null,['incorrect_password_length']);
            }

            if(!user.validatePassword(password)){   // if password is not == the old password
                changes.push({key: "hash", value: password});
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
        var mailChanged = false;

        // mail changed?
        if(mail && mail != user.email){
            mailChanged=true;
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
                if(mailChanged){    // mail has to be verificated again, wehn it was changed
                    this.sendVerificationMail(user);
                }
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
                            this.sendVerificationMail(user);
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