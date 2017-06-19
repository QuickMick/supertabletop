/**
 * Created by Mick on 14.06.2017.
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var Rights = require('./../../../core/rights');
var SharedConfig = require('./../../../core/sharedconfig.json');
var Colors = require('./../../../public/resources/colors.json');
var uniqueValidator = require('mongoose-unique-validator');

const ACCOUNT_TYPE_ENUM = ["local", "facebook", "google"];

const CURSOR_TYPE_ENUM = ["default"];   //TODO: curser iwo hin auslagern

const TRASHMAILS = require('./../../trashmails.json');
const SUPPORTED_LANGUAGES = Object.keys(require('./../../../core/i18n_game.json'));
const DEFAULT_LANGUAGE = "en";
const DEFAULT_CURSOR = "default";

const MAIL_VERIFICATION_EXPIRE_INTERVAL = 24*60*60*1000;    // expires in one day

var MailVerificationDataModel = new Schema({
    userID: {type: String, required: true}, // id of the user
    email: {
        type: String,
        lowercase: true,
        required: true,
        index: true,
        match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "string_is_not_a_mail"]
    },
    token: {type: String, unique: true, index: true},  //token used in the url to verify
    language: {type: String, enum: SUPPORTED_LANGUAGES, lowercase: true, default: DEFAULT_LANGUAGE},
    expiresOn: {type: Date, required: true, default: new Date(new Date().getTime()+MAIL_VERIFICATION_EXPIRE_INTERVAL)},
    redeemed: {type:Boolean, required:true,default:false} // was this token used to verify the mail? true if yes
});

var AccountLinkDataModel = new Schema({
    id: {type: String},
    token: {type: String},
    type: {type: String, required: true, enum: ACCOUNT_TYPE_ENUM, lowercase: true},
    linkDate: {type: Date, required: true, default: Date.now},
    userID: {type: String, required: true},
});

/**
 * User may change his mail, but save also his old mails
 */
var DeprecatedMailDataModel = new Schema({
    email: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "string_is_not_a_mail"]
    },
    verifiedOn: {type: Date},  // null, when it never was verified
    deprecationDate: {type: Date, required: true, default: Date.now}    // when got the mail deprecated?
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
        match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "string_is_not_a_mail"],
      //  match: [/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, "string_is_not_a_mail"],
        validate: {validator: isNoTrashMail, message: 'mail_is_trashmail'}
    },
    hash: {
        type: String,
        maxlength: [SharedConfig.MAX_PASSWORD_LENGTH, 'incorrect_password_length'],
        minlength: [SharedConfig.MIN_PASSWORD_LENGTH, 'incorrect_password_length'],
        required: true,
        set: generateHash
    },
    name: {
        type: String,
        required: true,
        lowercase:true,
        unique: true,
        index: true,
        trim: true,
        match: [/^\w+$/, "invalid_characters_name"],
        maxlength: [SharedConfig.MAX_NAME_LENGTH, 'incorrect_name_length'],
        minlength: [SharedConfig.MIN_NAME_LENGTH, 'incorrect_name_length']
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
    locked:{
        type: Boolean,
        default:false
    },
    color: {
        type: Number,
        min:[-1,"invalid_color"],
        max:[Colors.PLAYERS_COLORS.length, "invalid_color"],
        required: true
    },
    cursor: {
        type: Number,
        min:[0,"invalid_cursor"],
        max:[CURSOR_TYPE_ENUM.length, "invalid_cursor"],
        required: true,
        default:0
    },
    preferredLanguage: {type: String, enum: SUPPORTED_LANGUAGES, lowercase: true, default: DEFAULT_LANGUAGE},
    linkedAccounts: {type: [AccountLinkDataModel],  required: true}, // at least local type is required
    status: {
        type: String,
        required: true,
        //  enum: Rights.RIGHTS_STRENGTH,
        min: [0, "invalid_status"],
        max: [Rights.RIGHTS_STRENGTH.length - 1, "invalid_status"],
        default: Rights.RIGHTS_STRENGTH_MAP[Rights.RIGHTS.registered]
    },
    verifiedOn: {type: Date},  // set the account as verifie - all accounts which are not verified, are deleted after 24h. and cannot upload something.
    agreedTAC: {type: Boolean, required:true,validate: {validator: function(v){return v}, message: 'terms_and_conditions_not_agreed'}},
    oldMailAdresses: {type: [DeprecatedMailDataModel], default:[]}, // can be empty, if there is no old mail
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

function createNewExpiration (){
    return new Date(new Date().getTime()+MAIL_VERIFICATION_EXPIRE_INTERVAL);
};


AccountLinkDataModel.pre('findOneAndUpdate', function(next) {
    this.options.runValidators = true;
    next();
});

UserAccountDataModel.pre('findOneAndUpdate', function(next) {
    this.options.runValidators = true;
    next();
});


var mailveri = mongoose.model('MailVerification', MailVerificationDataModel);

var acclink = mongoose.model('AccountLink', AccountLinkDataModel);
var uacc = mongoose.model('UserAccount', UserAccountDataModel);
var demail = mongoose.model('DeprecatedMail', DeprecatedMailDataModel);

// create the model for users and expose it to our app
module.exports = {
    MailVerificationModel:mailveri,
    UserAccountModel: uacc,
    AccountLinkModel: acclink,
    DeprecatedMailModel:demail,
    ACCOUNT_TYPE_ENUM: ACCOUNT_TYPE_ENUM,
    helpers:{
        createNewExpirationDate:createNewExpiration
    }
};