/**
 * Created by Mick on 13.06.2017.
 */

'use strict';

var express = require('express');
var router = express.Router();

var LanguageMiddleware = require('./LanguageMiddleware');

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
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash : true
    }));

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