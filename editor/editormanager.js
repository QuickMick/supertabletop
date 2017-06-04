/**
 * Created by Mick on 29.05.2017.
 */
"use strict";

var EventEmitter3 = require('eventemitter3');

class EditorManager extends EventEmitter3{

    constructor(app){
        super();
        this.app = app;
    }

    start(){
        // close loding screen, when initialization is done.
        window.hideLoadingDialog();
    }

    update(delta){
        var elapsed =this.app.ticker.elapsedMS;
        var d = elapsed/1000;
        // pass d to update methods d= miliseconds one frame needs
    }
}

module.exports = EditorManager;