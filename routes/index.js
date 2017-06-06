var express = require('express');
var router = express.Router();

var I18N_GAME = require('./../core/i18n_game.json');

/* GET home page. */
router.get('/', function(req, res, next) {

  var language = "de-DE";
  var i18n = JSON.stringify(I18N_GAME[language] || {});

  res.render('index', { title: 'Super Tabletop', I18N_DATA:i18n });
});

module.exports = router;
