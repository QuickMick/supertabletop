/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseDialog = require('./../../public/javascripts/dialogs/basedialog');
const Util = require('./../../core/util');

var messageFlasher = require('./../messageflasher');

var GAMES_PER_SITE = 10;

class LoginDialog extends BaseDialog{

    constructor() {
        super("loginDialog",
            {
                messages: [],
                errors:[],
                I18N:I18N.completeLanguageData
            }
        );

        this.messagesContainer = this.fragment.querySelectorAll(".login-messages")[0];
       // this._content = this.fragment.querySelectorAll(".dialog-content")[0];

       /// this._requestPage();


        this.btns["login"].onsubmit= function() {
            console.log(this);
            return false;
        };
    }



    _post(){
        this.disableButton("login");
        window.showLoadingDialog();
        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            this.enableButton("login");
            window.hideLoadingDialog();

            if (xhttp.readyState != 4) return;

            if(!xhttp.response){
                console.log("no response");
                return;
            }

            var result = JSON.parse(xhttp.response);
            messageFlasher(this.messagesContainer,result.messages,result.errors,true);
            if(result.success){
                this.close();
            }
           // document.getElementById("demo").innerHTML = xhttp.responseText;

        }.bind(this);
        xhttp.open("POST", "login", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("username=mick@mic1k.de&password=12134qwer");
    }

  /*  _requestPage(){
        var request = new XMLHttpRequest();
        request.open("GET","login");

        request.addEventListener('load', function(event) {
            if (request.status >= 200 && request.status < 300) {
                //  console.log(request.responseText);
                this._setListContent(request.response);
            } else {
                // console.warn(request.statusText, request.responseText);
                this._showError(request.responseText);
            }
        }.bind(this));
        request.send();
    }

    _setListContent(response){
        if(!response){
            this._showError("unknown_error");
            return;
        }
        //this._content.innerHTML = response;
        this._content.contentWindow.document.write(response);
    }

    _showError(error){

    }*/

    /**
     * @Override
     * @param action
     * @private
     */
    _click(action){
        if(this.disabledButtons) return;
        super._click(action);

        switch (action){
            case "close": this.close(); break;
            case "back":  break;
            case "forward":  break;
            case "login": this._post(); break;

            default: return;
        }

        //this.close();
    }

}

module.exports = LoginDialog;