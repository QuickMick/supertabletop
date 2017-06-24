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

      //  Util.stopPropagation(this._rootNode);  //override listeners, so nothing passes to the game
    }
    
    disableAllButtons(){
        for(var k in this.btns){
            if(!this.btns.hasOwnProperty(k)) continue;
            this.btns[k].classList.add("disabled");
        }
    }
    enableAllButtons(){
        for(var k in this.btns){
            if(!this.btns.hasOwnProperty(k)) continue;
            this.btns[k].classList.remove("disabled");
        }
    }

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
        this._container = (rootContainer || document.body);
        this._container.appendChild(this.fragment);
        delete this.fragment;

        // make dialog closeable with ESC key
        this._escCloseListener = function(e){
            if (!e) e = window.event;
            var keyCode = e.keyCode || e.which;
            if (keyCode == '27') {  // Enter pressed
                this.close();
                return false;
            }
        }.bind(this);

        this._container.addEventListener("keyup", this._escCloseListener, true);
    }



    _click(action){
     //   if(this.btns[action] && this.btns[action].isDisabled) return;
    }
  /*
    _click(action){

    }*/

    close(){
        this._container.removeEventListener("keyup",this._escCloseListener,true);
        delete this._escCloseListener;
        if(!this._rootNode.parentNode) return;
        this.emit(EVT_ONCLOSE,this);
        this._rootNode.parentNode.removeChild(this._rootNode);
    }
}

module.exports = BaseDialog;