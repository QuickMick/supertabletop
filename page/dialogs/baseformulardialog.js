/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseDialog = require('./../../public/javascripts/dialogs/basedialog');
var messageFlasher = require('./../messageflasher');

const EVT_ONPOST = 'onpost';
const EVT_ONRESULT = 'onresult';
class BaseFormularDialog extends BaseDialog{

    constructor(postAction,layout,layoutLocals) {
        super(layout,layoutLocals);

        this._postAction = postAction;

        this.messagesContainer = this.fragment.querySelectorAll(".flash-messages")[0];

        this.form = this.fragment.querySelectorAll("form")[0];

        /**
         * contains functions mapped to fields, which are calld for validation
         * @type {{inputname:function(element,value,errorcallback}}
         */
        this.validators= {};

        // add "login" listener to every input (so login is called, when enter is pressed)+
        for(var i=0; i< this.form.length;i++) {
            this.form[i].onkeypress = function (e) {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == '13') {  // Enter pressed
                    this._click("post");
                    return false;
                }
            }.bind(this);
        }
    }

    _checkValidity(){
        var notEmpty =true;
        var confirmed = true;
        var aditionalValidatorsPassed = true;
        var errorFlash = [];

        for(var i=0; i< this.form.length;i++){
            var cur = this.form[i];
            cur.classList.remove("invalid");
            // if the field is a field to confirm another one, then perform this behaviour now
            if(cur.dataset.confirm){
                var target = this.form[cur.dataset.confirm];
                if(!target) continue;

                var t = this._getHTMLInputValue(target);
                var c = this._getHTMLInputValue(cur);

                if(t != c){
                    errorFlash.push(cur.dataset.confirmerror || "confirmation_not_fit");
                    confirmed=false;
                    target.classList.add("invalid");
                    cur.classList.add("invalid");
                }
            }

            var curValue = this._getHTMLInputValue(cur);

            if(curValue && this.validators[cur.name]){
                // call validator, if it fails, additional validators fail also
                if(!this.validators[cur.name](cur,curValue,errorFlash)) {
                    aditionalValidatorsPassed = false;
                    cur.classList.add("invalid");
                }

            }
            // check if a necessary field is not filled out
            if(!cur.required) continue;
            if(!curValue){
                cur.classList.add("invalid");
                notEmpty = false;
            }
        }

        if(!notEmpty){
            errorFlash.push("required_fields_are_empty");
        }

        var isValid = notEmpty && confirmed && aditionalValidatorsPassed;

        if(!isValid && this.messagesContainer){
            messageFlasher(this.messagesContainer,[],errorFlash,true);
        }

        return isValid;
    }

    _checkValidityForElement(element){

    }

    _getValueString(){
        var rList = [
            "async=true"        // set to find out if it is an async, or a login page request
        ];
        for(var i=0; i< this.form.length;i++) {
            var cur = this.form[i];

            // ignore confirmation fields, checking for correctnes is done on clientside
            if(cur.dataset.confirm || cur.dataset.ignore=="true") continue;

            var val = this._getHTMLInputValue(cur);

            if(!val) continue; // no value, nothing to send

            rList.push(cur.name+"="+val);
        }
        return rList.join("&");

        //TODO: ? Send a URLEncoded NUL value (%00) for any thing that you're specifically setting to null. It should be correctly URL Decoded.
    }


    /**
     * depending on the type of the input element, we have to chose other values
     * @param input
     * @returns {*}
     * @private
     */
    _getHTMLInputValue(input){
        switch(input.type){
            case "checkbox":
                return input.checked;
                break;
            default:
                return input.value;
                break;
        }
    }


    _post(){
        this.disableAllButtons();
        window.showLoadingDialog();
        var xhttp = new XMLHttpRequest();
        xhttp.onerror = function (e) {
            console.log(e);
        };
        xhttp.onreadystatechange = function() {
            this.enableAllButtons();
            window.hideLoadingDialog();

            if (xhttp.readyState != 4) return;

            if(!xhttp.response){
                console.log("no response");
                return;
            }

            var result = JSON.parse(xhttp.response);
            if(this.messagesContainer)
                messageFlasher(this.messagesContainer,result.messages,result.errors,true);

            this.emit(EVT_ONRESULT,{sender:this,result:result});
            this._onResult(result);
        }.bind(this);
        xhttp.open("POST", this._postAction, true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        var query = this._getValueString();
        xhttp.send(query);
        this.emit(EVT_ONPOST,this,query);
    }

    _onResult(result){

    }

    /**
     * @Override
     * @param action
     * @private
     */
   /* _click(action){
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
    }*/

}

module.exports = BaseFormularDialog;