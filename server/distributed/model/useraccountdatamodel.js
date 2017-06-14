/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt');

var Rights = require('./../../../core/rights');
var SharedConfig = require('./../../../core/sharedconfig.json');

const ACCOUNT_TYPE_ENUM =["local","facebook","google"];

const TRASHMAILS = require('./../../trashmails.json');
const SUPPORTED_LANGUAGES = Object.keys(require('./../../../core/i18n_game.json'));
const DEFAULT_LANGUAGE = "en";

var AccountLinkDataModel = new  Schema({
    id                  : {type:String},
    token               : {type:String},
    type                : {type:String, required:true, enum:ACCOUNT_TYPE_ENUM, lowercase: true},
    linkDate            : {type : Date, required:true, default:Date.now},
    userID              : {type: String, required: true},
});

function generateHash (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

function isTrashMail(s){
    var x=s.replace(/ /g,"").split("@")[1];
    return (TRASHMAILS[x])?true:false;  // if the domain after the @ exists in the list, it is a trashmail
}

function checkNameLength(){
    !/^\w+$/.test(name) //
}

var nameMinLength = [SharedConfig.MIN_NAME_LENGTH, 'incorrect_name_length'];
var nameMaxLength = [SharedConfig.MAX_NAME_LENGTH, 'incorrect_name_length'];
// define the schema for our user model
var UserAccountDataModel = new Schema({
        id                  : {type: String, required: true, index:true, unique:true},
        email               : {type: String, lowercase: true, unique:true, index:true, trim: true, match:/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,validate: {validator: isTrashMail,message: 'mail_is_trashmail'}},
        hash                : {type: String, required: true, set:generateHash},
       // name                : {type: String, lowercase: true, trim: true },
        name                : {type: String, required: true, trim: true, match:!/^\w+$/, maxlength:nameMaxLength,minlength:nameMinLength, validate: {validator: isTrashMail,message: 'mail_is_trashmail'}},
        color               : {type: Number, required: true},
        preferredLanguage   : {type: String, enum:SUPPORTED_LANGUAGES, lowercase: true, default:DEFAULT_LANGUAGE},
        linkedAccounts      : {type: [AccountLinkDataModel],lowercase: true, required: true}, // at least local type is required
        status              : {type: String, required: true, enum:Rights.RIGHTS_STRENGTH, default:Rights.RIGHTS_STRENGTH[1]},
        verifiedOn         : {type: Date}  // set the account as verifie - all accounts which are not verified, are deleted after 24h. and cannot upload something.

}, {timestamps: true} );

// methods ======================
// generating a hash
/*UserAccountDataModel.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};*/

// checking if password is valid
UserAccountDataModel.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.hash);
};

UserAccountDataModel.methods.isVerified = function() {
    return this.verifiedOn?true:false;
};

var acclink = mongoose.model('AccountLink', AccountLinkDataModel);
var uacc = mongoose.model('UserAccount', UserAccountDataModel);

// create the model for users and expose it to our app
module.exports = {
    UserAccountModel: uacc,
    AccountLinkModel:acclink,
    ACCOUNT_TYPE_ENUM:ACCOUNT_TYPE_ENUM
};