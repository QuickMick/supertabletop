/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
require('pixi-filters');
require('pixi-extra-filters');

const RELATIVE_PATH = "./../";


var EVT_ENTITYCLICKED = "entityclicked";

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

        this.selectionFilter =new PIXI.filters.BloomFilter();
    }

    init(){
    }

    addEntity(entity){
        this.entities[entity.ENTITY_ID] = entity;
        this.addChild(entity);

        entity.on('mousedown', this._onEntityClicked.bind(this))
            .on('touchstart', this._onEntityClicked.bind(this));
    }

    _onEntityClicked(event){
        // no entity_id? so its propably no entity
       if(!event.currentTarget || !event.currentTarget.ENTITY_ID) return;

        var entity = event.currentTarget;
        this.emit(EVT_ENTITYCLICKED,{id:entity.ENTITY_ID,entity:entity});
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
}

module.exports= new EntityManager();