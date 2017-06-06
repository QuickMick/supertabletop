/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');

var i18n =require('./../../core/i18n');

var Statics = require("./../../core/statics");

var GameState = require('./gamestate');
var GameManager = require('./gamemanager');
var InputAction = require('./inputaction');
var ToolManager = require('./toolmanager');

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


window.I18N = new i18n(I18N_DATA);

/*Number.prototype.round = function (decimal=0) {
    var x;
    switch(decimal){
        case 0: x=1; break;
        case 1: x=10; break;
        case 2: x=100; break;
        case 3: x=1000; break;
        default: x= Math.pow(10,decimal); break;
    }
    return (Math.round(this * x)/x)
};*/


window.showLoadingDialog=function(){
    document.getElementById("loading-overlay").style.display=""; //"flex";
};

window.hideLoadingDialog=function(){
    document.getElementById("loading-overlay").style.display="none";
};

window.onload = function() {
    window.showLoadingDialog();
    var screen = document.getElementById("stage");
    // prevent context menu on gameplay
    screen.oncontextmenu = function (e) {
        e.preventDefault();
    };

    var app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
    screen.appendChild(app.view);

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

        setTimeout(function () {
            //window.hideLoadingDialog();

            var gameManager =  new GameManager(app);
            gameManager.start();
            app.ticker.add(gameManager.update.bind(gameManager));
           // app.ticker.add(require('./inputhandler').update);

            function resize() {
                var x = screen.getBoundingClientRect();
                app.renderer.resize(x.width,x.height);
                gameManager.emit('resize',{width:x.width,height:x.height});

               // app.stage.interactionManager.resolution = app.renderer.resolution;
                gameManager.toolManager.currentTool.focusCamera();//.bind(gameManager.toolManager.currentTool))();
            }

            resize();
            window.addEventListener("resize", resize);
        },100);
    }.bind(this)).load();
};


