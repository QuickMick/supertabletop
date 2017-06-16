/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseDialog = require('./../../public/javascripts/dialogs/basedialog');

var messageFlasher = require('./../messageflasher');

const Colors = require('./../../public/resources/colors.json');

const Util = require('./../../core/util');

var HTML_COLORS = [];
// convert the player colors to html colors
for(var i=0; i< Colors.PLAYERS_COLORS.length;i++){
    HTML_COLORS.push(Util.intToColorString(parseInt(Colors.PLAYERS_COLORS[i])));
}





class LoginDialog extends BaseDialog{

    constructor() {
        super("signupDialog",{
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

        this.messagesContainer = this.fragment.querySelectorAll(".signup-messages")[0];

        this.form = this.fragment.querySelectorAll("form")[0];

        // add "login" listener to every input (so login is called, when enter is pressed)+
        for(var i=0; i< this.form.length;i++) {
            this.form[i].onkeypress = function (e) {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {  // Enter pressed
                    this._click("login");
                    return false;
                }
            }.bind(this);

        }

    }

    _checkValidity(){
        var valid =true;
        for(var i=0; i< this.form.length;i++){
            var cur = this.form[i];
            if(!cur.required) continue;
            if(!cur.value){
                cur.classList.add("invalid");
                valid = false;
            }else{
                cur.classList.remove("invalid");
            }
        }

        if(!valid){
            messageFlasher(this.messagesContainer,[],["required_fields_are_empty"]);
        }

        return valid;
    }

    _getValueString(){
        var rList = [
            "async=true"        // set to find out if it is an async, or a login page request
        ];


        for(var i=0; i< this.form.length;i++) {
            var cur = this.form[i];

            rList.push(cur.name+"="+cur.value);
        }
        return rList.join("&");
    }

    _post(){
        this.disableAllButtons();
        window.showLoadingDialog();
        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            this.enableAllButtons();
            window.hideLoadingDialog();

            if (xhttp.readyState != 4) return;

            if(!xhttp.response){
                console.log("no response");
                return;
            }

            var result = JSON.parse(xhttp.response);
            messageFlasher(this.messagesContainer,result.messages,result.errors,true);

           /* if(result.errors && result.errors.length >0) {
                this.form[0].classList.add("invalid");
                this.form[1].classList.add("invalid");
            }*/
            if(result.success){
                this.close();
                location.reload();
            }
        }.bind(this);
        xhttp.open("POST", "signup-local", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send(this._getValueString());
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

            case "signup":
                var valid = this._checkValidity();

                if(valid) {
                    this._post();
                }
                break;

            default: return;
        }

        //this.close();
    }

}

module.exports = LoginDialog;