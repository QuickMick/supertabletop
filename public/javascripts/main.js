/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');
var Statics = require("./../../core/statics");

var GameManager = require('./gamemanager');

var InputHandler = require('./inputhandler');
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




window.onload = function(x) {
    var screen = document.getElementById("stage");

    var app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
    screen.appendChild(app.view);

    var gameManager =  new GameManager(app);

    Statics.GLOBALS.KEY_MAPPING = {
        TURN:new InputAction("UP", [70])
    };


    app.ticker.add(gameManager.update);

   // app.ticker.add(InputHandler.update);


    function resize() {
        var elem = screen; //window

        var x = screen.getBoundingClientRect();
        // Determine which screen dimension is most constrained

        // Update the renderer dimensions
        app.renderer.resize(x.width,x.height);
        gameManager.updateCam();
    }

    window.addEventListener("resize", resize);
    resize();

    gameManager.start();

};


