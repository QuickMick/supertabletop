var express = require('express');
var router = express.Router();

var I18N_GAME = require('./../core/i18n_game.json');

/* GET home page. */
router.get('/', function(req, res, next) {

  // load the correct language and pass it to the jade
  var language = "de-DE";
  var i18n = I18N_GAME[language] || {};

  res.render('index',
      {
        I18N_DATA: JSON.stringify(i18n),  // json-object is sent to the client
        I18N_LAYOUT:i18n                  // the object is just jused to generate the template
      });
});

module.exports = router;
