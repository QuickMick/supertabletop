/**
 * Created by Mick on 14.06.2017.
 */

'use strict';


var I18N = require('./../core/i18n_game.json');
var translateFunc = require('./../core/i18n').translateRaw;

var I18N_STRINGIFIED = {};
var LANGUAGES = [];
const DEFAULT_LANG = "en";

for(var k in I18N) {
    if (!I18N.hasOwnProperty(k)) continue;
    I18N_STRINGIFIED[k] = JSON.stringify(I18N[k]);

    LANGUAGES.push({
        key:k,
        name:(I18N[k] ||{})._LANG || k
    })
}

var mapLanguageCode = function (lang) {
    lang = (lang || "").toLowerCase();
    switch (lang){
        case "de":
        case "de-de":
            return "de";
        case "en":
        case "en-us":
        case "en-en":
        case "en-uk":
            return "en";

        default:    // no fallback - use browser instead
            return "";
    }
};

/*
function _replace(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match;
    });
}*/
/*
function translate (i18n,key){
    if(!key || !i18n[key]) return "!"+(key || "UNKNOWN");

    var result = i18n[key] || "!"+key;
    if(arguments.length > 1){   // replace keywords, if there are more arguments passed
        arguments[0] = result;
        result = _replace(...arguments);
    }
    return result;
}*/

function translate (i18n,key){
   /* if(!key || !i18n[key]) return "!"+(key || "UNKNOWN");

    var result = i18n[key] || "!"+key;
    if(arguments.length > 2){   // replace keywords, if there are more arguments passed
        Array.prototype.shift.apply(arguments);
        arguments[0] = result;

        console.log(arguments);
        result = _replace(...arguments);
    }
    return result;*/

   return translateFunc(...arguments);
}



module.exports = function(req, res,next) {
    var queryLang = "";
    if(req.query && req.query.lang){
        queryLang = mapLanguageCode(req.query.lang);
    }

    var lang = queryLang || req.acceptsLanguages('en', 'de');
    next({
        i18n: I18N[lang] || I18N[DEFAULT_LANG],
        i18n_stringified: I18N_STRINGIFIED[lang] || I18N_STRINGIFIED[DEFAULT_LANG],
        languageID:lang || DEFAULT_LANG,
        languages:LANGUAGES,
        queryLanguage:queryLang,
        getLanguage:function(languageID) {
            return I18N[languageID];
        },
        translate: translate
    });
};