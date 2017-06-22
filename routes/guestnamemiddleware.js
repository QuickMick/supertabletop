/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

module.exports = function(userManager){

    /***
     * creates a fame for a guest, if he has not one
     */
    return function(req, res,next) {
        if(!req.session.guestName && !req.isAuthenticated()){
            req.session.guestName = userManager.getRandomGuestName();
        }else if(req.isAuthenticated() && req.session.guestName){
            delete req.session.guestName;
        }

        next();
    };

};