/**
 * Created by Mick on 29.05.2017.
 */
var express = require('express');
var router = express.Router();

var I18N_PAGE = require('./../core/i18n_game.json');

/* GET home page. */
router.get('/', function(req, res, next) {
    var language = "en-US";

    // load language from the request
    if(I18N_PAGE[req.query.lang || ""]){
        language = req.query.lang;
    }

    var i18n = I18N_PAGE[language] || {};

    res.render('lobby',
        {
            I18N_DATA: JSON.stringify(i18n),  // json-object is sent to the client
            I18N_LAYOUT: i18n,                 // the object is just jused to generate the template
            message: req.flash('message')
        });
});

module.exports = router;
