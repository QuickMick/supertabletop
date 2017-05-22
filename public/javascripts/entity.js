/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
var Statics = require("./../../core/statics");
require('pixi.js');
class Entity {

    constructor(entity) {
        this.id = entity.id;
        this.entity = entity;

        this.top = entity.top;

        if(entity.front.texture==null)
            throw "cannot instatiate an entity without a texture!";
        this.sprite = this.createBunny(entity);


    }

    static fromObject(object) {
        return new Entity(object.width, object.height, object.x, object.y);
    }

    turn(force){
        console.log("turn",this.id,force);
        if(!force) {
            if (!this.entity.turnable) return;
            if (Statics.GLOBALS.CAMERA_MOVE) return;
            if (this.sprite.grabbedBy && this.sprite.grabbedBy != Statics.GLOBALS.CURRENT_USER) return;
        }

        if(this.top) {
            //show back
            this.sprite.removeAll();
            this.sprite.texture = PIXI.loader.resources[this.entity.back.texture].texture;
            if(this.entity.back.color) {
                this.sprite.tint = parseInt(this.entity.back.color);
            }
        }else{
            // show front
            this.sprite.texture = PIXI.loader.resources[this.entity.front.texture].texture;
            if(this.entity.front.color) {
                this.sprite.tint = parseInt(this.entity.front.color);
            }

            if(this.entity.text && this.entity.text.content) {
                var font = this.entity.text.font || "monospace";
                var size = this.entity.text.size || 12;
                var color = this.entity.text.color ? parseInt(this.entity.text.color): 0xFFFFFF;

                this.sprite.addChild(new PIXI.Text(this.entity.text.content, {font: size+"pt "+font, fill: color}));
            }

        }



        this.top = !this.top;
        if(!force) {
            this.synchronize(Statics.PROTOCOL.CLIENT.TURN_CARD, this.id);
        }
    }


    onOver(event){
        console.log("over",this.id);
        Statics.GLOBALS.KEY_MAPPING.TURN.onPress = this.turn.bind(this);
    }

    onOut(event){
        console.log("out",this.id);
        Statics.GLOBALS.KEY_MAPPING.TURN.onPress = null;
    }


    createBunny(e) {
        // create our little bunny friend..
        var bunny =null;
        if(!e.turnable || (e.turnable && e.top)) {
            bunny = new PIXI.Sprite(PIXI.loader.resources[e.front.texture].texture);
            if(e.front.color) {
                bunny.tint = parseInt(e.front.color);
            }

        }else{
            bunny = new PIXI.Sprite(PIXI.loader.resources[e.back.texture].texture);
            if(e.back.color) {
                bunny.tint = parseInt(e.back.color);
            }
        }


        if(e.top && e.text && e.text.content) {
            var font = e.text.font || "monospace";
            var size = e.text.size || 12;
            var color = e.text.color ? parseInt(e.text.color): 0xFFFFFF;

            bunny.addChild(new PIXI.Text(e.text.content, {font: size+"pt "+font, fill: color}));
        }


        // enable the bunny to be interactive... this will allow it to respond to mouse and touch events
        bunny.interactive = true;

        // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
        bunny.buttonMode = true;


        // center the bunny's anchor point
        bunny.anchor.set(0.5);

        // make it a bit bigger, so it's easier to grab
      //  bunny.scale.set(3);

        // setup events
        bunny
        // events for drag start
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
            .on('mouseover',this.onOver.bind(this))
            .on('mouseout',this.onOut.bind(this));

        // move the sprite to its designated position
        bunny.position.x = e.position.x;
        bunny.position.y = e.position.y;

 // scaled mit
        if(!e.hitArea){
            bunny.hitArea = new PIXI.Rectangle(-bunny.width*bunny.anchor.x, -bunny.height*bunny.anchor.y,bunny.width,bunny.height);
        }else{
            switch (e.hitArea.type){
                case "circle":
                    bunny.hitArea = new PIXI.Circle(-bunny.width*bunny.anchor.x +e.hitArea.offset.x, -bunny.height*bunny.anchor.y+e.hitArea.offset.y, e.hitArea.radius); //e.hitArea.width,e.hitArea.height);
                    break;
                case "rectangle":
                    bunny.hitArea = new PIXI.Rectangle(-bunny.width*bunny.anchor.x +e.hitArea.offset.x, -bunny.height*bunny.anchor.y+e.hitArea.offset.y, e.hitArea.width,e.hitArea.height);
                    break;
            }
        }

        if(e.width)
            bunny.width = e.width;
        if(e.height)
            bunny.height = e.height;

       // bunny.scale.set(this.scale);


        // scaled nicht mit
       /* if(!hitArea){
            var w = bunny.width/bunny.scale.x;
            var h = bunny.height/bunny.scale.y;
            bunny.hitArea = new PIXI.Rectangle(-w*bunny.anchor.x, -h*bunny.anchor.y,w,h);
        }*/


        // add it to the stage
        return bunny;
    }


    onDragStart(event) {
        if(Statics.GLOBALS.CAMERA_MOVE) return;

        if(this.sprite.grabbedBy) return;

        if(Statics.GLOBALS.GRABED && Statics.GLOBALS.GRABED != this.sprite) return;
        Statics.GLOBALS.GRABED = this.sprite;
        this.sprite.bringToFront();
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.sprite.data = event.data;

        this.sprite.pos = {
            old:event.data.global,
            new:event.data.global
        };

        this.sprite.alpha = 0.5;
        this.sprite.dragging = true;

        this.sprite.oldScale= {x:this.sprite.scale.x,y:this.sprite.scale.y};
        var scaleFactor = 1.1;

        var hitArea = this.sprite.hitArea;
        this.sprite.hitArea = null;
        this.sprite.scale.x *= scaleFactor;
        this.sprite.scale.y *= scaleFactor;
        this.sprite.hitArea = hitArea;

        event.stopped=true;

        this.synchronize(Statics.PROTOCOL.CLIENT.DRAG_START,this.id);
    }

    onDragEnd() {
        if(Statics.GLOBALS.CAMERA_MOVE)return;
        if(Statics.GLOBALS.GRABED && Statics.GLOBALS.GRABED != this.sprite) return;
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

        event.stopped=true;
        this.synchronize(Statics.PROTOCOL.CLIENT.DRAG_END,this.id);
    }

    onDragMove() {

        if (this.sprite.dragging) {
            if(Statics.GLOBALS.CAMERA_MOVE)return;
            var newPosition = this.sprite.data.getLocalPosition(this.sprite.parent);
           // this.sprite.position.x = newPosition.x;
           // this.sprite.position.y = newPosition.y;

            var dx = this.sprite.pos.old.x - this.sprite.pos.new.x;
            var dy = this.sprite.pos.old.y - this.sprite.pos.new.y;

            this.sprite.position.x -=dx/Statics.GLOBALS.CURRENT_ZOOM;
            this.sprite.position.y -=dy/Statics.GLOBALS.CURRENT_ZOOM;

        //    var aabb = this.sprite.getBounds();
        //    aabb.xe = aabb.x+aabb.width;
         //   aabb.ye = aabb.y+aabb.height;

            var w,h;
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



            this.sprite.pos.old = {x:this.sprite.pos.new.x,y:this.sprite.pos.new.y};
            this.sprite.pos.new = this.sprite.data.global;


            event.stopped=true;
            this.synchronize(Statics.PROTOCOL.CLIENT.DRAG_MOVE,this.id);
        }
    }

}

module.exports = Entity;