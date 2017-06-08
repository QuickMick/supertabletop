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
        this.fragment = Util.htmlStringToNode(window[layout](layoutLocals));

        Util.stopPropagation(this.fragment);  //override listeners, so nothing passes to the game
        var btns= this.fragment.querySelectorAll(".btn");//this._rootContainer.querySelectorAll("btn");

        // add listeners to the buttons, if there are some
        if(btns) {
            for (let i = 0; i < btns.length; i++) {
                if (!btns[i] || !btns[i].dataset || !btns[i].dataset.action)
                    continue;

                btns[i].onclick = (e)=>this._click(btns[i].dataset.action);
            }
        }

        this._rootNode = this.fragment.childNodes[0];

    }

    show(rootContainer){
        (rootContainer || document.body).appendChild(this.fragment);
        delete this.fragment;
    }

    _click(action){

    }

    close(){
        if(!this._rootNode.parentNode) return;
        this.emit(EVT_ONCLOSE,this);
        this._rootNode.parentNode.removeChild(this._rootNode);
    }
}

module.exports = BaseDialog;