/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseFormularDialog = require('./baseformulardialog');
const SharedConfig = require('./../../core/sharedconfig.json');
const Colors = require('./../../public/resources/colors.json');

const Util = require('./../../core/util');

var HTML_COLORS = [];
// convert the player colors to html colors
for(var i=0; i< Colors.PLAYERS_COLORS.length;i++){
    HTML_COLORS.push(Util.intToColorString(parseInt(Colors.PLAYERS_COLORS[i])));
}



class SignUpDialog extends BaseFormularDialog{

    constructor() {
        super("signup-local",
            "signupDialog",{
                messages: [],
                errors: [],
                I18N:I18N.completeLanguageData,
                LANGUAGES:I18N.languages,
                languageID:I18N.selectedLanguage,
                COLOR_NAMES:Colors.PLAYERS_COLOR_NAMES,
                COLOR_VALUES:HTML_COLORS,
                    fs: {
                    translate:I18N.translateRaw
                }
            }
        );


        // init validators
        this.validators = {
            "password":(e,v,err) =>{
                if( v.length < SharedConfig.MIN_PASSWORD_LENGTH
                    || v.length > SharedConfig.MAX_PASSWORD_LENGTH){
                    err.push('incorrect_password_length');
                    return false;
                }
                return true;
            },
            "agree":(e,v,err) =>{
                if(!v){
                    err.push('terms_and_conditions_not_agreed');
                    return false;
                }
                return true;
            },
            "color":(e,v,err) =>{
                if(v < 0){
                    err.push('error', 'no_color_chosen');
                    return false;
                }
                return true;
            }
        }
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

module.exports = SignUpDialog;