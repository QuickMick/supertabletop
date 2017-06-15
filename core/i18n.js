/**
 * Created by Mick on 06.06.2017.
 */

'use strict';


class I18N {

    constructor(languageData) {
        this._languageData = languageData;
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
            result = this._replace(...arguments);
        }
        return result;
    }

    _replace(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match;
        });
    }
}

module.exports = I18N;