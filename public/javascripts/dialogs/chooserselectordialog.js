/**
 * Created by Mick on 07.06.2017.
 */

'use strict';
const Rights = require('./../../../core/rights');
const Util = require('./../../../core/util');
var EventEmitter3 = require('eventemitter3');

var EVT_OPEN_COLORCHOOSER = "opencolorchooser";
var EVT_OPEN_SEATCHOOSER = "openseatchooser";
var EVT_OPEN_NAMECHOOSER = "opennamechooser";
var EVT_ONDISPOSE = "ondispose";
var EVT_ONCLOSE = "onclose";
class ChooserSelectorDialog extends  EventEmitter3{

    constructor(player,rootContainer) {
        super();
        var fragment = Util.htmlStringToNode(window.inGamePlayerConfig({
            I18N: I18N.completeLanguageData,
            isRegistered:Rights.strongerOrEqual(player.userStatus,Rights.RIGHTS.registered)
        }));

        Util.stopPropagation(fragment);  //override listeners, so nothing passes to the game

        var btns= fragment.querySelectorAll(".btn");//this._rootContainer.querySelectorAll("btn");

        for(let i=0;i<btns.length;i++){
            btns[i].onclick = (e)=>this._click(btns[i].dataset.action);
        }
        this._rootNode = fragment.childNodes[0];
        (rootContainer || document.body).appendChild(fragment);
    }

    close(){
        if(!this._rootNode.parentNode) return;
        this.emit(EVT_ONCLOSE,this);
        this._rootNode.parentNode.removeChild(this._rootNode);
    }

    _click(action){
        switch (action){
            case "cancel": this.emit(EVT_ONDISPOSE,this);  break;
            case "name": this.emit(EVT_OPEN_NAMECHOOSER,this);  break;
            case "color": this.emit(EVT_OPEN_COLORCHOOSER,this);  break;
            case "seat": this.emit(EVT_OPEN_SEATCHOOSER,this);  break;

            default: return;
        }

        this.close();
    }
}

module.exports = ChooserSelectorDialog;