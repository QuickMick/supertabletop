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
        });
    });

    /* Handle Login POST */
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash : true
    }));

    /* GET Registration Page */
    router.get('/signup', function(req, res){
        res.render('register',{message: req.flash('message')});
    });

    /* Handle Registration POST */
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/home',
        failureRedirect: '/signup',
        failureFlash : true
    }));

    /* Handle Logout */
    router.get('/logout', function(req, res) {
        req.logout();
        req.flash('message', "logged out");

        req.session.destroy(function (err) {
            res.redirect('/'); //Inside a callback… bulletproof!
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