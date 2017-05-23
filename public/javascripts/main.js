/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');
var Statics = require("./../../core/statics");

var GameManager = require('./gamemanager');
var InputAction = require('./inputaction');

var Resources = require('./../resources/resources.json');
var Config = require('./../resources/config.json');

var Path = require('path');

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


window.showLoadingDialog=function(){
    document.getElementById("loading-overlay").style.display=""; //"flex";
};

window.hideLoadingDialog=function(){
    document.getElementById("loading-overlay").style.display="none";
};


window.onload = function() {
    window.showLoadingDialog();
    var screen = document.getElementById("stage");

    var app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
    screen.appendChild(app.view);

    // load all keys located in config.json
    var keyMapping = {};
    for(let key in Config.KEY_MAPPING){
        var cur = Config.KEY_MAPPING[key];
        keyMapping[key] = new InputAction(key,cur.keyboard, cur.mouse);
    }
    // init key mapping
   /* Statics.GLOBALS.KEY_MAPPING = {
        TURN:new InputAction("TURN", [70])
    };*/
    require('./inputhandler').setMapping(keyMapping);


    // preparing loading game resouces
    const RELATIVE_PATH = "./../";
    for(var area_key in Resources) {
        if(!Resources.hasOwnProperty(area_key)) continue;
        var current_area = Resources[area_key];
        if(!current_area.content) continue;

        var folder = current_area.base_folder;
        for(var content_key in current_area.content) {
            if (!current_area.content.hasOwnProperty(content_key)) continue;

            var resource_name = current_area.content[content_key].texture;
            var resource_path = Path.join(Config.PATHS.RESOURCE_BASE,folder,resource_name);

            PIXI.loader.add({
                name: resource_name,
                url: resource_path
            });
        }
    }

    // load game resources and once finished, start the game
    PIXI.loader.once('complete', function(){
        window.hideLoadingDialog();

        window.addEventListener("resize", resize);


        var gameManager =  new GameManager(app);
        app.ticker.add(gameManager.update);
        gameManager.start();

        function resize() {
            var x = screen.getBoundingClientRect();
            app.renderer.resize(x.width,x.height);
            gameManager.gameTable.updateCam();
        }
        resize();
    }.bind(this)).load();
};


