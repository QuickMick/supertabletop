

var express = require('express');
var router = express.Router();


var SharedConfig = require('./../core/sharedconfig.json');

/* GET users listing. */
router.get('/', function(req, res, next) {

    // send errors, if pageNumber is invalid
    // check if the pageNumber variable is in the header
    if(!req.headers && !req.headers.pagenumber) {
        res.status(404);
        res.send("wrong_request");
        return;
    }

    var page = parseInt(req.headers.pagenumber);

    // check if it is a number
    if(isNaN(page)){
        res.status(404);
        res.send("wrong_request");
        return;
    }

    // everything should be fine, send the games
    //TODO: load from db with max games from SharedConfig
    //TODO authentication
    var responseData = {
        page:page,
        games:[
            {
                name:"Codenames",
                creator:"Mick",
                id:"abcdef",
                description:"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
                rating:4
            }
        ]
    };

    res.send(responseData);
});

module.exports = router;
