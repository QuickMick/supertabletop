/**
 * Created by Mick on 19.05.2017.
 */
"use strict";
require('pixi.js');
var Config = require('./../resources/config.json');
var Resources = require('./../resources/resources.json');

var GameTable = require('./gametable');
var EntityManager = require('./entitymanager');
var PlayerManager = require('./playermanager');
var Synchronizer = require('./synchonizer');
var InputHandler = require('./inputhandler');

var RELATIVE_PATH = "./../";

/**
 * this class controlls the whole gameplay,
 * loads games, sets everything up, holds game related information
 */
class GameManager{

    constructor(app){
        this.app = app;

        /**
         * contains the main container
         * @type {DraggameTable}
         */
        this.gameTable = null;
    }

    start(){
        // setup main gameTable container
        this.gameTable = new GameTable(
            this.app.renderer
        );

        // init the inputhandler
        InputHandler.init(this.app.stage);

        this.gameTable.min_zoom = Config.ZOOM.MIN;
        this.gameTable.max_zoom = Config.ZOOM.MAX;
        this.gameTable.zoom_sensivity = Config.ZOOM.SENSIVITY;

        // setup container hierarchy
        this.gameTable.addChild(EntityManager);
        this.gameTable.addChild(PlayerManager);
        this.app.stage.addChild(this.gameTable);

        // add default table
        this.gameTable.setTable(
            Resources.default.content.table.width,
            Resources.default.content.table.height,
            PIXI.loader.resources[Resources.default.content.table.texture].texture
        );

        // initialize socket-connection/synchronizer
        Synchronizer.init(EntityManager);

        /*
        this.context={
            world:new PIXI.Container(),
            players:new PIXI.Container(),
            entities:new PIXI.Container()
        };
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFF00);
        graphics.lineStyle(5, 0xFF0000);

        graphics.drawRect(0, 0, 1000,1000);
        this.context.world.addChild(graphics);

        this.context.players.interactive = true;
        this.context.world.addChild(this.context.entities);

        this.context.world.addChild(this.context.players);*/
    }

    update(delta){

    }

/*
    this.context.players.on('mousemove', this.sendMousePos.bind(this))
.on('touchmove', this.sendMousePos.bind(this));


    sendMousePos(data) {
        var cp = data.data.getLocalPosition(this.context.players.parent);
        this.sendMessage(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,{msg:"",data:{x:cp.x,y:cp.y}});
    }*/
}

module.exports=GameManager;