/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');


var AccountDataModel = new  Schema({
    id                  : {type:String, required:true},
    token               : {type:String, required:true},
    type                : {type:String, required:true,lowercase: true}

});

// define the schema for our user model
var UserDataModel = new Schema({
        id                  : {type: String, required: true},
        email               : {type: String, lowercase: true},
        hash                : {type: String, required: true},
        name                : {type: String, lowercase: true},
        displayName         : {type: String, required: true},
        color               : {type: Number, required: true},
        preferredLanguage   : {type: String, lowercase: true, default:"en"},
        linkedAccounts      : {type: [AccountDataModel],lowercase: true},
        status              : {type: String, required: true}

});

// methods ======================
// generating a hash
UserDataModel.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserDataModel.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

var acclink = mongoose.model('AccountLink', AccountDataModel);
var uacc = mongoose.model('UserAccount', UserDataModel);

// create the model for users and expose it to our app
module.exports = {
    UserAccountModel: uacc,
    AccountLinkModel:acclink
};