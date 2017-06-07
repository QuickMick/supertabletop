/**
 * Created by Mick on 06.06.2017.
 */

'use strict';
var EventEmitter3 = require('eventemitter3');
var Util = require('./../../core/util');

var dateFormat = require('dateformat');

const EVT_SEND = 'send';

/**
 * it chat window is scrolled down in the amount of this threshold, then the next message
 * will scroll it completely down, otherwise it stays in this position and the user
 * has to scroll down by himself.
 * @type {number}
 */
const SCROLL_DOWN_TRESHOLD = 15;

class ChatHandler extends EventEmitter3{

    /**
     *
     * @param chatRootID ID of the container, which is the "home" of the chat
     * @param maxLogLength maximum of displayed messages
     */
    constructor(chatRootID,maxLogLength = 50) {
        super();
        this.maxLogLength = maxLogLength;
        this.rootContainer = document.getElementById(chatRootID);

        if(!this.rootContainer)
            throw "chat container does not exist!";

        // load and insert the chat template to the passed rootID
        this.rootContainer.innerHTML = window.chatTemplate({I18N:I18N.completeLanguageData});
        this.rootContainer.classList.add("chat-container");
        this.rootContainer.classList.add("show");

        // prevent, that input from chat is fowarded to the gampelay - e.g. mousehweel must be blocked
        this.rootContainer.addEventListener("mousewheel", (e)=>e.stopPropagation() , true);
        this.rootContainer.addEventListener("mousemove", (e)=>e.stopPropagation() , true);
        this.rootContainer.addEventListener("mousedown", (e)=>e.stopPropagation() , true);
        this.rootContainer.addEventListener("mouseup", (e)=>e.stopPropagation() , true);
        this.rootContainer.addEventListener("keydown", (e)=>e.stopPropagation() , true);
        this.rootContainer.addEventListener("keyup", (e)=>e.stopPropagation() , true);

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
        this._inputText.focus();
        msg = msg || "";
        if(!msg) return;    // no text to send available

        this.emit(EVT_SEND,msg.toString());
    }

    /**
     * shows a message in the chat
     * @param msg {string}
     * @param type {string}
     * @param timeStamp {number} just necesarry, when type is user
     * @param sender {player} just necesarry, when type is user
     */
    pushMessage(msg, type, timeStamp, sender){
        msg = msg || "";

        if(!msg || !type) return; // message is empty, no need to display

        type = type || "";

        var fn = null;
        var local = {};

        // load the template and prepare the values for the template
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
                local.prefix = I18N.translate(sender.userStatus || "");
                local.name = sender.name || "name-not-found";
                break;
            default:
                return; // no type, nothing to do
        }

        timeStamp = timeStamp || new Date().getTime();
        local.time = dateFormat(new Date(timeStamp), I18N.timeFormat);

        var scrollDown = false;

        // check if is scrolled to bottom
        if( this._outputContainer.scrollHeight -this._outputContainer.scrollTop- this._outputContainer.offsetHeight <= SCROLL_DOWN_TRESHOLD){
            scrollDown =true;
        }

        // add it to the log
       // this._outputContainer.appendChild(newMessage);
        this._outputContainer.appendChild(Util.htmlStringToNode(fn(local)));

        //check if messages are more then the maximum, if yes, remove
        if(this._outputContainer.childNodes.length > this.maxLogLength){
            // remove first child
            this._outputContainer.removeChild(this._outputContainer.childNodes[0]);
        }

        // if it was scrolled to the bottom previously, then als scroll down
        if(scrollDown) {
            this._outputContainer.scrollTop = this._outputContainer.scrollHeight;
        }
    }
}

module.exports = ChatHandler;