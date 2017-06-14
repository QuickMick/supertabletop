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
                message: req.flash('message')
            });
    },

    function(data, req, res, next) {
       // var language = lang || "en-US";

        // load language from the request
       /* if(req.query && I18N[req.query.lang || ""]){
            language = req.query.lang;
        }*/

        console.log("isAut",req.isAuthenticated());

        //var i18n = I18N[language] || {};

        res.render('lobby',
            {
                I18N_DATA: JSON.stringify(data.i18n),  // json-object is sent to the client
                I18N_LAYOUT: data.i18n,                 // the object is just jused to generate the template
                ERROR: data.error || "",
                isAuthenticated: req.isAuthenticated(),
                message: req.flash('message')
            });
    }
);

module.exports = router;
