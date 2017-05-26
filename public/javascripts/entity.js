/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');

var Path = require('path');

var Util = require("./../../core/util");


var DEFAULT_RESOURCES = require("./../resources/resources.json").default.content;

//TODO: entities mit mehr als 2 seiten, da würfel au rein müssen un die 4 ode rmehr ham
class Entity extends PIXI.Sprite {

    constructor(entity) {
        if(!entity.surfaces){ // ||entity.surfaces.length <=0){
            throw "cannot instatiate an entity without a texture!";
        }
        super(PIXI.loader.resources[DEFAULT_RESOURCES.missing_texture_substitute.texture].texture);

        // ensure, that the surfaces object is an array, if not, then convert it to an array
        entity.surfaces = Array.isArray(entity.surfaces)?entity.surfaces:[].concat(entity.surfaces);

        /**
         * this is the prefix for every resource
         */
        this.game_resource_path = entity.game_resource_path;

        // -------- init pixi values --------
        this.interactive = true;    // enable the bunny to be interactive... this will allow it to respond to mouse and touch events
        this.buttonMode = true;     // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
        this.anchor.set(0.5);       // center the bunny's anchor point
        this.position.x = entity.position.x || 0;
        this.position.y = entity.position.y || 0;

        if (entity.width)
            this.width = entity.width;
        if (entity.height)
            this.height = entity.height;

        // -------- init hitArea -------------
        if (!entity.hitArea) { // default hitArea just takes
            this.hitArea = new PIXI.Rectangle(-this.width * this.anchor.x, -this.height * this.anchor.y, this.width, this.height);
        } else {
            switch (entity.hitArea.type) {
                case "circle":
                    this.hitArea = new PIXI.Circle(-this.width * this.anchor.x + entity.hitArea.offset.x, -this.height * this.anchor.y + entity.hitArea.offset.y, entity.hitArea.radius); //e.hitArea.width,e.hitArea.height);
                    break;
                case "rectangle":
                    this.hitArea = new PIXI.Rectangle(-this.width * this.anchor.x + entity.hitArea.offset.x, -this.height * this.anchor.y + entity.hitArea.offset.y, entity.hitArea.width, entity.hitArea.height);
                    break;
            }
        }

        // ------- init entity values --------
        this.ENTITY_ID = entity.id;
        this.turnable = entity.turnable || false;
        this.stackable = entity.stackable || false;

        this.surfaceIndex = entity.surfaceIndex || 0; // is top visible?

        // ------- init surfaces -------------
        this.surfaces = [];
        for(let i=0; i< entity.surfaces.length;i++){
            var  curSurface = entity.surfaces[i];
            // init surface
            var newSurface = {
                // set the texture
                texture: entity.surfaces[i].texture,// || PIXI.loader.resources[DEFAULT_RESOURCES.empty_texture],//PIXI.loader.resources[entity.surfaces[i].texture] ? PIXI.loader.resources[entity.surfaces[i].texture].texture : PIXI.loader.resources[DEFAULT_RESOURCES.missing_texture_substitute.texture].texture,// function(){ PIXI.loader.resources[entity.surfaces[i].texture] ? PIXI.loader.resources[entity.surfaces[i].texture].texture : PIXI.loader.resources[DEFAULT_RESOURCES.missing_texture_substitute.texture].texture;} ,
                // normalize/convert the color of the surface
                color: Util.parseColor(entity.surfaces[i].color),
                // if text  is no array, then convert it to an array, if text is undefined, put empty array instead
                text: curSurface.text?(Array.isArray(curSurface.text)?curSurface.text:[].concat(curSurface.text)) : []
            };

            this.surfaces.push(newSurface);
        }

        // finally, display the visible surface
        this.showSurface(this.surfaceIndex);
    }

    /**
     * Changes the surface which is shown
     * @param front
     */
    showSurface(index){

        this.surfaceIndex = index || 0;
        var curSurface = this.surfaces[this.surfaceIndex];

        this.removeAll(); // remove text from old surface

        // set texture if available
        var texture = Path.join(this.game_resource_path,curSurface.texture);

        if(!texture || texture == ""){
            this.texture = PIXI.loader.resources[DEFAULT_RESOURCES.empty_texture].texture;

        }else if( !PIXI.loader.resources[texture] || !PIXI.loader.resources[texture].texture){
            this.texture= PIXI.loader.resources[DEFAULT_RESOURCES.missing_texture_substitute.texture].texture;
        }else{
            this.texture= PIXI.loader.resources[texture].texture;
        }

        this.tint = curSurface.color;

        // show text
        for(var i=0; i<curSurface.text.length;i++){
            var cText = curSurface.text[i];
            var font = cText.font || "monospace";
            var size = cText.size || 12;
            var color = Util.parseColor(cText.color);
            var cPixiText = new PIXI.Text(cText.content, {font: size + "pt " + font, fill: color});

            if(cText.position) {    // set offset ofs the text
                cPixiText.position.x = cText.position.x || 0;
                cPixiText.position.y = cText.position.y || 0;
            }
            this.addChild(cPixiText);
        }

    }
}

module.exports = Entity;