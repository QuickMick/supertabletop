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

        this.test();
    }


    update(delta){

    }

    test(){

        document.getCrazy = function(){
            var count=0;
            var filter = new PIXI.filters.ColorMatrixFilter();
            this.stage.filters = [filter];

            this.ticker.add(function(){
                var matrix = filter.matrix;
                count += 0.1;
                matrix[1] = Math.sin(count) * 3;
                matrix[2] = Math.cos(count);
                matrix[3] = Math.cos(count) * 1.5;
                matrix[4] = Math.sin(count / 3) * 2;
                matrix[5] = Math.sin(count / 2);
                matrix[6] = Math.sin(count / 4);
            });
        }.bind(this.app);

        document.getYourShitTogether = function () {
            this.stage.filters = null;
        }.bind(this.app);
    }

}

module.exports=GameManager;