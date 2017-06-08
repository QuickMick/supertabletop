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
const Packages = require('./../../core/packages');
var LerpManager = require('./lerpmanager');
var EntityManager = require('./entitymanager');
var PlayerManager = require('./playermanager');
var Synchronizer = require('./synchonizer');
var InputHandler = require('./inputhandler');
var ToolManager = require('./toolmanager');
var CursorManager = require('./cursormanager');

var ChatHandler = require('./chathandler');

var NameChooser = require('./dialogs/namechooser');
var ChooserSelectorDialog = require('./dialogs/chooserselectordialog');
var GameChooserDialog = require('./dialogs/gamechooserdialog');

var SeatChooser = require('./seatchooser');
var ColorChooser = require('./colorchooser');


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



        // this.playerManager.on('colorchanged',this.seatChooser.onColorChanged);

        this.cursorManager = new CursorManager(this.app);


        // setup main gameTable container
        this.lerpManager = new LerpManager();
        this.entityManager = new EntityManager(this.lerpManager,this.cursorManager);
        this.gameTable = new GameTable(this.app.renderer,this.entityManager);
        this.inputHandler = new InputHandler(this.app,this.gameTable);
        this.inputHandler.loadMapping(Config.KEY_MAPPING);



        this.entityManager.on('entitymoved',this.gameTable.onEntityMovedOrAdded.bind(this.gameTable));
        this.entityManager.on('entityadded',this.gameTable.onEntityMovedOrAdded.bind(this.gameTable));

        this.playerManager = new PlayerManager(this.lerpManager,this.cursorManager,this.inputHandler,this.gameTable);

        this.playerManager.on('playerindexchanged',this.gameTable.onPlayerIndexChanged.bind(this.gameTable));


        this.playerManager.on('playerconnected',this.gameTable.onPlayerConnected.bind(this.gameTable));
        this.playerManager.on('playerdisconnected',this.gameTable.onPlayerDisconnected.bind(this.gameTable));
        this.playerManager.on('colorchanged',this.gameTable.onColorChanged.bind(this.gameTable));


        this.chatHandler = new ChatHandler("game-chat");
/*
        var EVT_PLAYER_COLOR_CHANGED='colorchanged';
        var EVT_PLAYER_INDEX_CHANGED='playerindexchanged';
        var EVT_PLAYER_DISCONNECTED ='playerdisconnected';
        var EVT_PLAYER_CONNECTED ='playerconnected';



        this.playerManager.on('playerdisconnected',this.chatHandler.onPlayerDisconnected.bind(this.gameTable));
        this.playerManager.on('colorchanged',this.chatHandler.onColorChanged.bind(this.gameTable));
*/
     //   this.chatHandler.pushMessage(I18N.translate("player_connected",evt.data.name,evt.data.creator),"system",evt.timeStamp);
        this.playerManager.on('playerconnected',(evt) => this.chatHandler.pushMessage(I18N.translate("player_connected",evt.player.name),"system"));
        this.playerManager.on('playerdisconnected',(evt) => this.chatHandler.pushMessage(I18N.translate("player_disconnected",evt.player.name),"system"));
        this.playerManager.on('colorchanged',(evt) => this.chatHandler.pushMessage(I18N.translate("player_color_changed",evt.player.name),"system"));
        this.playerManager.on('playerindexchanged',(evt) => this.chatHandler.pushMessage(I18N.translate("player_seat_changed",evt.player.name),"system"));
        this.playerManager.on('namechanged',(evt) => this.chatHandler.pushMessage(I18N.translate("player_name_changed",evt.oldName,evt.newName),"system"));

        this.synchronizer = new Synchronizer(this);     // initialize socket-connection/synchronizer


        // open the menu selection dialog
        this.playerManager.on('configchangerequest',(evt)=>{
            // do not open selector chooser, if a dialog is already open
            if(this.seatChooser || this.colorChooser) return;
            var selector = new ChooserSelectorDialog(evt);

            selector.on('opencolorchooser',(e)=>this.showColorChooser());
            selector.on('openseatchooser',(e)=>this.showSeatChooser());
            selector.on('opennamechooser',(e)=>{
                var nc = new NameChooser(this.playerManager.currentPlayer);
                // add listener and remove listener
                nc.on('onconfirm',(e)=>{
                    this.synchronizer.sendPlayerUpdate([
                        {key:Packages.PROTOCOL.CLIENT_VALUE_UPDATE.NAME,value:e.name}
                    ]);
                });
                this.playerManager.on('namechanged',nc.onNameChanged.bind(nc));
                this.synchronizer.on('namerejected',nc.onNameRejected.bind(nc));
                nc.on('onclose',(e)=>{
                    this.synchronizer.removeListener('namerejected',nc.onNameRejected.bind(nc));
                    this.playerManager.removeListener('namechanged',nc.onNameChanged.bind(nc));
                });
            });
        });

        document.getElementById("open-game-chooser").onclick = function(){
           var x= new GameChooserDialog();
            x.show();
        }.bind(this);


        this.chatHandler.on('send',this.synchronizer.sendChatMessage.bind(this.synchronizer));


        /**
         * if player has no color, this will have a value
         * showColorChooser() and hideColorChooser() are depending on this value
         * @type {null}
         */
        this.seatChooser = null;
        this.colorChooser = null;

        this.playerManager.on('playerindexchanged',this.hideSeatChooser.bind(this));
        this.playerManager.on('colorchanged',this.hideColorChooser.bind(this));

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

        // if a table is set, load the texture if available
        if(!game.DEFAULT_GAME && game.table && game.table.texture){
            PIXI.loader.add(
                {
                    name:Path.join(game_resource_path,game.table.texture),
                    url: Path.join(RELATIVE_PATH,Config.PATHS.USERS_RESOURCES,game_resource_path,game.table.texture)
                }
            );
        }

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
        // the player seats are also snapzones
        this.toolManager.snapZones = (game.snapzones || []).concat((game.table || {}).seats || []);
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
        }

         // just set the path if it is not the default game
        // and if table exists
        (game.table || {}).game_resource_path = game.DEFAULT_GAME? "" : game_resource_path;


        newEntityList = this.entityManager.batchCreateEntities(game.entities);

        // set first table with default texture
       /* this.gameTable.setTable(
            game.table.width,
            game.table.height,
            PIXI.loader.resources[Resources.default.content.table.texture].texture
        );*/
        this.gameTable.setTable(game.table,this.playerManager);          // if table is given in the game.json, then set it as new table

        // gamedata is available, hide loading screen
        window.hideLoadingDialog();
        //TODO: set textures on loaded, not just on complete

        // once the gfx is loaded, force every entity, to show its real texture instead of the placeholder
        PIXI.loader.once('complete', function (loader, resources) {
             // once all textures are loaded, then set table with real texture
          /*  this.gameTable.setTable(
                game.table.width,
                game.table.height,
                PIXI.loader.resources[game.table.texture].texture
            );
*/
            // set the loaded grafix to the entities
            for (let i = 0; i < newEntityList.length; i++) {
                var c = newEntityList[i];
                c.surfaceIndex = c.surfaceIndex;
            }
            /*if (game.table && game.table.width
                && game.table.height && game.table.texture
                && PIXI.loader.resources[table_texture]
                && PIXI.loader.resources[table_texture].texture) {
                this.gameTable.setTable(
                    game.table.width,
                    game.table.height,
                    PIXI.loader.resources[table_texture].texture
                );
            }*/
            this.gameTable.setTable(game.table,this.playerManager);    // sets the table of the game, or the default table
                                                    // if no table available in the game

        }.bind(this)).load();
    }

    update(delta){
        var elapsed =this.app.ticker.elapsedMS;
        var d = elapsed/1000;
        this.toolManager.update(d);   //TODO: pass real delta time - weis net was passiert wenn ichs mach
        this.lerpManager.update(d);

        if(this.seatChooser)
            this.seatChooser.update(d);
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


    showSeatChooser(){
        if(this.seatChooser) return; // do not show again, if seatchooser is already shown
        this.seatChooser = new SeatChooser(this.gameTable,this.synchronizer,this.playerManager);

       // this.playerManager.on('colorchanged',this.seatChooser.onColorChanged);
        this.playerManager.on('playerindexchanged',this.seatChooser.onPlayerIndexChanged.bind(this.seatChooser));
        this.playerManager.on('playerdisconnected',this.seatChooser.onPlayerDisconnected.bind(this.seatChooser));
        this.playerManager.on('playerconnected',this.seatChooser.onPlayerConnected.bind(this.seatChooser));
        this.seatChooser.on('canceled',this.hideSeatChooser.bind(this));
        this.gameTable.addChild(this.seatChooser);

    //    this.seatChooser.on('colorselected',this.hideColorChooser.bind(this));
    }

    hideSeatChooser(evt){
        if(!this.seatChooser || !this.seatChooser.parent || evt.player.playerIndex <0) return;

        if(!evt.player.isCurrentPlayer) return; // if change does not affect human player, dont hide
        if(evt.newPlayerIndex < 0) return;  // if seat still not selected, dont hide

      //  this.playerManager.removeListener('colorchanged',this.seatChooser.onColorChanged);
        this.playerManager.removeListener('playerindexchanged',this.seatChooser.onPlayerIndexChanged.bind(this.seatChooser));
        this.playerManager.removeListener('playerdisconnected',this.seatChooser.onPlayerDisconnected.bind(this.seatChooser));
        this.playerManager.removeListener('playerconnected',this.seatChooser.onPlayerConnected.bind(this.seatChooser));
        this.seatChooser.parent.removeChild(this.seatChooser);
        this.seatChooser = null;

        if(!evt.player.color || evt.player.color <0) {
            this.showColorChooser();
        }
    }

    showColorChooser(){
        if(this.colorChooser) return; // do not show colorchooser again, if it is already shown
        this.colorChooser = new ColorChooser(this.app.renderer,this.gameTable,this.synchronizer,this.playerManager);
        this.app.stage.addChild(this.colorChooser);
        this.on('resize',this.colorChooser.redrawChooser.bind(this.colorChooser));

        this.playerManager.on('colorchanged',this.colorChooser.onRedrawNecessaryHandler.bind(this.colorChooser));
        this.playerManager.on('playerdisconnected',this.colorChooser.onRedrawNecessaryHandler.bind(this.colorChooser));
        this.playerManager.on('playerconnected',this.colorChooser.onRedrawNecessaryHandler.bind(this.colorChooser));

        this.colorChooser.on('canceled',this.hideColorChooser.bind(this));
    }

    hideColorChooser(){
        if(!this.colorChooser || !this.colorChooser.parent || this.playerManager.currentPlayer.color <0) return;
        this.removeListener('reseize',this.colorChooser.redrawChooser.bind(this.colorChooser));
        this.playerManager.removeListener('colorchanged',this.colorChooser.onRedrawNecessaryHandler.bind(this.colorChooser));
        this.playerManager.removeListener('playerdisconnected',this.colorChooser.onRedrawNecessaryHandler.bind(this.colorChooser));
        this.playerManager.removeListener('playerconnected',this.colorChooser.onRedrawNecessaryHandler.bind(this.colorChooser));
        this.colorChooser.parent.removeChild(this.colorChooser);
        this.colorChooser = null;
    }
}

module.exports=GameManager;