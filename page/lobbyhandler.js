/**
 * Created by Mick on 09.06.2017.
 */

'use strict';

const Util = require('./../core/util');

var LobbyConnectionHandler = require('./lobbyconnectionhandler');

var ChatHandler = require('./../public/javascripts/chathandler');
var OnlinePlayersHandler = require('./lobby/onlineplayershandler');


var LoginDialog = require('./dialogs/logindialog');
var SignupDialog = require('./dialogs/signupdialog');
var ProfileDialog = require('./dialogs/profiledialog');

var YesNoDialog = require('./dialogs/yesnodialog');


class LobbyHandler {

    constructor() {

        this.lobbyConnectionHandler = new LobbyConnectionHandler();

        this.chatHandler = new ChatHandler("lobby-chat-container",false,150);
        this.onlinePlayersHandler = new OnlinePlayersHandler("player-lobby-list");

        this.chatHandler.on('send',(msg)=>{
            this.lobbyConnectionHandler.sendChatMessage(msg);
        });

        this.lobbyConnectionHandler.on('chatmessagereceived',(evt)=>
            this.chatHandler.pushMessage(evt.data.message, evt.data.type, evt.timeStamp, evt.data.sender)
        );

        this.lobbyConnectionHandler.on('lobbyuserconnected',this.onlinePlayersHandler.onUserConnected.bind(this.onlinePlayersHandler));
        this.lobbyConnectionHandler.on('lobbyuserdisconnected',this.onlinePlayersHandler.onUserDisconnected.bind(this.onlinePlayersHandler));

        this.lobbyConnectionHandler.on('currentuserrejected',(e)=>{
            //TODO: close lobby?
            new YesNoDialog({
                title:"already_connected",
                message:I18N.translate(typeof e== "string"?e:((e|| {data:{}}).data||{}).reason)
                //,positive:"confirm"

            }).show();
        });


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

        var resend_verification_btn = document.getElementById("resend-verification");
        if(resend_verification_btn){
            resend_verification_btn.onclick = () => {
                Util.postXHTML("request-mail-verification",
                    "async=true&email="+CURRENT_USER.email,
                    null,
                    ()=>{
                        resend_verification_btn.parentNode.innerHTML = I18N.translate("verification_successfully_sent");
                    });
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

       // window.onunload
    }

}

module.exports = LobbyHandler;