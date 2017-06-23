/**
 * Created by Mick on 09.06.2017.
 */

'use strict';

var ChatHandler = require('./../public/javascripts/chathandler');
var LobbyConnectionHandler = require('./lobbyconnectionhandler');

var LoginDialog = require('./dialogs/logindialog');
var SignupDialog = require('./dialogs/signupdialog');
var ProfileDialog = require('./dialogs/profiledialog');

class LobbyHandler {

    constructor() {

        this.lobbyConnectionHandler = new LobbyConnectionHandler();

        this.chatHandler = new ChatHandler("lobby-chat-container",false,150);

        this.chatHandler.on('send',(msg)=>{
            this.lobbyConnectionHandler.sendChatMessage(msg);
        });

        this.lobbyConnectionHandler.on('chatmessagereceived',(evt)=>
            this.chatHandler.pushMessage(evt.data.message, evt.data.type, evt.timeStamp, evt.data.sender)
        );

        var log_in_btn = document.getElementById("log-in");
        if(log_in_btn){
            log_in_btn.onclick = () => {
                this._createNewLoginDialog().show();
            }
        }

        var sign_up_btn = document.getElementById("sign-up");
        if(sign_up_btn){
            sign_up_btn.onclick = () => {
                this._createNewSignUpDialog().show();
            }
        }

        var show_profile_btn = document.getElementById("show-profile");
        if(show_profile_btn){
            show_profile_btn.onclick = () => {
                this._createProfileDialog().show();
            }
        }
    }

    _createProfileDialog(){
        var profileDialog = new ProfileDialog();
        profileDialog.show();
    }

    _createNewLoginDialog(){
        var loginDialog = new LoginDialog();
        loginDialog.on("open_signup",
            () =>{
                this._createNewSignUpDialog().show();
            }
        );

        return loginDialog;
    }

    _createNewSignUpDialog(){
        var signupdDialog = new SignupDialog();
        signupdDialog.on("open_login",
            () =>{
                this._createNewLoginDialog().show();
            }
        );

        return signupdDialog;
    }

    show(){
        this.lobbyConnectionHandler.start();
    }
}

module.exports = LobbyHandler;