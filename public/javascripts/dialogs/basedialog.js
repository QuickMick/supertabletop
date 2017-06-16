/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

const EventEmitter3 = require('eventemitter3');
const Util = require('./../../../core/util');

const EVT_ONCLOSE = "onclose";

class BaseDialog extends EventEmitter3{
    constructor(layout,layoutLocals) {
        super();
        this.fragment = Util.htmlStringToNode(window[layout](layoutLocals || {}));

        Util.stopPropagation(this.fragment);  //override listeners, so nothing passes to the game
        var btnsArry= this.fragment.querySelectorAll(".action");//this._rootContainer.querySelectorAll("btn");

        this.btns = {};
        // add listeners to the buttons, if there are some
        if(btnsArry) {
            for (let i = 0; i < btnsArry.length; i++) {
                let cur = btnsArry[i];

                if (!cur || !cur.dataset || !cur.dataset.action)
                    continue;

                this.btns[cur.dataset.action] = cur;

                cur.onclick = (e)=>{
                    if(cur.isDisabled) return;
                    this._click(cur.dataset.action);
                };
            }
        }

        this._rootNode = this.fragment.childNodes[0];
    }
    
  /*  _disableAllButtons(){
       // this.disabledButtons = true;
        for(var k in this.btns){
            if(!this.btns.hasOwnProperty(k)) continue;
            this.btns[i].classList.add("disabled");
        }
    }
    _enableAllButtons(){
     //   this.disabledButtons = false;
        for(var k in this.btns){
            if(!this.btns.hasOwnProperty(k)) continue;
            this.btns[i].classList.remove("disabled");
        }
    }*/

    disableButton(action){
        if(!action || !this.btns[action]) return;
        this.btns[action].isDisabled = true;
        this.btns[action].classList.add("disabled");
    }

    enableButton(action){
        if(!action || !this.btns[action]) return;
        delete this.btns[action].isDisabled;
        this.btns[action].classList.remove("disabled");
    }

    show(rootContainer){
        (rootContainer || document.body).appendChild(this.fragment);
        delete this.fragment;
    }

    _click(action){
        if(this.btns[action] && this.btns[action].isDisabled) return;
    }

    close(){
        if(!this._rootNode.parentNode) return;
        this.emit(EVT_ONCLOSE,this);
        this._rootNode.parentNode.removeChild(this._rootNode);
    }
}

module.exports = BaseDialog;