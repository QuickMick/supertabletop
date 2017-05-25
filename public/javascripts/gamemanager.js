/**
 * Created by Mick on 19.05.2017.
 */
"use strict";
require('pixi.js');
var Path = require('path');

var Config = require('./../resources/config.json');
var Resources = require('./../resources/resources.json');
var Entity = require('./entity');
var GameTable = require('./gametable');

var EntityManager = require('./entitymanager');
var PlayerManager = require('./playermanager');
var Synchronizer = require('./synchonizer');
var InputHandler = require('./inputhandler');
var ToolManager = require('./toolmanager');

const RELATIVE_PATH = "./../";

/**
 * this class controlls the whole gameplay,
 * loads games, sets everything up, holds game related information
 */
class GameManager{
    constructor(app){
        this.app = app;

       // this.USER_ID = null;

        /**
         * contains the main container
         * @type {DraggameTable}
         */
        this.gameTable = null;
    }

    start(){
        // init the inputhandler
      //  PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

        // setup main gameTable container
        this.gameTable = new GameTable(this.app.renderer);

        this.inputHandler = new InputHandler(this.app);
        this.inputHandler.loadMapping(Config.KEY_MAPPING);

        this.entityManager = new EntityManager();
        this.playerManager = new PlayerManager;
        this.synchronizer = new Synchronizer(this,this.entityManager);     // initialize socket-connection/synchronizer

        this.toolManager = new ToolManager(this.inputHandler,this.gameTable,this.entityManager,this.synchronizer);

        this.gameTable.min_zoom = Config.ZOOM.MIN;
        this.gameTable.max_zoom = Config.ZOOM.MAX;
        this.gameTable.zoom_sensivity = Config.ZOOM.SENSIVITY;

        // setup container hierarchy
        this.gameTable.addChild(this.entityManager);
        this.gameTable.addChild(this.playerManager);
        this.app.stage.addChild(this.gameTable);

        // add default table
        this.gameTable.setTable(
            Resources.default.content.table.width,
            Resources.default.content.table.height,
            PIXI.loader.resources[Resources.default.content.table.texture].texture
        );




        this.test();
    }

    /**
     * Initialises a prepreperated game.
     * during this process, every entity gets deleted,
     * afterwards, the game related entities are created.
     * also all resources are loaded.
     * @param game resource from server, contains all data about entities, game info and resources
     * @private
     */
    initGame(game){
        console.log("result: " + game);
        window.showLoadingDialog();
        // prepare resource list
        var game_resource_path = Path.join(game.creator,game.name);
        for(let i in game.resources){
            var name = game.resources[i];

            PIXI.loader.add(
                {
                    name:Path.join(game_resource_path,name),
                    url: Path.join(RELATIVE_PATH,Config.PATHS.USERS_RESOURCES,game_resource_path,name)
                }
            );
        }

        // create entities
        var newEntityList = [];
        for(let i=0; i< game.entities.length;i++) {
            game.entities[i].game_resource_path = game_resource_path;
            var newEntity =new Entity(game.entities[i]);
            newEntityList.push(newEntity);
            this.entityManager.addEntity(newEntity);
        }

        window.hideLoadingDialog();
        // once the gfx is loaded, force every entity, to show its real texture instead of the placeholder
        PIXI.loader/*.on('load',function (a,b,d) {
                console.log(a,b,d);
            }
        )*/.once('complete', function (loader, resources) {

            // set the loaded grafix to the entities
            for(let i=0; i< newEntityList.length;i++) {
                var c =newEntityList[i];
                c.showSurface(c.surfaceIndex);
            }

            // if table is given in the game.json, then set it as new table
            var table_texture = Path.join(game_resource_path,game.table.texture);
            if(game.table && game.table.width
                && game.table.height && game.table.texture
                && PIXI.loader.resources[table_texture]
                &&PIXI.loader.resources[table_texture].texture) {
                this.gameTable.setTable(
                    game.table.width,
                    game.table.height,
                    PIXI.loader.resources[table_texture].texture
                );
            }

        }.bind(this)).load();
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