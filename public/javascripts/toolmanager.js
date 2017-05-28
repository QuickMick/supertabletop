/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

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

        this._camera_grab_block=false;

        this.inputHanlder.on("mousewheel", this._zoom.bind(this), false)
            .on("mousemove",this._mouseMove.bind(this))
            .on("rawmousemove",this._onRawMouseMove.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("pressed", function () {
            this.CAMERA_GRABBED = true;
            console.log("x");
        }.bind(this))
            .on("released", function () {
                this._camera_grab_block=false;
                this.CAMERA_GRABBED = false;
            }.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("released",this._releaseSelection.bind(this));

        this.entityManager.on("entityclicked",this._onEntityClicked.bind(this));

      //  this.selectionFilter =new PIXI.filters.BloomFilter();
    }
    update(delta){

    }

    _onEntityClicked(evt){
     //   this.SELECTED_ENTITIES.push(evt.entity);
        this._camera_grab_block=true;
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
        if(this._camera_grab_block) return false;
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

    get SELECTED_ENTITY_IDS(){
        return this.SELECTED_ENTITIES.map(function(obj){
            return obj.ENTITY_ID;
        });
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
        var previousZoom = this.current_zoom;

        if(evt.delta <0 ){
            this.current_zoom+=this.zoom_sensivity;
        }

        if(evt.delta > 0 ){
            this.current_zoom-=this.zoom_sensivity;
        }
/*
        var p = 1-(previousZoom/this.current_zoom);
        console.log(p);
        this.gameTable.position.x -= this.gameTable.width*p;
        this.gameTable.position.y -= this.gameTable.height*p;*/
    }

    focusCamera(){
        this.gameTable.scale.set(this._current_zoom);
        var w = this.gameTable.hitArea.width;
        var h = this.gameTable.hitArea.height;
        var z = this._current_zoom;

        var x = this.gameTable.position.x-this.gameTable.pivot.x;
        var y = this.gameTable.position.y-this.gameTable.pivot.y;



        //TODO: folgendes wird warscheinlich nicht funktionieren, wenn drehen drin is
     /*  if(w* z> this.gameTable.renderer.width) {
            if (x < this.gameTable.renderer.width - w*z) this.gameTable.position.x = this.gameTable.renderer.width - w*z+this.gameTable.pivot.x;
            if (x > 0) this.gameTable.position.x = this.gameTable.pivot.x;
        }else{
            this.gameTable.position.x = this.gameTable.renderer.width/2 - (w*z)/2 +this.gameTable.pivot.x;
        }

        if(h*z > this.gameTable.renderer.height) {
            if (y < this.gameTable.renderer.height - h*z) this.gameTable.position.y = this.gameTable.renderer.height - h*z+this.gameTable.pivot.y;
            if (y > 0) this.gameTable.position.y = +this.gameTable.pivot.y;
        }else{
            this.gameTable.position.y = this.gameTable.renderer.height/2 - (h*z)/2 +this.gameTable.pivot.y;
        }*/
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
        super._onRawMouseMove(evt);
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

        if(!this.entityManager.entities[evt.entity.ENTITY_ID]){
            console.log("cannot claim entity which does not exist");
            return;
        }
        if(this.entityManager.entities[evt.entity.ENTITY_ID].state.state ==Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED){
            console.log("entity already claimed");
            return;
        }

        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_CLAIM_ENTITY,this.synchronizer.CLIENT_INFO.id,
            {
                claimedEntity:evt.entity.ENTITY_ID,
                _mode:"push"
            }
        );
    }

    _releaseSelection(evt) {
        //this selection release
        var ids = this.SELECTED_ENTITY_IDS;
            /*[];
        for(var i=0; i<this.SELECTED_ENTITIES.length;i++){
            ids.push(this.SELECTED_ENTITIES[i].ENTITY_ID);
        }*/

        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_RELEASE_ENTITY, this.synchronizer.CLIENT_INFO.id,
            {
                releasedEntities:ids,
                _mode:"push"
            }
        );

        super._releaseSelection(evt);
    }


    update(delta){
        super.update(delta);

        // check for rotation
        var rotationAmount = 0;
        if(this.inputHanlder.mapping.ROTATE_RIGHT.isDown){
            rotationAmount += 1*delta;
        }else if(this.inputHanlder.mapping.ROTATE_LEFT.isDown){
            rotationAmount += -1*delta;
        }

        if (rotationAmount == 0){
            return; // if there is no rotation, then there is nothing to do.
        }

        var ids = this.SELECTED_ENTITY_IDS;

        if(ids.length >0) { // if there is a selection, rotate the selection
            // add the rotation amount
            this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_ROTATE_ENTITY, this.synchronizer.CLIENT_INFO.id,
                {
                    rotationAmount: rotationAmount,
                    _mode: "add"
                }
            );
            // and add the affected entities
            this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_ROTATE_ENTITY, this.synchronizer.CLIENT_INFO.id,
                {
                    rotatedEntities: ids,
                    _mode: "pushAvoidDuplicates"
                }
            );
        }else{ // else rotate just the camera
            this.gameTable.rotation += (rotationAmount/10)*delta;
        }

    }
}

class ToolManager{
    constructor(gameManager){
        this.tools=null;
        this._selectedToolIndex = 0;

        this.gameManager = gameManager;
        this.entityManager = this.gameManager.entityManager;
        this.playerManager = this.gameManager.playerManager;
        this.inputHandler = this.gameManager.inputHandler;
        this.gameTable = this.gameManager.gameTable;
        this.synchronizer = this.gameManager.synchronizer;

        /**
         * filter which is used to display a selection
         * @type {PIXI.filters.BloomFilter}
         */
        this.tools = [new SimpleDragTool(this.gameManager.inputHandler, this.gameManager.gameTable, this.gameManager.entityManager, this.gameManager.playerManager, this.gameManager.synchronizer)];
    }

    set currentTool(i){
        this._selectedToolIndex=i;
    }
    get currentTool(){
        return this.tools[this._selectedToolIndex];
    }

    batchUpdateEntityStateChange(data){
        if(!data){
            console.warn("statechange: no update data passed");
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
                    curEntity.alpha = 0.8;
                }

                // add the filter, so that it is visible,
                // to everyone, that an entity is selected
                var selectionFilter = new OutlineFilter(
                    this.gameManager.app.renderer.width,
                    this.gameManager.app.renderer.height,
                    10,
                    this.playerManager.players[stateUpdate.userID].rawPlayerData.color || 0xFFFFFF
                );

               /* this.gameManager.on('resize',function (evt) {
                    selectionFilter.viewWidth = evt.width;
                    selectionFilter.viewHeight = evt.height;
                });*/

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
                    curEntity.alpha = 1;
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

    update(delta){
        this.currentTool.update(delta);
    }
}

module.exports = ToolManager;