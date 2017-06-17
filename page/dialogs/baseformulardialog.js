/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseDialog = require('./../../public/javascripts/dialogs/basedialog');
var messageFlasher = require('./../messageflasher');

const EVT_ONPOST = 'onpost';
class BaseFormularDialog extends BaseDialog{

    constructor(postAction,layout,layoutLocals) {
        super(layout,layoutLocals);

        this._postAction = postAction;

        this.messagesContainer = this.fragment.querySelectorAll(".flash-messages")[0];

        this.form = this.fragment.querySelectorAll("form")[0];

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

        if(!valid && this.messagesContainer){
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
            console.log(cur);
            if(cur.ignore) continue;
            // depending on the type, we have to chose other values
            switch(cur.type){
                case "checkbox":
                    rList.push(cur.name+"="+cur.checked);
                    break;
                default:
                    rList.push(cur.name+"="+cur.value);
                    break;
            }
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
            if(this.messagesContainer)
                messageFlasher(this.messagesContainer,result.messages,result.errors,true);

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