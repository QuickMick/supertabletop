/**
 * Created by Mick on 06.06.2017.
 */

'use strict';
var EventEmitter3 = require('eventemitter3');

var dateFormat = require('dateformat');

const EVT_SEND = 'send';

class ChatHandler extends EventEmitter3{

    constructor(chatRootID) {
        super();
        this.rootContainer = document.getElementById(chatRootID);

        this.rootContainer.addEventListener("mousewheel", (e)=>e.preventBubble() , false);

        if(!this.rootContainer)
            throw "chat container does not exist!";

        // get the required html elements
        // for expanding/inflating
        this._expanderButton = this.rootContainer.getElementsByClassName("chat-expander btn")[0];
        // for output
        this._outputContainer = this.rootContainer.getElementsByClassName("chat-output")[0];
        // for sending
        this._inputText = this.rootContainer.getElementsByClassName("chat-input-field")[0];
        this._sendButton = this.rootContainer.getElementsByClassName("chat-send btn")[0];

        // prepare the sending listeners
        this._sendButton.onclick = this._sendMessage.bind(this);
        this._inputText.onkeypress = function(e){
            if (!e) e = window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == '13'){  // Enter pressed
                this._sendMessage();
                return false;
            }
        }.bind(this);

        this._expanderButton.onclick = this._toggleVisibility.bind(this);
    }

    _toggleVisibility(){
        if(this.rootContainer.classList.contains("show")){
            this.rootContainer.classList.remove("show");
            this.rootContainer.classList.add("hide");
            this.rootContainer.classList.add("no-content");
        }else if(this.rootContainer.classList.contains("hide")){
            this.rootContainer.classList.remove("hide");
            this.rootContainer.classList.add("show");
            // remove the content method, when panel is shown, otherwize the content is build up wrongly
            setTimeout(() => {this.rootContainer.classList.remove("no-content");}, 100);
        }else{
            this.rootContainer.classList.add("hide");
            this.rootContainer.classList.add("no-content");
        }
    }

    _sendMessage(){
        var msg = this._inputText.value;
        this._inputText.value = "";
        msg = msg || "";
        if(!msg) return;    // no text to send available

        this.emit(EVT_SEND,msg.toString());
    }


    pushMessage(msg, type, timeStamp, sender){
        msg = msg || "";

        if(!msg || !type) return; // message is empty, no need to display

        type = type;

        var fn = null;
        var local = {};

        switch(type){
            case "error":
                fn = window.chatServerErrorMsg;
                local.msg = msg;
                break;
            case "system":
                fn = window.chatServerMsg;
                local.msg = msg;
                break;
            case "user":
                fn = window.chatUserMsg;
                if(!sender){
                    console.log("received chat message from no sender!");
                    return;
                }
                local.msg = msg;
                local.time = dateFormat(new Date(timeStamp), I18N.timeFormat);
                local.prefix = I18N.translate(sender.userStatus || "");
                local.name = sender.name || "name-not-found";
                break;
            default:
                return; // no type, nothing to do
        }

        var x = document.createElement("div");
        x.classList = "message";
        x.innerHTML = fn(local);
        this._outputContainer.appendChild(x);

    }
}

module.exports = ChatHandler;