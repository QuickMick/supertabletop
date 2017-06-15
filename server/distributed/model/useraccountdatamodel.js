/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var Rights = require('./../../../core/rights');
var SharedConfig = require('./../../../core/sharedconfig.json');
var uniqueValidator = require('mongoose-unique-validator');

const ACCOUNT_TYPE_ENUM = ["local", "facebook", "google"];

const TRASHMAILS = require('./../../trashmails.json');
const SUPPORTED_LANGUAGES = Object.keys(require('./../../../core/i18n_game.json'));
const DEFAULT_LANGUAGE = "en";
const DEFAULT_CURSOR = "default";

var AccountLinkDataModel = new Schema({
    id: {type: String},
    token: {type: String},
    type: {type: String, required: true, enum: ACCOUNT_TYPE_ENUM, lowercase: true},
    linkDate: {type: Date, required: true, default: Date.now},
    userID: {type: String, required: true},
});

function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

function isNoTrashMail(s) {
    var x = s.replace(/ /g, "").split("@")[1];
    return (!TRASHMAILS[x]) ? true : false;  // if the domain after the @ exists in the list, it is a trashmail
}


// define the schema for our user model
var UserAccountDataModel = new Schema({
    id: {type: String, required: true, index: true, unique: true},
    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, "string_is_not_a_mail"],
        validate: {validator: isNoTrashMail, message: 'mail_is_trashmail'}
    },
    hash: {
        type: String,
        maxlength: [SharedConfig.MAX_PASSWORD_LENGTH, 'incorrect_password_length'],
        minlength: [SharedConfig.MIN_PASSWORD_LENGTH, 'incorrect_password_length'],
        required: true,
        set: generateHash
    },
    displayName: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        match: [/^\w+$/, "invalid_characters_name"],
        maxlength: [SharedConfig.MAX_NAME_LENGTH, 'incorrect_name_length'],
        minlength: [SharedConfig.MIN_NAME_LENGTH, 'incorrect_name_length']
    },
    color: {type: Number, required: true},
    cursor: {type: String, required: true, default:DEFAULT_CURSOR},
    preferredLanguage: {type: String, enum: SUPPORTED_LANGUAGES, lowercase: true, default: DEFAULT_LANGUAGE},
    linkedAccounts: {type: [AccountLinkDataModel], lowercase: true, required: true}, // at least local type is required
    status: {type: String, required: true, enum: Rights.RIGHTS_STRENGTH, default: Rights.RIGHTS.registered},
    verifiedOn: {type: Date},  // set the account as verifie - all accounts which are not verified, are deleted after 24h. and cannot upload something.
    agreedTAC: {type: Boolean, required:true,validate: {validator: function(v){return v}, message: 'terms_and_conditions_not_agreed'}}
}, {timestamps: true});

UserAccountDataModel.plugin(uniqueValidator, { message: 'name_or_mail_already_exists' });

// methods ======================

// checking if password is valid
UserAccountDataModel.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.hash);
};

// check if the user has vertified his mail
UserAccountDataModel.methods.isVerified = function () {
    return this.verifiedOn ? true : false;
};


AccountLinkDataModel.pre('findOneAndUpdate', function(next) {
    this.options.runValidators = true;
    next();
});

UserAccountDataModel.pre('findOneAndUpdate', function(next) {
    this.options.runValidators = true;
    next();
});

var acclink = mongoose.model('AccountLink', AccountLinkDataModel);
var uacc = mongoose.model('UserAccount', UserAccountDataModel);

// create the model for users and expose it to our app
module.exports = {
    UserAccountModel: uacc,
    AccountLinkModel: acclink,
    ACCOUNT_TYPE_ENUM: ACCOUNT_TYPE_ENUM
};