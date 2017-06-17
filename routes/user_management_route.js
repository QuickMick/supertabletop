/**
 * Created by Mick on 13.06.2017.
 */

'use strict';

var express = require('express');
var router = express.Router();

var LanguageMiddleware = require('./LanguageMiddleware');

var Util = require('./../core/util');

const Colors = require('./../public/resources/colors.json');

var HTML_COLORS = [];
// convert the player colors to html colors
for(var i=0; i< Colors.PLAYERS_COLORS.length;i++){
    HTML_COLORS.push(Util.intToColorString(parseInt(Colors.PLAYERS_COLORS[i])));
}

module.exports = function(passport,userManager){

    router.get('/login',
        LanguageMiddleware,
        function(data,req, res,next){
            if (req.isAuthenticated()) {    // no need for logging in again
                res.redirect('/');
                return;
            }

            res.render('login',{
                messages: req.flash('message'),
                errors:req.flash('error'),
                I18N:data.i18n
                }
            );
        }
    );

    /* GET Registration Page */
    router.get('/signup',
        LanguageMiddleware,
        function(data,req, res,next){

            if(req.isAuthenticated()){  // if already logged in, redirect to lobby
                res.redirect("/");
            }

            res.render('signup',{
                    messages: req.flash('message'),
                    errors:req.flash('error'),
                    I18N:data.i18n,
                    LANGUAGES:data.languages,
                    languageID:data.languageID,
                    COLOR_NAMES:Colors.PLAYERS_COLOR_NAMES,
                    COLOR_VALUES:HTML_COLORS,
                    fs: {
                        translate:data.translate
                    }
                }
            );
        }
    );


    /* Handle Logout */
    router.get('/logout', function(req, res) {
        req.logout();
        req.flash('message', "log_out");

        req.session.destroy(function (err) {
            res.redirect('/'); //Inside a callback… bulletproof! //TODO: redirect to logout page
        });
    });


    router.post('/login', function(req, res, next) {
        passport.authenticate('login',/*{
            successRedirect: '/'
        },*/ function(error, user, info) {

            var isAjaxCall = req.body.async;
             if(req.isAuthenticated()){  // if already logged in, redirect to lobby
                res.status(400);

                req.flash('message',"already_logged_in");

                if(!isAjaxCall){
                    res.redirect('/');
                    return res;
                }

                return res.json({
                    messages: req.flash('message'),
                    errors:req.flash('error')
                });
            }

            if(error || !user) {
                res.status(550);
                if(!isAjaxCall){
                    res.redirect('/login');
                    return res;
                }

                return res.json({
                        messages: req.flash('message'),
                        errors:req.flash('error')
                    }
                );
            }

            req.logIn(user, function(err) {
                if (err) {
                    res.status(400);
                    if(!isAjaxCall){
                        res.redirect('/login');
                        return res;
                    }

                    return res.json({
                        messages: req.flash('message'),
                        errors:req.flash('error')
                    });
                }

                res.status(200);

                if(!isAjaxCall){
                    res.redirect('/login');
                    return res;
                }
                return res.json({
                    messages: req.flash('message'),
                    errors:req.flash('error'),
                    success:true
                });
            });

        })(req, res, next);
    });

    router.post('/signup-local', function(req, res, next) {
        passport.authenticate('signup-local',/*{
            successRedirect: '/'
        },*/ function(error, user, info) {
            var isAjaxCall = req.body.async;
            if(req.isAuthenticated()){  // if already logged in, redirect to lobby
                res.status(400);

                req.flash('message',"already_logged_in");

                if(!isAjaxCall){
                    res.redirect('/');
                    return res;
                }

                return res.json({
                    messages: req.flash('message'),
                    errors:req.flash('error')
                });
            }

            if(error || !user) {
                res.status(550);
                if(!isAjaxCall){
                    res.redirect('/signup');
                    return res;
                }

                return res.json({
                        messages: req.flash('message'),
                        errors:req.flash('error')
                    }
                );
            }

            req.logIn(user, function(err) {
                if (err) {
                    res.status(400);
                    if(!isAjaxCall){
                        res.redirect('/login');
                        return res;
                    }

                    return res.json({
                        messages: req.flash('message'),
                        errors:req.flash('error')
                    });
                }

                res.status(200);

                if(!isAjaxCall){
                    res.redirect('/');
                    return res;
                }
                return res.json({
                    messages: req.flash('message'),
                    errors:req.flash('error'),
                    success:true
                });
            });

        })(req, res, next);
    });


    router.post('/update-profile', function(req, res, next) {
            if(!req.isAuthenticated()){
                res.status(550);
                req.flash('error',"not_authenticated");
                return res.json({
                    messages: req.flash('message'),
                    errors:req.flash('error')
                });
            }
            userManager.updateUser(req,
                (e)=>{
                    res.json({
                        messages: req.flash('message'),
                        errors:req.flash('error'),
                        success:true
                    });
                },
                (e)=>{
                    res.json({
                        messages: req.flash('message'),
                        errors:req.flash('error'),
                        success:true
                    });
                }

            );
           /* return res.json({
            messages: req.flash('message'),
            errors:req.flash('error'),
            success:true
        });*/
    });

    /*
     router.get('/', function(req, res) {
     // Display the Login page with any flash message, if any
     res.render('index', { message: req.flash('message') });
     });
     */

    return router;
};