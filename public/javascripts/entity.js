/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');
var Statics = require("./../../core/statics");

var Util = require("./../../core/util");

var DEFAULT_RESOURCES = require("./../resources/resources.json").default.content;

//TODO: entities mit mehr als 2 seiten, da würfel au rein müssen un die 4 ode rmehr ham
class Entity extends PIXI.Sprite {

    constructor(entity) {
        if(!entity.surfaces){ // ||entity.surfaces.length <=0){
            throw "cannot instatiate an entity without a texture!";
        }
        // ensure, that the surfaces object is an array, if not, then convert it to an array
        entity.surfaces = Array.isArray(entity.surfaces)?entity.surfaces:[].concat(entity.surfaces;

        super(PIXI.loader.resources[DEFAULT_RESOURCES.missing_texture_substitute.texture].texture);

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
     //   this.entity = entity;
        this.turnable = entity.turnable || false;
        this.stackable = entity.stackable || false;

        this.surfaceIndex = entity.surfaceIndex || 0; // is top visible?

        // ------- init surfaces -------------
        this.surfaces = [];
        for(var i=0; i< entity.surfaces.length;i++){
            var  curSurface = entity.surfaces[i];
            // init surface
            var newSurface = {
                // if the texture is not available, take the default texture, which is already set as "this.texture"
                texture: PIXI.loader.resources[entity.surfaces[i].texture] ? (PIXI.loader.resources[entity.surfaces[i].texture].texture || this.texture) : this.texture,
                // normalize/convert the color of the surface
                color: Util.parseColor(entity.front.color),
                // if text  is no array, then convert it to an array
                text: Array.isArray(curSurface.text)?curSurface.text:[].concat(curSurface.text)
            };

            this.surfaces.push(newSurface);
        }



        // init text
        /* for (var j = 0; i < curSurface.text.length; j++) {
         var cText = curSurface.text[j];
         var font = cText.font || "monospace";
         var size = cText.size || 12;
         var color = Util.parseColor(cText.color);
         newSurface.text.push({
         font: font,
         size: size,
         color: color
         });
         }*/

        // create our little bunny friend..
/*
        if (!this.turnable || (this.turnable && this.top)) {
            super(PIXI.loader.resources[e.front.texture].texture);
            if (entity.front.color) {
                this.tint = parseInt(e.front.color);
            }

        } else {
            super(PIXI.loader.resources[e.back.texture].texture);
            if (entity.back.color) {
                this.tint = parseInt(e.back.color);
            }
        }


        if (e.top && e.text && e.text.content) {
            var font = e.text.font || "monospace";
            var size = e.text.size || 12;
            var color = e.text.color ? parseInt(e.text.color) : 0xFFFFFF;

            this.addChild(new PIXI.Text(e.text.content, {font: size + "pt " + font, fill: color}));
        }

 */


        // make it a bit bigger, so it's easier to grab
        //  bunny.scale.set(3);

        // setup events
        this    // events for drag start
            .on('mousedown', this.onDragStart.bind(this))
            .on('touchstart', this.onDragStart.bind(this))
            // events for drag end
            .on('mouseup', this.onDragEnd.bind(this))
            .on('mouseupoutside', this.onDragEnd.bind(this))
            .on('touchend', this.onDragEnd.bind(this))
            .on('touchendoutside', this.onDragEnd.bind(this))
            // events for drag move
            .on('mousemove', this.onDragMove.bind(this))
            .on('touchmove', this.onDragMove.bind(this))
            .on('mouseover', this.onOver.bind(this))
            .on('mouseout', this.onOut.bind(this));

        // move the sprite to its designated position


        // set hitarea scaled mit

    }


    /**
     * Changes the surface which is shown
     * @param front
     */
    showSurface(index){
        if(!front && !this.entity.turnable){
            console.log("cannot turn unturnable entity");
            return;
        }
        this.surfaceIndex = index || 0;
        var curSurface = this.surfaces[this.surfaceIndex];
        this.removeAll();

        this.texture = PIXI.loader.resources[curSurface.texture].texture;
        this.tint = curSurface.color;

        // show text
        for(var i=0; i<curSurface.text.length;i++){
            var cText = curSurface.text[i];
            var font = cText.font || "monospace";
            var size = cText.size || 12;
            var color = Util.parseColor(cText.color);
            var cPixiText = new PIXI.Text(cText.content, {font: size + "pt " + font, fill: color});

            if(cText.position) {    // set offset of the text
                cPixiText.position.x = cText.position.x || 0;
                cPixiText.position.y = cText.position.y || 0;
            }
            this.addChild(cPixiText);
        }
    }












    turn(force) {
        console.log("turn", this.id, force);
        if (!force) {
            if (!this.entity.turnable) return;
            if (Statics.GLOBALS.CAMERA_MOVE) return;
            if (this.sprite.grabbedBy && this.sprite.grabbedBy != Statics.GLOBALS.CURRENT_USER) return;
        }

        if (this.top) {
            //show back
            this.sprite.removeAll();
            this.sprite.texture = PIXI.loader.resources[this.entity.back.texture].texture;
            if (this.entity.back.color) {
                this.sprite.tint = parseInt(this.entity.back.color);
            }
        } else {
            // show front
            this.sprite.texture = PIXI.loader.resources[this.entity.front.texture].texture;
            if (this.entity.front.color) {
                this.sprite.tint = parseInt(this.entity.front.color);
            }

            if (this.entity.text && this.entity.text.content) {
                var font = this.entity.text.font || "monospace";
                var size = this.entity.text.size || 12;
                var color = this.entity.text.color ? parseInt(this.entity.text.color) : 0xFFFFFF;

                this.sprite.addChild(new PIXI.Text(this.entity.text.content, {font: size + "pt " + font, fill: color}));
            }

        }


        this.top = !this.top;
        if (!force) {
            this.synchronize(Statics.PROTOCOL.CLIENT.TURN_CARD, this.id);
        }
    }


    onOver(event) {
        console.log("over", this.id);
        Statics.GLOBALS.KEY_MAPPING.TURN.onPress = this.turn.bind(this);
    }

    onOut(event) {
        console.log("out", this.id);
        Statics.GLOBALS.KEY_MAPPING.TURN.onPress = null;
    }


    onDragStart(event) {
        if (Statics.GLOBALS.CAMERA_MOVE) return;

        if (this.sprite.grabbedBy) return;

        if (Statics.GLOBALS.GRABED && Statics.GLOBALS.GRABED != this.sprite) return;
        Statics.GLOBALS.GRABED = this.sprite;
        this.sprite.bringToFront();
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.sprite.data = event.data;

        this.sprite.pos = {
            old: event.data.global,
            new: event.data.global
        };

        this.sprite.alpha = 0.5;
        this.sprite.dragging = true;

        this.sprite.oldScale = {x: this.sprite.scale.x, y: this.sprite.scale.y};
        var scaleFactor = 1.1;

        var hitArea = this.sprite.hitArea;
        this.sprite.hitArea = null;
        this.sprite.scale.x *= scaleFactor;
        this.sprite.scale.y *= scaleFactor;
        this.sprite.hitArea = hitArea;

        event.stopped = true;

        this.synchronize(Statics.PROTOCOL.CLIENT.DRAG_START, this.id);
    }

    onDragEnd() {
        if (Statics.GLOBALS.CAMERA_MOVE)return;
        if (Statics.GLOBALS.GRABED && Statics.GLOBALS.GRABED != this.sprite) return;
        Statics.GLOBALS.GRABED = null;
        this.sprite.alpha = 1;

        var hitArea = this.sprite.hitArea;
        this.sprite.hitArea = null;
        this.sprite.scale.x = this.sprite.oldScale.x;
        this.sprite.scale.y = this.sprite.oldScale.y;
        this.sprite.hitArea = hitArea;

        this.sprite.oldScale = undefined;
        this.sprite.dragging = false;

        // sesprite.t the interaction data to null
        this.sprite.data = null;

        event.stopped = true;
        this.synchronize(Statics.PROTOCOL.CLIENT.DRAG_END, this.id);
    }

    onDragMove() {

        if (this.sprite.dragging) {
            if (Statics.GLOBALS.CAMERA_MOVE)return;
            var newPosition = this.sprite.data.getLocalPosition(this.sprite.parent);
            // this.sprite.position.x = newPosition.x;
            // this.sprite.position.y = newPosition.y;

            var dx = this.sprite.pos.old.x - this.sprite.pos.new.x;
            var dy = this.sprite.pos.old.y - this.sprite.pos.new.y;

            this.sprite.position.x -= dx / Statics.GLOBALS.CURRENT_ZOOM;
            this.sprite.position.y -= dy / Statics.GLOBALS.CURRENT_ZOOM;

            //    var aabb = this.sprite.getBounds();
            //    aabb.xe = aabb.x+aabb.width;
            //   aabb.ye = aabb.y+aabb.height;

            var w, h;
            switch (this.sprite.hitArea.type) {
                case 1:
                    w = this.sprite.hitArea.width * this.sprite.oldScale.x;
                    h = this.sprite.hitArea.height * this.sprite.oldScale.y;
                    break;
                case 2:
                    w = this.sprite.hitArea.radius * this.sprite.oldScale.x;
                    h = this.sprite.hitArea.radius * this.sprite.oldScale.y;
                    break;
            }

            if (this.sprite.x - (w * this.sprite.anchor.x) < 0) this.sprite.x = (w * this.sprite.anchor.x);
            if (this.sprite.y - (h * this.sprite.anchor.x) < 0) this.sprite.y = (h * this.sprite.anchor.y);

            if (this.sprite.x + (w * (1 - this.sprite.anchor.x)) > Statics.PLAYGROUND.WIDTH) this.sprite.x = Statics.PLAYGROUND.WIDTH - (w * (1 - this.sprite.anchor.x));
            if (this.sprite.y + (h * (1 - this.sprite.anchor.y)) > Statics.PLAYGROUND.HEIGHT) this.sprite.y = Statics.PLAYGROUND.HEIGHT - (h * (1 - this.sprite.anchor.y));
            // if(this.self.position.y < this.app.renderer.height-Statics.PLAYGROUND.HEIGHT) this.self.position.y = this.app.renderer.height-Statics.PLAYGROUND.HEIGHT;


            this.sprite.pos.old = {x: this.sprite.pos.new.x, y: this.sprite.pos.new.y};
            this.sprite.pos.new = this.sprite.data.global;


            event.stopped = true;
            this.synchronize(Statics.PROTOCOL.CLIENT.DRAG_MOVE, this.id);
        }
    }

}

module.exports = Entity;