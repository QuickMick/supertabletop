/**
 * Created by Mick on 06.06.2017.
 */

'use strict';


class I18N {

    constructor(languageData) {
        this.languageData = languageData;
    }

    translate(key){
        return this.languageData[key] || "!"+key;
    }

}

module.exports = I18N;