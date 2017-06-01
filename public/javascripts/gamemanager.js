/**
 * Created by Mick on 19.05.2017.
 */
"use strict";
require('pixi.js');
var Path = require('path');
var EventEmitter3 = require('eventemitter3');
const uuidV4 = require('uuid/v4');

var Config = require('./../resources/config.json');
var DefaultGame = require('./../resources/default_game.json');
var Resources = require('./../resources/resources.json');
var Entity = require('./entity');
var GameTable = require('./gametable');

var LerpManager = require('./lerpmanager');
var EntityManager = require('./entitymanager');
var PlayerManager = require('./playermanager');
var Synchronizer = require('./synchonizer');
var InputHandler = require('./inputhandler');
var ToolManager = require('./toolmanager');
var CursorManager = require('./cursormanager');

const RELATIVE_PATH = "./../";

/**
 * this class controlls the whole gameplay,
 * loads games, sets everything up, holds game related information
 */
class GameManager extends EventEmitter3{
    constructor(app){
        super();
        this.app = app;

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
        this.cursorManager = new CursorManager(this.app);
        this.inputHandler = new InputHandler(this.app,this.gameTable);
        this.inputHandler.loadMapping(Config.KEY_MAPPING);

        this.lerpManager = new LerpManager();
        this.entityManager = new EntityManager(this.lerpManager,this.cursorManager);
        this.playerManager = new PlayerManager(this.lerpManager,this.cursorManager,this.inputHandler,this.gameTable);
        this.synchronizer = new Synchronizer(this);     // initialize socket-connection/synchronizer

       /* this.gameTable.min_zoom = Config.ZOOM.MIN;
        this.gameTable.max_zoom = Config.ZOOM.MAX;
        this.gameTable.zoom_sensivity = Config.ZOOM.SENSIVITY;*/

        // setup container hierarchy
        this.gameTable.addChild(this.entityManager);
        this.gameTable.addChild(this.playerManager);
        this.app.stage.addChild(this.gameTable);

        this.toolManager = new ToolManager(this);
        this.synchronizer.init();

        // init game with default game
        this.initGame(Object.assign({},DefaultGame));

        this.initEasterEggs();
    }

    /**
     * Initialises a prepreperated game.
     * during this process, every entity gets deleted,
     * afterwards, the game related entities are created.
     * also all resources are loaded.
     *
     * cam be called more than once
     *
     * @param game resource from server, contains all data about entities, game info and resources
     * @private
     */
    initGame(game){
        console.log("load game",game.name,"by",game.creator);

        // show loading screen
        window.showLoadingDialog();

        // prepare resource list
        var game_resource_path = Path.join(game.creator,game.name);


        // reset the loader, but keep the resoruces,
        // this is necassary, to prevent errors, if the loader is currently running
        var res = PIXI.loader.resources;
        PIXI.loader.reset();
        PIXI.loader.resources = res;

        PIXI.loader.game_resource_path = game_resource_path; // TODO: muss ins contex/loader object

        //TODO: create a new loader for each new game -> when context refactoring
        //TODO: load shown textures first
        for(let i in game.resources){
            var name = game.resources[i];
            // do not load resource again, if already existing
            if(PIXI.loader.resources[name]) continue;
            PIXI.loader.add(
                {
                    name:Path.join(game_resource_path,name),
                    url: Path.join(RELATIVE_PATH,Config.PATHS.USERS_RESOURCES,game_resource_path,name)
                }
            );
        }

        // set the snappoints to the toolmanager
        this.toolManager.snapZones = game.snapzones || [];

        // generate uniq ids for the snapzones if there is no id available
        var snapZoneIdCache = new Set();
        for(var i=0;i<this.toolManager.snapZones.length;i++){
            var id = this.toolManager.snapZones[i].id || "sz"+i+"_"+uuidV4();
            if(!snapZoneIdCache.has(id)) {  // if there is a duplicate id
                this.toolManager.snapZones[i].id = id;
            }else{  // create a new one
                this.toolManager.snapZones[i].id = (this.toolManager.snapZones[i].id || "sz"+i)+"_"+uuidV4();
            }
        }

        // create entities, necessary to pass the loader,
        // so the required texture can get assigned, once loaded
        var newEntityList = [];

        // sort entities, so that the one which was changed last is on top
        game.entities.sort(function(a, b) {
            return a.state.timestamp - b.state.timestamp
        });

        // create entities based on the loaded data and add them to the gamemanager
        for(let i=0; i< game.entities.length;i++) {
            game.entities[i].game_resource_path = game_resource_path;
     //       var newEntity =new Entity(game.entities[i]);
          //  newEntityList.push(newEntity);
        //    this.entityManager.addEntities(newEntity);
        }

        newEntityList = this.entityManager.batchCreateEntities(game.entities);

        // set first table with default texture
        this.gameTable.setTable(
            game.table.width,
            game.table.height,
            PIXI.loader.resources[Resources.default.content.table.texture].texture
        );

        // gamedata is available, hide loading screen
        window.hideLoadingDialog();
        //TODO: set textures on loaded, not just on complete

        // once the gfx is loaded, force every entity, to show its real texture instead of the placeholder
        PIXI.loader.once('complete', function (loader, resources) {
             // once all textures are loaded, then set table with real texture
            this.gameTable.setTable(
                game.table.width,
                game.table.height,
                PIXI.loader.resources[game.table.texture].texture
            );

            // set the loaded grafix to the entities
            for (let i = 0; i < newEntityList.length; i++) {
                var c = newEntityList[i];
                c.surfaceIndex = c.surfaceIndex;
            }

            // if table is given in the game.json, then set it as new table
            var table_texture = Path.join(game_resource_path, game.table.texture);
            if (game.table && game.table.width
                && game.table.height && game.table.texture
                && PIXI.loader.resources[table_texture]
                && PIXI.loader.resources[table_texture].texture) {
                this.gameTable.setTable(
                    game.table.width,
                    game.table.height,
                    PIXI.loader.resources[table_texture].texture
                );
            }
        }.bind(this)).load();
    }

    update(delta){
        var elapsed =this.app.ticker.elapsedMS;
        var d = elapsed/1000;
        this.toolManager.update(d);   //TODO: pass real delta time - weis net was passiert wenn ichs mach
        this.lerpManager.update(d);
    }

    initEasterEggs(){
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