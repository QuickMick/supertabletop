/**
 * Created by Mick on 13.06.2017.
 */

'use strict';
var bCrypt = require('bcrypt');

class UserDataManager {

    constructor() {

    }

    /**
     * logs in a user
     * @param user
     * @param password
     * @returns the user object, if login credentials were corectly, or null, if they were not correctly
     */
    login(user, password){
       // return bCrypt.compareSync(password, user.password);

        // TODO: impl
        if(user!="mick" || password!="test")
            return null;

        return {
            username:user
        };
    }

    /**
     * gets public user data based on id
     * @param id
     */
    getUser(user){
        console.log("getUser",user);
        //TODO: impl
        return {
            username:user.username
        };
    }
}

module.exports = UserDataManager;