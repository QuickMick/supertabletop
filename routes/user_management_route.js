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

module.exports = function(passport){

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


    /* Handle Login POST */
   /* router.post('/login', passport.authenticate('login',
        {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash : true
        }

    ));*/

    router.post('/login', function(req, res, next) {
        passport.authenticate('login',{
            successRedirect: '/'
        }, function(error, user, info) {
            var isAjaxCall = req.body.async;

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

    /* GET Registration Page */
    router.get('/signup',
        LanguageMiddleware,
        function(data,req, res,next){
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

    /* Handle Registration POST */
    router.post('/signup-local', passport.authenticate('signup-local', {
        successRedirect: '/',
        failureRedirect: '/signup',
        failureFlash : true
    }));

    /* Handle Logout */
    router.get('/logout', function(req, res) {
        req.logout();
        req.flash('message', "log_out");

        req.session.destroy(function (err) {
            res.redirect('/'); //Inside a callback… bulletproof! //TODO: redirect to logout page
        });
    });


    /*
     router.get('/', function(req, res) {
     // Display the Login page with any flash message, if any
     res.render('index', { message: req.flash('message') });
     });
     */

    return router;
};