/**
 * Created by Mick on 31.05.2017.
 */

'use strict';

const Util = require('./../core/util');
const Matter = require('matter-js');
const uuidV1 = require('uuid/v1');
const Bodies = Matter.Bodies;
const Body = Matter.Body;

const Packages = require('./../core/packages');
const GameConfig = require('./gameconfig.json');

/**
 * holds just basic data about an entity,
 * NO position/rotation and NO state,
 * and also NO id
 */
class BaseEntityData {

    /**
     * creates a new enitty,
     * data of library, where the base entities and of the instance itselfe is necessary
     * @param entityLibrary (this is basically the loaded JSON file of the game) if no library is passed,
     *      an entity just with the isntancedata is created
     * @param instanceData the entitie which should be created from the collection
     */
    constructor(instanceData,entityLibrary) {
       /* switch(true){
            case !instanceData: throw  "cannot create an enitty without data";
            case !entityLibrary:throw "cannot create an entity without the entity library";
        }*/
       if(!instanceData)
           throw  "cannot create an enitty without data";

        var baseData =entityLibrary?BaseEntityData.overwriteDefaults(instanceData, entityLibrary[instanceData.type]):instanceData;

        switch(true){
            case !baseData: throw "cannot create entity without data";
            case !baseData.classification:throw "cannot create an entity withoug classification";
            case !baseData.type: throw  "cannot create an enitty withoug type";
        }

        this.classification = baseData.classification || "";
        this.type = baseData.type || "";
        this.width = baseData.width || GameConfig.DEFAULT_ENTITY_SIZE;
        this.height = baseData.height || GameConfig.DEFAULT_ENTITY_SIZE;
        this.isStackable = baseData.isStackable || false;
        this.isTurnable = baseData.isTurnable || false;
        this.surfaceIndex = baseData.surfaceIndex || 0;
        this.surfaces = BaseEntityData.reviveSurfaces(baseData.surfaces); // baseData.surfaces || [];
        this.hitArea = BaseEntityData.retrieveHitArea(baseData.hitArea,{
            width:baseData.width,
            height:baseData.height
        });

        this.rawData = baseData;
    }

    get complementarySide(){
        return Util.torusRange((this.surfaceIndex + Math.round(this.surfaces.length / 2)), 0, (this.surfaces.length - 1));
    }

    toJSON(){
        return {
            classification:this.classification,
            type:this.type,
            width:this.width,
            height:this.height,
            isStackable:this.isStackable,
            isTurnable:this.isTurnable,
            surfaceIndex:this.surfaceIndex,
            surfaces:this.surfaces,
            hitArea:this.hitArea
        };
    }

    static reviveSurfaces(surfaces){
        if(!surfaces) return [];

        var result = [];
        for(var i=0; i< surfaces.length; i++){
            var cur = surfaces[i];

            result.push({
                texture: cur.texture || "",
                color: Util.parseColor(cur.color) || 0,
                text: cur.text?BaseEntityData.reviveText(cur.text) : []
            });
        }
        return result;
    }

    static reviveText(text){
        if(!text) return [];

        var result = [];
        for(var i=0; i< text.length; i++){
            var cur = text[i];
            result.push({
                content: cur.content || "",
                fontSize: cur.fontSize || 12,
                color: Util.parseColor(cur.color),
                fontFamily: cur.fontFamily || "monospace",
                align: cur.align || "center",
                fontWeight: cur.fontWeight || "bold",
                letterSpacing: (cur.letterSpacing && cur.letterSpacing !=0)? 1 : cur.letterSpacing
            });
        }

        return result;
    }

    static retrieveHitArea(hitArea,defaults){
        var result = {};

        result.offset = {x:0,y:0};

        defaults = defaults || {};
        var defaultWidth = defaults.width || GameConfig.DEFAULT_ENTITY_SIZE;
        var defaultHeight = defaults.height || GameConfig.DEFAULT_ENTITY_SIZE;
        if(!hitArea || !hitArea.type){
            result.type = "rectangle";
            result.width = defaultWidth;
            result.height = defaultHeight;
            return result;
        }

        if(hitArea.offset) {
            result.offset.x = hitArea.offset.x || 0;
            result.offset.y = hitArea.offset.y || 0;
        }

        switch(hitArea.type){
            case "rectangle":
                result.type = "rectangle";
                result.width = defaultWidth;
                result.height = defaultHeight;
                return result;
            case "circle":
                result.type = "circle";
                result.radius = hitArea.radius || ((defaultWidth+defaultHeight)/4);
                return result;
        }
    }

    /**
     * Overwrites the default values from the basetype.
     * Object.assign was not used, because it would overwrite the arrays completely.
     * This method copies and changes array items
     * @param basetype of the entity, contains all default values
     * @param instance contains all specialized values, e.g. position, or unique texture
     * @private
     */
    static overwriteDefaults(instance, basetype){

        if(!basetype) return instance;  // return instance, if basetype is null
        // load the default entity
        var result = Object.assign({},basetype); // JSON.parse(JSON.stringify(basetype));

        //but override changes
        if(instance.overwrite) {
            for (var key in instance.overwrite) {
                if (!instance.overwrite.hasOwnProperty(key)) continue;

                var overwrite_path = key.split(".");    // get the path of the value, which should be overwritten
                var currentDepthObject = result;        // latest object of the path

                // go down the whole path, till the path can be set
                for(let i=0; i< overwrite_path.length;i++){
                    var curKey = overwrite_path[i]; // current validated key

                    if(i==overwrite_path.length-1){ // if last element, then set the real value
                        currentDepthObject[curKey] = instance.overwrite[key];
                    //}else if(!result[curKey]){      // if object does not exist,
                    }else if(!currentDepthObject[curKey]){      // if object does not exist,
                        currentDepthObject[curKey]={};          // then create it
                    }
                    currentDepthObject=currentDepthObject[curKey];  // and set as new depth object
                }
            }
        }
        return result;
    }
}

class ServerEntity extends BaseEntityData{
    constructor(instanceData, entityLibrary){
        super(instanceData, entityLibrary);

        this.ID=uuidV1();

        this._body = null;

        this._state = this._createDefaultEntityState();
        // set the position of the _body
        var x=(this.rawData.position || {}).x || 0;
        var y=(this.rawData.position || {}).y || 0;
        var rotation=this.rawData.rotation || 0;

        switch (this.hitArea.type) {
            case "circle":
                this._body = Bodies.circle(x,y,this.hitArea.radius);
                break;
            case "rectangle":
                this._body = Bodies.rectangle(x,y,this.hitArea.width,this.hitArea.height);
                break;
            default:
                throw " insuficient data in order to create the entity _body";
                return;
        }

        this._body.ENTITY_ID = this.ID;

        if(rotation) { //just rotate, if rotation is not equaling zero
            Body.rotate(this._body, rotation);
        }

        /**
         * name of the current mode
         * @type {string}
         */
        this._currentMode = "";
        this.setMode("default");    // set default mode

        //------------------callbacks------------------------------------

        /**
         * called, when the surfaceIndex has changed
         * eventData: {previousSurfaceIndex,surfaceIndex}
         */
        this.onEntityTurned = null;

        /**
         * called, when this entity was claimend by a user.
         * eventData: {claimedBy, entity}
         */
        this.onClaimed = null;

        /**
         * is called when an entity was released from a claim
         * eventData:{wasClaimedBy:userID,entity}
         */
        this.onReleased = null;

        /**
         * is called, when the state of the entiy changes
         * @type {oldState:currentState}
         */
        this.onStateChange = null;

        /**
         * should just be set from the gameManager!
         * if true, then the entity is set to the gameManager/ world
         * @type {boolean}
         */
        this.isAddedToWorld = false;
    }


    get currentMode(){
        return this._currentMode;
    }

    /**
     * read only, do not try to overwrite, becuase it changes the velocity of the body
     * @returns {{x, y}}
     */
    get position() {
        var p = (this._body || {}).position || {};
        return {
            get x() {
                return p.x || 0;
            },
            get y() {
                return p.y || 0;
            }
        }
    }

    /**
     *sets the position of an enitty
     * @param v {{x, y}}
     */
    set position(v){
        Body.setPosition(this._body, {
            x: v.x || 0,
            y: v.y || 0
        });
    }


    get claimedBy(){
        return this._state.claimedBy || "";
    }

    get body(){
        return this._body;
    }

    get state(){
        return this._state;
    }

    get isStack(){
        return false;
    }

    get rotation(){
        return this._body.angle;
    }

    /**
     * sets the rotation of the entity directly
     * @param v
     */
    set rotation(v){
        if(typeof v != "number"){
            console.log("rotation can only be a number!");
            return;
        }
        Body.rotate(this._body,v);
    }

    /**
     * uses velocity to rotate the entity
     * @param rotationAmount
     */
    rotateEntity(rotationAmount){
        // multiply the passed value by the rotation speed
        Body.setAngularVelocity(this._body,rotationAmount);
        // changes will be postet in the engine.update overrite method,
        // because the changes are done during the enigne step
    }

    claim(userID){
        var oldState = Object.assign({},this._state);
        // set the claimedBy value to the userID, so we know that the entity is claimed by whom.
        this._state.claimedBy = userID;
        this._state.state=Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_CLAIMED;
        this._state.timestamp=new Date().getTime();

        // fire onClaimed event
        if(this.onClaimed){
            this.onClaimed({
                claimedBy:userID,
                entity:this
            });
        }

        // fire onStateChange event
        if(this.onStateChange){
            this.onStateChange({
                oldState:oldState,
                currentState:this._state
            });
        }
    }

    release(){
        var oldState = Object.assign({},this._state);

        this._state.claimedBy = "";
        this._state.state=Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_DEFAULT_STATE;
        this._state.timestamp=new Date().getTime();

        this.setMode("default");

        // fire onClaimed event
        if(this.onReleased){
            this.onReleased({
                wasClaimedBy:userID,
                entity:this
            });
        }

        // fire onStateChange event
        if(this.onStateChange){
            this.onStateChange({
                oldState:oldState,
                currentState:this._state
            });
        }
    }

    setMode(mode){
        switch (mode){
            case "move":
                this._body.frictionAir = GameConfig.GRABBED_ENTITY_FRICTION;
                this._body.isSensor = true;
                this._currentMode = "move";
                break;
            case "default":
            default:
                this._body.frictionAir = GameConfig.ENTITY_FRICTION;
                this._body.collisionFilter=GameConfig.DEFAULT_COLISION_FILTER;
                this._body.isSensor = false;
                this._currentMode = "default";
                break;
        }
    }

    /**
     * creates an default state for an entity
     * @returns {{state: string, timestamp: number}}
     * @private
     */
    _createDefaultEntityState(){
        return {
            state:Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_DEFAULT_STATE,
            timestamp:new Date().getTime()
        };
    }

    /**
     * overrides and extends the base data
     * @return {{position: *, rotation: *, ID: *, state: ({state, timestamp}|{state: string, timestamp: number}|*), classification: (*|string), type: (*|string), width: *, height: *, isStackable: (boolean|*), isTurnable: (boolean|*), surfaceIndex: (number|*), surfaces: *, hitArea: *}}
     */
    toJSON(){
        return {
            position:this.position,
            rotation:this.rotation,
            ID:this.ID,
            state:this._state,
            isStack: this.isStack,

            classification:this.classification,
            type:this.type,
            width:this.width,
            height:this.height,
            isStackable:this.isStackable,
            isTurnable:this.isTurnable,
            surfaceIndex:this.surfaceIndex,
            surfaces:this.surfaces,
            hitArea:this.hitArea
        };
    }

    /**
     * turns the surface of an entity
     * @param surface accepts the actual index of a surface, "next", "previous" or "random".
     * @returns {boolean} true, if surfaceIndex has changed
     */
    turn(surface){

        if(!this.isTurnable){
            console.log("turn: entity is not turnable!",this.ID);
            return false;
        }

        var previousSurfaceIndex = this.surfaceIndex;
        var surfaces = this.surfaces;
        if (typeof surface == "number") {   // if the passed variable is an index
            // apply the new surface, but check, that the new index is inside the valid range
            // the valid range is the number of available surfaces for this object
            this.surfaceIndex = Util.forceRange(surface,0,surfaces.length-1);
        }else if (typeof surface == "string"){
            switch (surface){
                case "next":
                    this.surfaceIndex = Util.torusRange((previousSurfaceIndex+1),0,(surfaces.length-1));
                    break;
                case "previous":
                    this.surfaceIndex = Util.torusRange((previousSurfaceIndex-1),0,(surfaces.length-1));
                    break;
                case "random":
                    this.surfaceIndex= Util.randomInRange(surfaces.length-1);
                    break;
                default:
                    console.log("turn: invalid option passed",surface);
                    return false;
            }
        }else{
            console.log("turn: invalid option passed, not a number nor a string",surface);
            return false;
        }
        if(previousSurfaceIndex != this.surfaceIndex) {
            // if something has changed, call event
            if (this.onEntityTurned) {
                this.onEntityTurned({
                    previousSurfaceIndex: previousSurfaceIndex,
                    surfaceIndex: this.surfaceIndex
                });
            }
            return true;
        }
        return false;
    }
}

/**
 * 0 is the bottem element,
 * last is the element on the top,
 * so surfaceIndex 1 means, top is visible, 0 is bottom
 */
class ServerEntityStack extends ServerEntity{
    /**
     * creates a new stack, based on position and rotation of the passed entity,
     * if the entity is a stack, its content is also used, otherwise the passed entity is added as content.
     * Basically it converts the passed entity to a stack at the same position of the entity.
     *
     * IMPORTANT: the passed entity should be removed before or after creating the stack!
     *
     * NOTE: first element of the stack array is always on the bottom,
     *      last element is always on the top
     *
     * NODE: by passing an serverEntity as instanceData, a new stack on this position,
     *      containing the passed entity as data will be spawned
     *
     * @param instanceData
     * @param entityLibrary
     * @private
     */
    constructor(instanceData, entityLibrary){
        if(instanceData instanceof  ServerEntity){
            // if instance is a serverEntity, converte it to a stack
            instanceData = {
                position:instanceData.position,
                rotation:instanceData.rotation,
                content:[instanceData]
            };
        }

        if(!instanceData.content) // if passed valie is already a server entity, converte it to stack basedata
            throw "cannot create stack without content";

        // be sure instanceData.content is an array
        instanceData.content = [].concat(instanceData.content);

        var content = ServerEntityStack._reviveStackContent(instanceData.content, entityLibrary);


        if(!content)
            throw "malformed data in stacks content. cannot create stack!";

        // create the stack data based on the last entity in its content (because the last is on top)

        var stackData = content[0].toJSON();
        stackData.surfaceIndex = 1;// instanceData.surfaceIndex || 0;
        stackData.isTurnable = true;
        stackData.isStackable = true;

        var base = instanceData.content[0];
        stackData.position ={
            x:(instanceData.position || base.position || {}).x || 0,
            y:(instanceData.position || base.position || {}).y || 0
        };

        // create the stack with the values of the last element
        super(stackData);   // no library needed, becuase the entity already exists




        this.rotation = instanceData.rotation || base.rotation || 0;

        /**
         * 0 is the bottem element,
         * last is the element on the top,
         * so surfaceIndex 1 means, top is visible, 0 is bottom
         */
        this.content = content;

        //------------------callbacks------------------------------------
        /**
         * called, when an entity was pushed  to the stacks content
         * @type {stack,pushedEntity,mergedWithStack(boolean)}
         */
        this.onEntityPushed = null;

        /**
         * called, when an entity was pushed out of this stack
         * @type {stack,poppedEntity}
         */
        this.onEntityPopped = null;

        /**
         * fired, when the last element of the content was popped
         * @type {stack}
         */
        this.onStackIsEmpty = null;

        /**
         * called, whenn the stack was splitted
         * @type {splitAmount, oldStack,newStack}
         */
        this.onStackSplit = null;
    }

    get isEmpty(){
        return this.content.length <=0;
    }

    get length(){
        return this.content.length;
    }

    get isStack(){
        return true;
    }

    // this values are replaced by getters which just return true,
    // because these values have to be true
    get isTurnable(){
        return true
    }

    set isTurnable(v){} //immutable

    get isStackable(){
        return true
    }

    set isStackable(v){} //immutable

    // surfaces is also replaced by a setter which returns the
    // right surfaces of the top and bottom entity
    get surfaces(){
        if(this.content.length <=0) return [];

        var bottom = this.content[0];
        var top = this.content[this.content.length-1];

        var bottomIndex = bottom.surfaceIndex;
        //  for bottom element, take the complementary surface to the visible surface,
        // this means, add the half of the surface count to the current index and use torusRange,
        // so the next element is the opposite
        if(bottom.isTurnable) {     // just if it is turnable, else take the current surfaceIndex
            bottomIndex = bottom.complementarySide;//Util.torusRange((bottom.surfaceIndex + Math.round(bottom.surfaces.length / 2)), 0, (bottom.surfaces.length - 1));
        }
        return [bottom.surfaces[bottomIndex], top.surfaces[top.surfaceIndex]];
    }

    set surfaces(v){} //immutable

    /**
     * has to be overriden, because there
     * can just be two surfaces
     * @return {*}
     */
    get complementarySide(){
        return Util.torusRange((this.surfaceIndex + 1), 0, 1);
    }

    /**
     *
     * @param content of the stack object
     * @param entityLibrary enetit
     * @return {Array} returns an array of all entities
     * @private
     */
    static _reviveStackContent(content, entityLibrary){
        if(!content){
            console.log("_reviveStack: cannot create stack without content!");
            return null;
        }

        var entities = [];

        // create the content of the stack
        for(var i=0;i<content.length;i++){
            var cur = content[i];
            entities.push(new BaseEntityData(cur,entityLibrary));
        }
        return entities;
    }

    /**
     * overrides entity, just next or index is accepted
     * @returns {boolean} true, if surfaceIndex has changed
     */
    turn(surface) {
     /*   if (typeof surface != "number" && surface != "next") {
            console.log("ServerEntityStack.turn: unable to turn entity, just index or next is allowed, not:",surface);
            return false;
        }*/

        var hasTurned = super.turn("next");

        // if the turn was sucessfull, turn the stacks content,
        // and turn the surfaces of the content also
        if(hasTurned){
            this.content = this.content.reverse();
            // also reverse all cards
            for(var i=0;i< this.content.length;i++) {
                var currentCard = this.content[i];
                currentCard.surfaceIndex = currentCard.complementarySide;
            }
        }
        return hasTurned;
    }

    /**
     *
     * @param entity
     * @returns {boolean} true, if content was pushed
     */
    pushContent(entity){
        if(!entity){
            console.log("pushContent: no entity passed!");
            return false;
        }

        this.surfaceIndex = 1;  // reset the service index,
                                // one means top is visible,
                                // because the pushed card is now on top

        var mergedWithStack = false;
        // convert entity to base entity / create a clean copy
        // check waterfall like - because they inherit eachother, start with the lowest of the chain
       if(entity instanceof ServerEntityStack){
            mergedWithStack=true;
            entity = entity.content;    // if entity is a stack, take its content
        }else if(entity instanceof ServerEntity){
            // else create new baseData entity (without id and position) from the ServerEntity
           entity = new BaseEntityData(entity.toJSON());
        }else if(entity instanceof BaseEntityData){
           entity = new BaseEntityData(entity);
       }

       // check for errors
       if(mergedWithStack){
           if(entity.length <=0){
               console.log("ServerStackEntity.pushContent: other stack has no content");
               return false;
           }
           // just check for one item of the stack, because they are all the same
           if(entity[0].type != this.type && entity[0].classification != this.classification){
               console.log("ServerStackEntity.pushContent: can only merge entities from same type");
               return false;
           }
       }else{
           if (entity.type != this.type && entity.classification != this.classification) {
               console.log("ServerStackEntity.pushContent: can only push entities from same type");
               return false;
           }

           if(!entity.isStackable){
               console.log("ServerStackEntity.pushContent: pushed entity is not stackable!");
               return false;
           }
       }

        // push entity to this content
        this.content = this.content.concat(entity);

        if(this.onEntityPushed){
            this.onEntityPushed({
                stack:this,
                pushedEntity:entity,
                mergedWithStack:mergedWithStack
            });
        }

        return true;
    }

    /**
     *
     * @return {ServerEntity} or null, if stack is empty
     */
    popContent(){
        if(this.isEmpty){
            console.log("popContent: cannot pop from stack - it is already empty!");
            return null;
        }

        // pop entity out of contnent -> last element of array is taken out of it
        // and passed to the entity constructor
        var entity = new ServerEntity(this.content.pop());

        this.surfaceIndex = 1;  // reset the service index,
                                // one means top is visible,
                                // because the pushed card is now on top

        // fire onEntityPopped event
        if(this.onEntityPopped){
            this.onEntityPopped({
                stack:this,
                poppedEntity:entity
            });
        }

        if(this.content.length <=0 && this.onStackIsEmpty){
            this.onStackIsEmpty({
                stack:this
            });
        }

        return entity;
    }

    /**
     * just removes the last element of the stack, if there is content left
     */
    removeLast(){
        if(this.isEmpty){
            console.log("removeLast: cannot remove last from empty stack!");
            return;
        }
        this.content.pop()
    }

    /**
     * splits the top n entities to a new stack, or a single serverEntity,
     * the amount should be greater than 1, oterhwise just a serverentity is returned
     */
    split(amount){
        if(this.content.length <2){
            console.log("split: cannot split, stack is empty or to small- stacksize:",this.content.length);
            return null;
        }

        if(this.content.length - amount <1){
            console.log("split: you want to split more contentn than there is available, amount:",amount,"content size: ",this.content.length);
            return null;
        }

        if(amount <=0){
            console.log("split: cannot split, split amount too small (zero)");
            return null;
        }
        var result;
        if(amount==1){
            result = new ServerEntity(this.content.pop());
        }else{
            var c = this.content.splice(this.content.length-amount,amount);
            result = new ServerEntityStack({content:c});
        }

        if(this.onStackSplit){
            this.onStackSplit({
                splitAmount:amount,
                oldStack:this,
                newStack:result
            });
        }

        return result;
    }
}

module.exports = {
    BaseEntityData: BaseEntityData,
    ServerEntity: ServerEntity,
    ServerEntityStack: ServerEntityStack
};