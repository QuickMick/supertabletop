/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');

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

// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
/*if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = o.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = fromIndex | 0;
        if (n >= len) {
            return -1;
        }
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (k in o && o[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

Array.prototype.removeByValue = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
 */


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
        window.hideLoadingDialog();

        window.addEventListener("resize", resize);

        var gameManager =  new GameManager(app);
        gameManager.start();
        app.ticker.add(gameManager.update.bind(gameManager));
       // app.ticker.add(require('./inputhandler').update);

        function resize() {
            var x = screen.getBoundingClientRect();
            app.renderer.resize(x.width,x.height);
           /* GameState.RENDERER_SIZE={
                width:app.renderer.width,
                height:app.renderer.height
            };*/
           // gameManager..updateCam();
            gameManager.toolManager.currentTool.focusCamera();
        }
        resize();

    }.bind(this)).load();
};


