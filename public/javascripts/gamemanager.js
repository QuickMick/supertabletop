/**
 * Created by Mick on 19.05.2017.
 */
"use strict";
require('pixi.js');
var Entity = require('./entity');
var Statics = require("./../../core/statics");

var RELATIVE_PATH = "./../";

class GameManager{

    constructor(app){
        this.app = app;
    }

    start(){

        this.context={
            world:new PIXI.Container(),
            players:new PIXI.Container(),
            entities:new PIXI.Container()
        };

        this.context.players.on('mousemove', this.sendMousePos.bind(this))
            .on('touchmove', this.sendMousePos.bind(this));


        this.app.stage.addChild(this.context.world);

        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFF00);
        graphics.lineStyle(5, 0xFF0000);

        graphics.drawRect(0, 0, 1000,1000);
        this.context.world.addChild(graphics);

        this.context.players.interactive = true;
        this.context.world.addChild(this.context.entities);

        this.context.world.addChild(this.context.players);
    }

    update(delta){

    }

    sendMousePos(data) {
        var cp = data.data.getLocalPosition(this.context.players.parent);
        this.sendMessage(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,{msg:"",data:{x:cp.x,y:cp.y}});
    }
}

module.exports=GameManager;