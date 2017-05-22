/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');
var Statics = require("./../../core/statics");

var GameManager = require('./gamemanager');
var InputAction = require('./inputaction');

PIXI.Container.prototype.bringToFront = PIXI.Sprite.prototype.bringToFront = function() {	if (this.parent) {		var parent = this.parent;		parent.removeChild(this);		parent.addChild(this);	}};

PIXI.Container.prototype.removeAll = PIXI.Sprite.prototype.removeAll = function () { while(this.children[0]) { this.removeChild(this.children[0]); } };



if (window.requestAnimationFrame) //(func);
    window.requestAnimationFrame = window.requestAnimationFrame;
else if (window.msRequestAnimationFrame)
    window.requestAnimationFrame=window.msRequestAnimationFrame;
else if (window.mozRequestAnimationFrame)
    window.requestAnimationFrame=window.mozRequestAnimationFrame;
else if (window.webkitRequestAnimationFrame)
    window.requestAnimationFrame=window.webkitRequestAnimationFrame;



window.onload = function() {
    var screen = document.getElementById("stage");

    var app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
    screen.appendChild(app.view);

    //screen.style.display = "none";



    Statics.GLOBALS.KEY_MAPPING = {
        TURN:new InputAction("TURN", [70])
    };


    // preparing loading game resouces
    const RELATIVE_PATH = "./../";
    for(var key in Statics.RESOURCES) {
        if(!Statics.RESOURCES.hasOwnProperty(key)) continue;

        PIXI.loader.add({
            name: Statics.RESOURCES[key],//Statics.RESOURCES.CURSOR,
            url: RELATIVE_PATH + Statics.PATHS.RESOURCE_PATH + "/" + Statics.RESOURCES[key] //Statics.RESOURCES.CURSOR
        });
    }

    // load game resources and once finished, start the game
    PIXI.loader.once('complete', function(){

        document.getElementById("loadingscreen").style.display="none";
        screen.style.display="flex";

        window.addEventListener("resize", resize);


        var gameManager =  new GameManager(app);
        app.ticker.add(gameManager.update);
        gameManager.start();

        function resize() {
            var x = screen.getBoundingClientRect();
            app.renderer.resize(x.width,x.height);
            gameManager.updateCam();
        }
        resize();
    }.bind(this)).load();
};


