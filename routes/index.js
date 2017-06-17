var express = require('express');
var router = express.Router();
var LanguageMiddleware = require('./LanguageMiddleware');

var Rights = require('./../core/rights');
var Util = require('./../core/util');

var Colors = require('./../public/resources/colors.json');

/* GET home page. */
router.get('/',
    LanguageMiddleware,

    function (data,req, res, next) {

        if (!req.query || !req.query.id) {
           // res.status(404);
            //res.send("game_not_found  - neuer link ist jetz http://92.219.114.19:3000/?id=testID&lang=en-EN (lang kann auch auf de-DE gesetzt werden)");
            next(data); // no game passed
            return;
        }

        res.render('index',
            {
                I18N_DATA: data.i18n_stringified,  // json-object is sent to the client
                I18N_LAYOUT: data.i18n,                 // the object is just jused to generate the template
                gameID:req.query.id,
                messages: req.flash('message'),
                errors:req.flash('error')
            });
    },

    function(data, req, res, next) {

        var isAutenticated = req.isAuthenticated();
        var user = {
            color:"green",   // default color for lobby view
            default:true
        };
        if(isAutenticated) {
            var u = req.user;
            user.email = u.email;
            user.color = Colors.PLAYERS_COLOR_NAMES[u.color];
            user.verifiedOn = u.verifiedOn;
            user.name = u.name;
            user.displayName = u.displayName;
            user.language = u.preferredLanguage;
            user.status = Rights.RIGHTS_STRENGTH[u.status];
            delete user.default;
        }

        var currentLanguage = data.queryLanguage || user.language || data.languageID;

        res.render('lobby',
            {
                I18N_DATA: JSON.stringify(data.getLanguage(currentLanguage)),  // json-object is sent to the client
                I18N_LAYOUT: data.getLanguage(currentLanguage),                 // the object is just jused to generate the template
                LANGUAGES:JSON.stringify(data.languages),
                LANGUAGE_ID:JSON.stringify(currentLanguage),
                isAuthenticated: isAutenticated,
                messages: req.flash('message'),
                errors:req.flash('error'),
                user:user,
                fs: {
                    translate:data.translate
                }
            });
    }
);

module.exports = router;
