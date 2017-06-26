/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var uuidv1 = require('uuid/v1');

const LOBBY_CONFIG = require('./../server/lobby_config.json');

module.exports = function(userManager){

    /**
     * creates a fame for a guest, if he has not one
     */
    return function(req, res,next) {
   /*     console.log(req.sessionID);
        if(!req.session.TMP_SESSION_USER_ID){
            req.session.TMP_SESSION_USER_ID = uuidv1();
        }*/

        var authed = req.isAuthenticated();

        if(!req.session.guestUser && !authed){
            var n = userManager.getRandomGuestName();
            req.session.guestUser= {
                displayName:n,
                name:n,
                color:LOBBY_CONFIG.GUEST_USER.COLOR, // index of color (green)
                status:0,
                id:uuidv1()
            };
        }else if(authed && req.session.guestUser){
            delete req.session.guestUser;
        }
/*
        if(authed && !req.user)
        {
            req.session.reload(next);
        }else
            next();*/

        next();
    };

};