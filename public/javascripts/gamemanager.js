/**
 * Created by Mick on 19.05.2017.
 */
"use strict";
require('pixi.js');
var Camera = require('pixi-camera');


var Entity = require('./entity');
var InputHandler = require('./inputhandler');
var InputAction = require('./inputaction');

var Statics = require("./../../core/statics");

var RELATIVE_PATH = "./../";

class GameManager{

    constructor(app){
        this.app = app;
    }



_initListener() {
        // neue Nachricht
        this.socket.on(Statics.PROTOCOL.SERVER.INIT_GAME, function (data) {

            this._initGame(data.data);
        }.bind(this));

    this.socket.on(Statics.PROTOCOL.CLIENT.USERINFO, function (data) {

        Statics.GLOBALS.CURRENT_USER = data.data.id;
    }.bind(this));



    this.socket.on(Statics.PROTOCOL.CLIENT.DRAG_START,
            function(data){
                this.entities[data.data.id].sprite.alpha = data.data.alpha;
               // this.entities[data.data.id].sprite.scale.set(data.data.scale);

                this.entities[data.data.id].sprite.oldScale= {x:this.entities[data.data.id].sprite.scale.x,y:this.entities[data.data.id].sprite.scale.y};
                var scaleFactor = 1.1;
                var hitArea = this.entities[data.data.id].sprite.hitArea;
                this.entities[data.data.id].sprite.hitArea = null;
                this.entities[data.data.id].sprite.scale.x *= scaleFactor;
                this.entities[data.data.id].sprite.scale.y *= scaleFactor;
                this.entities[data.data.id].sprite.hitArea = hitArea;
                this.entities[data.data.id].sprite.grabbedBy = data.data.grabbedBy;

                this.entities[data.data.id].sprite.bringToFront();
            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.DRAG_END,
            function(data){
                this.entities[data.data.id].sprite.alpha = data.data.alpha;
                var hitArea = this.entities[data.data.id].sprite.hitArea;
                this.entities[data.data.id].sprite.hitArea = null;
                this.entities[data.data.id].sprite.scale.x = this.entities[data.data.id].sprite.oldScale.x;
                this.entities[data.data.id].sprite.scale.y = this.entities[data.data.id].sprite.oldScale.y;
                this.entities[data.data.id].sprite.hitArea = hitArea;
                this.entities[data.data.id].sprite.oldScale = undefined;
                this.entities[data.data.id].sprite.grabbedBy = undefined;
            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.DRAG_MOVE,
            function(data){
                this.entities[data.data.id].sprite.x = data.data.x;
                this.entities[data.data.id].sprite.y = data.data.y;
            }.bind(this)
        );


        this.socket.on(Statics.PROTOCOL.SERVER.CLIENT_CONNECTED,
            function(data){
                this.players[data.data.id] = data.data;

                this.players[data.data.id].sprite = new PIXI.Sprite(this.player_texture);

                this.players[data.data.id].sprite.anchor.x=1;
                this.players[data.data.id].sprite.tint = data.data.color;
                this.context.players.addChild(this.players[data.data.id].sprite);

            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.SERVER.CLIENT_DISCONNECTED,
            function(data){

                if (this.players[data.data.id].sprite.parent){
                    this.players[data.data.id].sprite.parent.removeChild(this.players[data.data.id].sprite);
                }

                delete this.players[data.data.id];

            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,
            function(data){

                if (!this.players[data.data.id].sprite.parent){
                    return;
                }

                this.players[data.data.id].sprite.position.x = data.data.x;
                this.players[data.data.id].sprite.position.y = data.data.y;
            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.TURN_CARD,
            function(data){
console.log("ssdfsd");
                if (!this.entities[data.data.id].sprite.parent){
                    return;
                }

                this.entities[data.data.id].top = !data.data.top;

                this.entities[data.data.id].turn(true);//.bind(this.entities[data.data.id]);

            }.bind(this)
        );



    this.socket.on(Statics.PROTOCOL.SERVER.VANISH,
            function(data){

                this.context.world.removeAll();
                this.entities = {};

            }.bind(this)
        );


     /*   this.socket.on(Statics.PROTOCOL.SERVER.ADD_ENTITY,
            function(data){

                this.context.world.removeAll();
                this.entities = {};

            }.bind(this)
        );*/

    }

    sendMessage(type,msg){
        this.socket.emit(type,msg);
    }

    _initGame(game){
        console.log("result: " + game);

        var toLoad = [];

        for(var i in game.resources){
            var name = game.resources[i];
            toLoad.push(
                    {
                        name:name,
                        url: RELATIVE_PATH+Statics.PATHS.RESOURCE_PATH+"/"+game.creator+"/"+game.name+"/"+name
                    }
                );
        }

/*
        if(!this.player_texture){
            toLoad.push(
                {
                    name:"cursor",
                    url: RELATIVE_PATH+Statics.PATHS.RESOURCE_PATH+"/cursor.png"
                }
            );
        }*/



        this.player_texture = PIXI.loader.resources[Statics.RESOURCES.CURSOR].texture;
        var keys = Object.keys(this.players);
        for(var i=0;i<keys.length;i++){
            this.players[keys[i]].sprite.texture = this.player_texture;
        }




        PIXI.loader.add(toLoad).once('complete', function (loader, resources) {

         /*   if(!this.player_texture){
                this.player_texture = PIXI.loader.resources["cursor"].texture;
                var keys = Object.keys(this.players);
                for(var i=0;i<keys.length;i++){
                    this.players[keys[i]].sprite.texture = this.player_texture;
                }
            }*/

            for(var i in game.entities) {
                var cur = this._convertServerEntity(game.entities[i]); //new Entity(e,id,e.isStackable, PIXI.loader.resources[e.texture_name].texture,e.x,e.y,e.width,e.height,e.scale);

                this.entities[cur.id] = cur;
                this.context.entities.addChild(cur.sprite);
            }
        }.bind(this)).load();
    }

    _convertServerEntity(e){
        var cur = new Entity(e/*, PIXI.loader.resources[e.front.texture].texture,PIXI.loader.resources[e.back.texture].texture*/);

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

    _addEntity(serverEntity){
    /*    PIXI.loader.add("image2",'./../images/c2.png').once('complete', function (loader, resources) {
            this.app.stage.addChild(new Entity(false,PIXI.loader.resources.image2.texture).sprite);
        }.bind(this)).load();*/
    }

    start(){
        this.socket = require('socket.io-client').connect();
        this._initListener();

        this.entities={};

        this.players={};
        this.player_texture=null;


        this.context={
            world:new PIXI.Container(),
            players:new PIXI.Container(),
            entities:new PIXI.Container()
        };

        this.context.world.interactive = true;
        // this.context.world.buttonMode = true;
        this.context.world.width=1000;
        this.context.world.height= 1000;
        this.context.world.background = 0x109FFF;

        this.context.world.on('mousedown', this.onDragStart.bind(this) )
            .on('touchstart', this.onDragStart.bind(this))
            // events for drag end
            .on('mouseup', this.onDragEnd.bind(this))
            .on('mouseupoutside', this.onDragEnd.bind(this))
            .on('touchend', this.onDragEnd.bind(this))
            .on('touchendoutside', this.onDragEnd.bind(this))
            // events for drag move
            .on('mousemove', this.onDragMove.bind(this))
            .on('touchmove', this.onDragMove.bind(this));


        this.context.players.on('mousemove', this.sendMousePos.bind(this))
            .on('touchmove', this.sendMousePos.bind(this));


        this.app.stage.addChild(this.context.world);

        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFF00);
        graphics.lineStyle(5, 0xFF0000);
        this.context.world.hitArea = new PIXI.Rectangle(0,0,Statics.PLAYGROUND.WIDTH,Statics.PLAYGROUND.HEIGHT);
        graphics.drawRect(0, 0, 1000,1000);
        this.context.world.addChild(graphics);


        this.context.world.addChild(this.context.entities);
        this.context.players.interactive = true;
        this.context.world.addChild(this.context.players);

        document.addEventListener("mousewheel", this.zoom.bind(this), false);

       // this.updateCam();

        InputHandler.setMapping(Statics.GLOBALS.KEY_MAPPING);



/*
        PIXI.loader.add("image2",'./../images/c2.png').once('complete', function (loader, resources) {
            this.app.stage.addChild(new Entity(false,PIXI.loader.resources.image2.texture).sprite);
        }.bind(this)).load();
*/

/*
        var q = this.getActionKey(81);
        var e = this.getActionKey(69);

        e.press = function () {
            this.context.world.rotation = this.context.world.rotation-0.1;
        }.bind(this);
        */
    }

    update(delta){

    }

    onDragStart(event) {
        // store a reference to the data
        // the reason for this.context.world is because of multitouch
        // we want to track the movement of this.context.world particular touch
        this.context.world.data = event.data;
      //  this.context.world.sprite.alpha = 0.5;
        this.context.world.dragging = true;
        this.context.world.pos = {
            old:event.data.global,
            new:event.data.global
        };
        Statics.GLOBALS.CAMERA_MOVE = true;
      //  this.context.world.sprite.scale.set(0.5);

      //  this.context.world.synchronize(Statics.PROTOCOL.CLIENT.DRAG_START,this.context.world.id);
    }

    onDragEnd() {
     //   this.context.world.sprite.alpha = 1;
    //    this.context.world.sprite.scale.set(1);
        this.context.world.dragging = false;

        // sesprite.t the interaction data to null
        this.context.world.data = null;
        this.context.world.pos=null;
        Statics.GLOBALS.CAMERA_MOVE = false;
    //    this.context.world.synchronize(Statics.PROTOCOL.CLIENT.DRAG_END,this.context.world.id);
    }

    onDragMove() {
        if (this.context.world.dragging) {
            var dx = this.context.world.pos.old.x - this.context.world.pos.new.x;
            var dy = this.context.world.pos.old.y - this.context.world.pos.new.y;

            this.context.world.position.x -=dx;
            this.context.world.position.y -=dy;

            this.updateCam();



            this.context.world.pos.old = {x:this.context.world.pos.new.x,y:this.context.world.pos.new.y};
        //    this.context.world.pos.new = this.data.getLocalPosition(this.parent); //this.context.world.data.global;
        }
    }

    sendMousePos(data) {
        var cp = data.data.getLocalPosition(this.context.players.parent);
        this.sendMessage(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,{msg:"",data:{x:cp.x,y:cp.y}});
    }


    zoom(evt) {
        var elem = this.context.world;
        if(evt.deltaY <0 ){

            Statics.GLOBALS.CURRENT_ZOOM+=Statics.ZOOM.SENSIVITY;

            if(Statics.GLOBALS.CURRENT_ZOOM > Statics.ZOOM.MAX){
                Statics.GLOBALS.CURRENT_ZOOM = Statics.ZOOM.MAX;
            }
            elem.scale.set(Statics.GLOBALS.CURRENT_ZOOM);
        }
        if(evt.deltaY > 0 ){
            Statics.GLOBALS.CURRENT_ZOOM-=Statics.ZOOM.SENSIVITY;
            if(Statics.GLOBALS.CURRENT_ZOOM < Statics.ZOOM.MIN){
                Statics.GLOBALS.CURRENT_ZOOM = Statics.ZOOM.MIN;
            }
            elem.scale.set(Statics.GLOBALS.CURRENT_ZOOM);
        }
        this.updateCam();

     /*   var direction = isZoomIn ? 1 : -1;
        var factor = (1 + direction * 0.1);
        graphGraphics.scale.x *= factor;
        graphGraphics.scale.y *= factor;

        // Technically code below is not required, but helps to zoom on mouse
        // cursor, instead center of graphGraphics coordinates
        var beforeTransform = getGraphCoordinates(x, y);
        graphGraphics.updateTransform();
        var afterTransform = getGraphCoordinates(x, y);

        graphGraphics.position.x += (afterTransform.x - beforeTransform.x) * graphGraphics.scale.x;
        graphGraphics.position.y += (afterTransform.y - beforeTransform.y) * graphGraphics.scale.y;
        graphGraphics.updateTransform();*/
    }


    updateCam(){
        if(Statics.PLAYGROUND.WIDTH*Statics.GLOBALS.CURRENT_ZOOM > this.app.renderer.width) {
            if (this.context.world.position.x < this.app.renderer.width - Statics.PLAYGROUND.WIDTH*Statics.GLOBALS.CURRENT_ZOOM) this.context.world.position.x = this.app.renderer.width - Statics.PLAYGROUND.WIDTH*Statics.GLOBALS.CURRENT_ZOOM;
            if (this.context.world.position.x > 0) this.context.world.position.x = 0;
        }else{
            this.context.world.position.x = this.app.renderer.width/2 - (Statics.PLAYGROUND.WIDTH*Statics.GLOBALS.CURRENT_ZOOM)/2;
        }

        if(Statics.PLAYGROUND.HEIGHT*Statics.GLOBALS.CURRENT_ZOOM > this.app.renderer.height) {
            if (this.context.world.position.y < this.app.renderer.height - Statics.PLAYGROUND.HEIGHT*Statics.GLOBALS.CURRENT_ZOOM) this.context.world.position.y = this.app.renderer.height - Statics.PLAYGROUND.HEIGHT*Statics.GLOBALS.CURRENT_ZOOM;
            if (this.context.world.position.y > 0) this.context.world.position.y = 0;
        }else{
            this.context.world.position.y = this.app.renderer.height/2 - (Statics.PLAYGROUND.HEIGHT*Statics.GLOBALS.CURRENT_ZOOM)/2;
        }
    }
/*

    getActionKey(keyCode) {
        var key = {};
        key.code = keyCode;
        key.isDown = false;
        key.isUp = true;
        key.press = undefined;
        key.release = undefined;
        //The `downHandler`
        key.downHandler = function(event) {

            if (event.keyCode === key.code) {
                if (key.isUp && key.press) key.press();
                key.isDown = true;
                key.isUp = false;
            }
            event.preventDefault();
        };

        //The `upHandler`
        key.upHandler = function(event) {
            if (event.keyCode === key.code) {
                if (key.isDown && key.release) key.release();
                key.isDown = false;
                key.isUp = true;
            }
            event.preventDefault();
        };

        //Attach event listeners
        window.addEventListener(
            "keydown", key.downHandler.bind(key), false
        );
        window.addEventListener(
            "keyup", key.upHandler.bind(key), false
        );
        return key;
    }
*/
    //img.crossOrigin = '';img.src = "https://lh3.googleusercontent.com/-DZWdQdfqhD0/VH3okGCpocI/AAAAAAAAALA/VeWHZzMdJmY/h120/bunny.png";img.onload = function() {    var c = document.createElement('canvas');    var ctx = c.getContext("2d");    ctx.drawImage(img, 0, 0);    imgURL = c.toDataURL()
}

module.exports=GameManager;