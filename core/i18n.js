/**
 * Created by Mick on 06.06.2017.
 */

'use strict';


class I18N {

    constructor(languageData,languages,selectedLanguage) {
        this._languageData = languageData;

        this.languages = languages;
        this.selectedLanguage = selectedLanguage;
    }

    /**
     * returns all language data
     * @returns {*}
     */
    get completeLanguageData(){
        return this._languageData;
    }

    get timeFormat(){
        return this._languageData.timeformat || "HH:MM:ss"
    }

    translate(key){

        if(!key || !this._languageData[key]) return "!"+(key || "UNKNOWN");

        var result = this._languageData[key] || "!"+key;
        if(arguments.length > 1){   // replace keywords, if there are more arguments passed
            arguments[0] = result;
            result = I18N.replace(...arguments);
        }
        return result;
    }

    static translateRaw (i18n,key){
        if(!key || !i18n[key]) return "!"+(key || "UNKNOWN");

        var result = i18n[key] || "!"+key;
        if(arguments.length > 2){   // replace keywords, if there are more arguments passed
            Array.prototype.shift.apply(arguments);
            arguments[0] = result;
            result = I18N.replace(...arguments);
        }

        return result;
    }

    static replace(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match;
        });
    }
}

module.exports = I18N;