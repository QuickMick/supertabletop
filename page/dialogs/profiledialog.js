/**
 * Created by Mick on 08.06.2017.
 */

'use strict';
var dateFormat = require('dateformat');

var BaseFormularDialog = require('./baseformulardialog');

const Colors = require('./../../public/resources/colors.json');

const Util = require('./../../core/util');

var HTML_COLORS = [];
// convert the player colors to html colors
for(var i=0; i< Colors.PLAYERS_COLORS.length;i++){
    HTML_COLORS.push(Util.intToColorString(parseInt(Colors.PLAYERS_COLORS[i])));
}



class ProfileDialog extends BaseFormularDialog{

    constructor() {
        super("update-profile",
            "profileDialog",{
                messages: [],
                errors: [],
                user: CURRENT_USER,
                I18N:I18N.completeLanguageData,
                LANGUAGES:I18N.languages,
               // languageID:I18N.selectedLanguage,
                COLOR_NAMES:Colors.PLAYERS_COLOR_NAMES,
                COLOR_VALUES:HTML_COLORS,
                verificationDate: CURRENT_USER.verifiedOn?dateFormat(new Date(CURRENT_USER.verifiedOn),I18N.datetimeformat) : null,
                fs: {
                    translate:I18N.translateRaw
                }
            }
        );
    }

    /**
     * @Override
     * @param action
     * @private
     */
    _click(action){
        super._click(action);

        switch (action){
            case "close": this.close(); break;
            case "open_login":
                this.close();
                this.emit("open_login",this);
                break;

            case "post":
                var valid = this._checkValidity();

                if(valid) {
                    this._post();
                }
                break;

            default: return;
        }

        //this.close();
    }

    _onResult(result){
        if(result.success){
            this.close();
            location.reload();
        }
    }

}

module.exports = ProfileDialog;