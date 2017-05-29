/**
 * Created by Mick on 29.05.2017.
 */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('editor', { title: 'Super Tabletop editor' });
});

module.exports = router;
