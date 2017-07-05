/**
 * Created by Mick on 27.06.2017.
 */

'use strict';
/*
var redisClient = null;
var redisStore = null;
var sessionCookieKey= "";

var self = module.exports = {
    initialize: function (client, store,cookieKey) {
        redisClient = client;
        redisStore = store;
        sessionCookieKey = cookieKey;
    },
    getSessionId: function (handshake) {
        return handshake.signedCookies[sessionCookieKey];
    },
    get: function (handshake, callback) {
        var sessionId = self.getSessionId(handshake);

        self.getSessionBySessionID(sessionId, function (err, session) {
            if (err) callback(err);
            if (callback != undefined)
                callback(null, session);
        });
    },
    getSessionBySessionID: function (sessionId, callback) {
        redisStore.load(sessionId, function (err, session) {
            if (err) callback(err);
            if (callback != undefined)
                callback(null, session);
        });
    },/*
    getUserName: function (handshake, callback) {
        self.get(handshake, function (err, session) {
            if (err) callback(err);
            if (session)
                callback(null, session.userName);
            else
                callback(null);
        });
    },*/
    updateSession: function (session, callback) {
        try {
            session.reload(function () {
                session.touch().save();
                if(callback)
                    callback(null, session);
            });
        }
        catch (err) {
            if(callback)
                callback(err);
        }
    },
    setSessionProperty: function (session, propertyName, propertyValue, callback) {
     //   session[propertyName] = propertyValue;
        //self.updateSession(session, callback);
        try {
            session.reload(function () {
                session[propertyName] = propertyValue;
                session.touch().save();
                if(callback)
                    callback(null, session);
            });
        }
        catch (err) {
            if(callback)
                callback(err);
        }
    }
};*/