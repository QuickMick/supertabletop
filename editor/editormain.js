/**
 * Created by Mick on 29.05.2017.
 */
/**
 * Created by Mick on 18.05.2017.
 */
"use strict";
require('pixi.js');
var Path = require('path');

var EditorManager = require('./editormanager');

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
 /*   const RELATIVE_PATH = "./../";
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
    }*/

    // load game resources and once finished, start the game
   /* PIXI.loader.once('complete', function(){

        setTimeout(function () {*/
            //window.hideLoadingDialog();

            var editorManager =  new EditorManager(app);
            editorManager.start();
            app.ticker.add(editorManager.update.bind(editorManager));
            // app.ticker.add(require('./inputhandler').update);


      //      var headerHeight = window.getComputedStyle(document.body).getPropertyValue('--header-height');

            function resize() {
                var x = screen.getBoundingClientRect();
                app.renderer.resize(x.width,(x.height));
                editorManager.emit('resize',{width:x.width,height:x.height});
            }

            resize();
            window.addEventListener("resize", resize);
   /*     },1);
    }.bind(this)).load();*/
};


