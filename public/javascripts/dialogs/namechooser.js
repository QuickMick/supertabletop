/**
 * Created by Mick on 07.06.2017.
 */

'use strict';
var EventEmitter3 = require('eventemitter3');
const Util = require('./../../../core/util');
const Rights = require('./../../../core/rights');

const SharedConfig = require('./../../../core/sharedconfig.json');

var EVT_ONDISPOSE = "ondispose";
var EVT_ONCLOSE = "onclose";
var EVT_ONCONFIRM = "onconfirm";

class NameChooser extends  EventEmitter3{

    constructor(currentPlayer,rootContainer) {
        super();
        var fragment = Util.htmlStringToNode(window.nameChooserTemplate({
            I18N: I18N.completeLanguageData,
            name:currentPlayer.name
        }));

        if(currentPlayer.userStatus != Rights.RIGHTS.guest){
            return;
        }



        var btns= fragment.querySelectorAll(".btn");//this._rootContainer.querySelectorAll("btn");

        this.inputNode = fragment.querySelectorAll(".name-chooser-input")[0];

        Util.stopPropagation(this.inputNode);  //override listeners, so nothing passes to the game
        this.errorLabelNode = fragment.querySelectorAll(".label")[0];

        for(let i=0;i<btns.length;i++){
            btns[i].onclick = (e)=>this._click(btns[i].dataset.action);
        }
        this._rootNode = fragment.childNodes[0];
        (rootContainer || document.body).appendChild(fragment);


        this.inputNode.onkeypress = function (e) {
            if (!e) e = window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == '13') {  // Enter pressed
                this._click("confirm");
                return false;
            }
        }.bind(this);

        this.inputNode.focus();
    }

    close(){
        if(!this._rootNode.parentNode) return;
        this.emit(EVT_ONCLOSE,this);
        this._rootNode.parentNode.removeChild(this._rootNode);
    }

    _click(action){
        switch (action){
            case "cancel": this.emit(EVT_ONDISPOSE,this); this.close(); break;
            case "confirm":

                var newName = this.inputNode.value;

                newName = newName || "";
                newName = newName.trim();
                // checkif name has correct langth
                if(!newName
                    || newName.length <SharedConfig.MIN_NAME_LENGTH
                    || newName.length > SharedConfig.MAX_NAME_LENGTH
                ){
                    this._showFeedback(I18N.translate("incorrect_name_length",SharedConfig.MIN_NAME_LENGTH,SharedConfig.MAX_NAME_LENGTH),true);
                    return;
                }

                // check just consists letters and digits
                if(!/^\w+$/.test(newName)){
                    this._showFeedback(I18N.translate("incorrect_name_characters"),true);
                    return;
                }

                this._showFeedback();   // hide error messages

                this.emit(EVT_ONCONFIRM,{name:newName});
                //this.close();

                break;
            default: return;
        }
    }

    onNameRejected(evt){
        this._showFeedback(I18N.translate(evt.reason),true);
    }

    onNameChanged(evt){
        this.close();
    }


    _showFeedback(msg,error){
        this.errorLabelNode.classList.remove("invalid");
        this.errorLabelNode.classList.remove("valid");

        if(!msg){       // show nothing, if there is no message
            return;
        }
        this.errorLabelNode.classList.add(error?"invalid":"valid");
        this.errorLabelNode.classList.add("feedback");
        this.errorLabelNode.textContent = msg;

        setTimeout(()=>this.errorLabelNode.classList.remove("feedback"),500 );
    }

}

module.exports = NameChooser;