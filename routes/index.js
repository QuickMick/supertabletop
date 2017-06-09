var express = require('express');
var router = express.Router();

var I18N_GAME = require('./../core/i18n_game.json');

/* GET home page. */
router.get('/', function (req, res, next) {

    if (!req.query.id) {
        res.status(404);
        res.send("game_not_found  - neuer link ist jetz http://92.219.114.19:3000/?id=testID&lang=en-EN (lang kann auch auf de-DE gesetzt werden)");
        //TODO: redirekt zur lobby mit meldung
        return;
    }
    // load the correct language and pass it to the jade
    var language = "en-EN";

    // load language from the request
    if(I18N_GAME[req.query.lang || ""]){
        language = req.query.lang;
    }


    var i18n = I18N_GAME[language] || {};

    res.render('index',
        {
            I18N_DATA: JSON.stringify(i18n),  // json-object is sent to the client
            I18N_LAYOUT: i18n,                 // the object is just jused to generate the template
            gameID:req.query.id
        });
});

module.exports = router;
