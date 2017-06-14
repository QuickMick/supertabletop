/**
 * Created by Mick on 14.06.2017.
 */

'use strict';


var I18N = require('./../core/i18n_game.json');

var I18N_STRINGIFIED = {};

for(var k in I18N) {
    if (!I18N.hasOwnProperty(k)) continue;
    I18N_STRINGIFIED[k] = JSON.stringify(I18N[k]);
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


module.exports = function(req, res,next) {
    var lang = "";
    if(req.query && req.query.lang){
        lang = mapLanguageCode(req.query.lang);

    }
    lang = lang || req.acceptsLanguages('en', 'de');
    console.log(lang);
    next({
        i18n: I18N[lang] || I18N["en"],
        i18n_stringified: I18N_STRINGIFIED[lang] || I18N_STRINGIFIED["en"]
    });
};