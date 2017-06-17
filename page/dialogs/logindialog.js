/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseFormularDialog = require('./baseformulardialog');

class LoginDialog extends BaseFormularDialog{
    constructor() {
        super("login",
            "loginDialog",
            {
                messages: [],
                errors:[],
                I18N:I18N.completeLanguageData
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
            case "open_signup":
                this.close();
                this.emit("open_signup",this);
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

module.exports = LoginDialog;