/**
 * Created by Mick on 06.06.2017.
 */

'use strict';


class I18N {

    constructor(languageData) {
        this.languageData = languageData;
    }

    get timeFormat(){
        return this.languageData.timeformat || "HH:MM:ss"
    }

    translate(key){
        if(!key || !this.languageData[key]) return "!NOT_FOUND";

        var result = this.languageData[key] || "!"+key;
        if(arguments.length > 1){   // replace keywords, if there are more arguments passed
            result = this._replace(key,...arguments);
        }
        return result;
    }

    _replace(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    }
}

module.exports = I18N;