/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
require('pixi-filters');
require('pixi-extra-filters');

var Config = require('./../resources/config.json');
var Entity = require('./entity');

var InputHandler = require('./inputhandler');

var GameState = require('./gamestate');

const RELATIVE_PATH = "./../";

class EntityManager extends PIXI.Container{

    constructor(){
        super();
        /**
         * Contains a mapping from entity ID to the entity itself,
         * additionally, the entities are added to the children list of this container
         * @type {{}}
         */
        this.entities = {
            //ID: ENTITY(SPRITE)
        };

        this.selectionFilter =new PIXI.filters.BloomFilter(); //new PIXI.filters.OutlineFilter(2, 0x99ff99);
       // this.selectedEntities = [];
    }

    init(){
        InputHandler.mapping.MOUSE_LEFT.on("released",this._releaseSelection.bind(this));
    }

    addEntity(entity){
        this.entities[entity.ENTITY_ID] = entity;
        this.addChild(entity);

        entity.on('mousedown', this._onEntityClick.bind(this))
            .on('touchstart', this._onEntityClick.bind(this));
    }

    _onEntityClick(event){
        // no entity_id? so its propably no entity
        if(!event.currentTarget || !event.currentTarget.ENTITY_ID) return;

        var entity = event.currentTarget;
        GameState.SELECTED_ENTITIES.push(entity);
        entity.filters = (entity.filters || []).concat([this.selectionFilter]);
    }

    _releaseSelection(evt){

        for(var i=0;i<GameState.SELECTED_ENTITIES.length;i++){
            // create a new array, which contains every filter, except the selection filter
            var n = [];
            var filters = GameState.SELECTED_ENTITIES[i].filters;
            for(var j=0; j<filters.length;j++){
                if(filters[j] != this.selectionFilter)
                n.push(filters[j]);
            }

            // if there are no filters anymore, just set null
            if(n.lengh <=0){
                GameState.SELECTED_ENTITIES[i].filters=null;
            }else {
                GameState.SELECTED_ENTITIES[i].filters = n;
            }

        }
        GameState.SELECTED_ENTITIES =[];

    }


    /**
     * remove and deletes an antity from the entitymanager.
     * @param id of the entity, which should get deleted
     */
    removeEntity(id){
        var c = this.entities[id];
        this.removeChild(c);
        delete this.entities[c];
    }

    /**
     * Removes all entities and deletes them from the entitymanager.
     */
    vanish(){
        for(let id in this.entities){
            this.removeEntity(id);
        }
    }




/*




    _convertServerEntity(e){
        var cur = new Entity(e);

        cur.synchronize = function (type,id) {
            var evt = {msg:"",data:{id:e.id}};
            switch(type){
                case Statics.PROTOCOL.CLIENT.DRAG_START:
                    evt.data.alpha = cur.sprite.alpha;
                    evt.data.scale = cur.sprite.scale.x;//.get();
                    break;
                case Statics.PROTOCOL.CLIENT.DRAG_END:
                    evt.data.alpha = cur.sprite.alpha;
                    evt.data.scale = cur.sprite.scale.x;//.get();
                    break;

                case Statics.PROTOCOL.CLIENT.DRAG_MOVE:

                    evt.data.x = cur.sprite.x;
                    evt.data.y = cur.sprite.y;
                    break;
                case Statics.PROTOCOL.CLIENT.TURN_CARD:
                    evt.data.top = cur.top;
                    break;
                default:
                    return;
            }

            this.sendMessage(type,evt);

        }.bind(this);

        return cur;
    }

*/


}

module.exports= new EntityManager();