/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var uuidv1 = require('uuid/v1');

const LOBBY_CONFIG = require('./../server/lobby_config.json');

module.exports = function (userManager) {

    /**
     * creates a user for a guest, if he has not one
     */
    return function (req, res, next) {

        var authed = req.isAuthenticated();
        if (authed) {
            next();
            return;
        }

        if (!req.session.guestUser && !authed) {
            userManager.getAndAllocateRandomGuestName(req.sessionID, (guestName,err)=>{
                req.session.guestUser = {
                    displayName: guestName,
                    name: guestName,
                    color: LOBBY_CONFIG.GUEST_USER.COLOR, // index of color (green)
                    status: 0,
                    id: uuidv1()
                };
                req.session.save();
                next();
            });

        } else if (authed && req.session.guestUser) {
            delete req.session.guestUser;
            next();
        }else{
            next();
        }
    };

};