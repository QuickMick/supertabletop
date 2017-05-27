/**
 * Created by Mick on 24.05.2017.
 */
'use strict';
require('pixi-filters');
require('pixi-extra-filters');

var Packages = require('./../../core/packages');

var OutlineFilter = require('./filters/outlinefilter');


class BasicTool{
    constructor(inputHandler,gameTable,entityManager,playerManager,synchronizer){
        this.inputHanlder=inputHandler;
        this.gameTable = gameTable;
        this.entityManager = entityManager;
        this.playerManager=playerManager;
        this.synchronizer = synchronizer;

        /**
         * true, when the camera is moving,
         * otherwise false.
         *
         */
        this._camera_grabbed=false;

        /**
         * Contains all selected entities, which will be
         * get affected by the user input
         */
        this._selected_entities=[];

        this._current_zoom = 1;
        this.zoom_sensivity = 0.1;
        this._min_zoom = 0.4;
        this._max_zoom = 2.5;

        this.inputHanlder.on("mousewheel", this._zoom.bind(this), false)
            .on("mousemove",this._mouseMove.bind(this))
            .on("rawmousemove",this._onRawMouseMove.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("pressed",function(){this.CAMERA_GRABBED=true;}.bind(this))
            .on("released",function(){this.CAMERA_GRABBED=false;}.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("released",this._releaseSelection.bind(this));

        this.entityManager.on("entityclicked",this._onEntityClicked.bind(this));

      //  this.selectionFilter =new PIXI.filters.BloomFilter();
    }

    _onEntityClicked(evt){
     //   this.SELECTED_ENTITIES.push(evt.entity);
    }

    _releaseSelection(evt){
        this.SELECTED_ENTITIES =[];
    }

    /**
     *
 * @param evt
     * @private
     */
    _mouseMove(evt){
        if(!this.CAMERA_GRABBED) return;

        this.gameTable.position.x +=evt.dx;
        this.gameTable.position.y +=evt.dy;
        this.focusCamera();
    }

    /**
     * used to get local stage mouse positionas via
     *     event.data.getLocalPosition(stage)
     * @param evt
     * @private
     */
    _onRawMouseMove(evt){

    }

    /**
     * camera loses grab if an entity is selected
     * @returns {boolean}
     * @constructor
     */
    get CAMERA_GRABBED(){
        if((this._selected_entities||[]).length >0) return false;
        return this._camera_grabbed;
    }

    /**
     *
     * @param v {boolean}
     * @constructor
     */
    set CAMERA_GRABBED(v){
        this._camera_grabbed = v;
    }

    get SELECTED_ENTITIES(){
        return this._selected_entities;
    }

    set SELECTED_ENTITIES(v){
        this._selected_entities = v || [];
    }

    get min_zoom(){
        return this._min_zoom;
    }

    get max_zoom(){
        return this._max_zoom;
    }

    get current_zoom(){
        return this._current_zoom;
    }

    set min_zoom(v) {
        this._min_zoom = v;
        if (v > this._current_zoom) {
            this._current_zoom = v;
        }
    }

    set max_zoom(v){
        this._max_zoom=v;
        if(v<this._current_zoom){
            this._current_zoom = v;
        }
    }

    set current_zoom(v){
        var old = this._current_zoom;
        this._current_zoom=v;

        if(this._current_zoom > this._max_zoom){
            this._current_zoom= this._max_zoom ;
        }

        if(this._current_zoom < this._min_zoom){
            this._current_zoom = this._min_zoom;
        }
        if(old != this._current_zoom) {
            this.focusCamera();
        }
    }

    _zoom(evt) {
        if(evt.delta <0 ){
            this.current_zoom+=this.zoom_sensivity;
        }

        if(evt.delta > 0 ){
            this.current_zoom-=this.zoom_sensivity;
        }
    }

    focusCamera(){
        this.gameTable.scale.set(this._current_zoom);
        var w = this.gameTable.hitArea.width;
        var h = this.gameTable.hitArea.height;
        var z = this._current_zoom;

        //TODO: folgendes wird warscheinlich nicht funktionieren, wenn drehen drin is
        if(w* z> this.gameTable.renderer.width) {
            if (this.gameTable.position.x < this.gameTable.renderer.width - w*z) this.gameTable.position.x = this.gameTable.renderer.width - w*z;
            if (this.gameTable.position.x > 0) this.gameTable.position.x = 0;
        }else{
            this.gameTable.position.x = this.gameTable.renderer.width/2 - (w*z)/2;
        }

        if(h*z > this.gameTable.renderer.height) {
            if (this.gameTable.position.y < this.gameTable.renderer.height - h*z) this.gameTable.position.y = this.gameTable.renderer.height - h*z;
            if (this.gameTable.position.y > 0) this.gameTable.position.y = 0;
        }else{
            this.gameTable.position.y = this.gameTable.renderer.height/2 - (h*z)/2;
        }
    }
}


class SimpleDragTool extends BasicTool{
    constructor(inputHandler,gameTable,entityManager,playerManager, synchronizer){
        super(inputHandler,gameTable,entityManager,playerManager,synchronizer);
    }

    /**
     * called, when mouse moves
     * @Override
     * @param evt
     * @private
     */
    _onRawMouseMove(evt){
        // get local position of the table, so kartesien cordinates {0,0} are the left upper corner of the table
        var localPos = evt.data.getLocalPosition(this.gameTable);

        // if nothing has changed, then updating the server is not necessary
        if(this._oldLocalPos
            && this._oldLocalPos.x == localPos.y
            && this._oldLocalPos.y == localPos.y){
            return;
        }
        this._oldLocalPos=localPos;

        // return if mousepos is outside of the gametable
       /* if(localPos.x < 0
            || localPos.y < 0
            || localPos.x > this.gameTable.width/this.current_zoom
            || localPos.y > this.gameTable.height/this.current_zoom)
            return;*/

        // if something has changed, then update the server
        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.CLIENT.USER_MOUSE_POSITION, this.synchronizer.CLIENT_INFO.id,
            {
                position:{x:(localPos.x),y:(localPos.y)}
            }
        );
    }

    _onEntityClicked(evt){
        super._onEntityClicked(evt);
        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_DRAG_START,this.synchronizer.CLIENT_INFO.id,
            {
                claimedEntity:evt.entity.ENTITY_ID,
                _mode:"push"
            }
        );
    }

    _releaseSelection(evt) {

        //this selection release
        var ids = [];
        for(var i=0; i<this.SELECTED_ENTITIES.length;i++){
            ids.push(this.SELECTED_ENTITIES[i].ENTITY_ID);
        }

        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_DRAG_END, this.synchronizer.CLIENT_INFO.id,
            {
                releasedEntities:ids,
                _mode:"push"
            }
        );

        super._releaseSelection(evt);
    }
}

class ToolManager{
    constructor(inputHandler,gameTable,entityManager,playerManager,synchronizer){
        this.tools=null;
        this._selectedToolIndex = 0;

        this.entityManager=entityManager;
        this.playerManager=playerManager;
        this.inputHandler = inputHandler;
        this.gameTable = gameTable;
        this.synchronizer=synchronizer;



        /**
         * filter which is used to display a selection
         * @type {PIXI.filters.BloomFilter}
         */
        this.tools=[new SimpleDragTool(inputHandler,gameTable,entityManager,playerManager,synchronizer)];
    }

    set currentTool(i){
        this._selectedToolIndex=i;
    }
    get currentTool(){
        return this.tools[this._selectedToolIndex];
    }


    batchUpdateEntityStateChange(data){
        if(!data){
            console.warn("no update data passed");
            return;
        }
        for(var entityID in data){
            if(!data.hasOwnProperty(entityID))continue;
            this.updateEntityStateChange(entityID,data[entityID]);
        }
    }

    updateEntityStateChange(entityID,stateUpdate){
        if(!entityID){
            console.warn("entity id is necessary to update enitty");
            return;
        }

        var curEntity = this.entityManager.entities[entityID];

        if(!curEntity){
            console.warn("entity",entityID,"does not exist!");
            return;
        }

        if(!stateUpdate){
            console.warn("no state update  for entity",entityID,"was passed");
            return;
        }

        // skip update, it the current state update is newer then the received one
        if(curEntity.state.timestamp > stateUpdate.timestamp){
            return;
        }

        switch (stateUpdate.state){
            case Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED:

                if(!stateUpdate.userID){
                    console.warn("invalide entity seleciton, no user id available - update rejected");
                    return;
                }

                // the passed id is the human player, then add the entity
                // to his selection
                if(this.synchronizer.CLIENT_INFO.id == stateUpdate.userID){
                    this.currentTool.SELECTED_ENTITIES.push(curEntity);
                }

                // add the filter, so that it is visible,
                // to everyone, that an entity is selected
                var selectionFilter = new OutlineFilter(
                    curEntity.width,
                    curEntity.height,
                    1,
                    this.playerManager.players[stateUpdate.userID].rawPlayerData.color || 0xFFFFFF
                );

                curEntity.addFilter(selectionFilter);

                // save the filter, so it can get removed later
                curEntity.tmpSelectionFilter= selectionFilter;

                // and also bring the entity to the front
                curEntity.bringToFront();
                break;

            default:
            case Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_DEFAULT_STATE:
                // if enttiy was selected, unselect it
                if(curEntity.state.state == Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED) {

                    // check if there is a filter available and remove it from the entity, if it was selected previously
                    if(curEntity.tmpSelectionFilter) {
                        curEntity.removeFilter(curEntity.tmpSelectionFilter);
                        delete curEntity.tmpSelectionFilter;
                    }
                }
                break;
        }

        curEntity.state = stateUpdate;
    }
}

module.exports = ToolManager;