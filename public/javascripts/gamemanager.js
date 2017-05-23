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
        // init the inputhandler

        PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

        // setup main gameTable container
        this.gameTable = new GameTable(
            this.app.renderer
        );

        InputHandler.init(this.app);
        EntityManager.init();
        PlayerManager.init();

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
    }

    update(delta){

    }

}

module.exports=GameManager;