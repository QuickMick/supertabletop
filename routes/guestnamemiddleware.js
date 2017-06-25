/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var uuidv1 = require('uuid/v1');

module.exports = function(userManager){

    /***
     * creates a fame for a guest, if he has not one
     */
    return function(req, res,next) {
        console.log(req.sessionID);
        if(!req.session.TMP_SESSION_USER_ID){
            req.session.TMP_SESSION_USER_ID = uuidv1();
        }
        if(!req.session.guestName && !req.isAuthenticated()){
            req.session.guestName = userManager.getRandomGuestName();
        }else if(req.isAuthenticated() && req.session.guestName){
            delete req.session.guestName;
        }

        next();
    };

};