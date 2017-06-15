var express = require('express');
var router = express.Router();
var LanguageMiddleware = require('./LanguageMiddleware');


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
        var user = {};
        if(isAutenticated) {
            user.email = req.user.email;
            user.color = req.user.email;
            user.verifiedOn = req.user.verifiedOn;
            user.displayName = req.user.displayName;
        }

        res.render('lobby',
            {
                I18N_DATA: JSON.stringify(data.i18n),  // json-object is sent to the client
                I18N_LAYOUT: data.i18n,                 // the object is just jused to generate the template
                isAuthenticated: isAutenticated,
                messages: req.flash('message'),
                errors:req.flash('error'),
                user:user
            });
    }
);

module.exports = router;
