/**
 * Created by Mick on 23.05.2017.
 */

'use strict';

/**
 * Contains various utility methods
 */
class Util {

    constructor() {
        throw "no instances allowd of util";
    }

    /**
     * Converts a string to color,
     * if input parameter is null, then white will be returned
     * @param s input string of color in format #FFFFFF or 0xFFFFFF
     * @returns {Number} color as int
     */
    static parseColor(colorString) {
        if (!colorString && colorString != 0) return 0xFFFFFF;

        if (typeof colorString == "number") {
            return Math.round(colorString);
        }

        var color = parseInt(colorString.replace("#", "0x"));
        return !Number.isNaN(color) ? color : 0xFFFFFF;
    }

    static getHexColor(number){
        return "#"+((number)>>>0).toString(16).slice(-6);
    }

    /**
     * converts a hex color to an RGB object
     * @param hex
     * @returns {{r: number, g: number, b: number}}
     */
    static hexToRGB(hex){
        return {
            r: (hex & 0xff0000) >> 16,
            g: (hex & 0x00ff00) >> 8,
            b: (hex & 0x0000ff)
        };
    }

    /**
     * Creates a random color string
     * @returns {string}
     */
    static getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '0x';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /**
     * calculates the vector distance between two points
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {number} the distance
     */
    static getVectorDistance(x1, y1, x2, y2) {
        var a = x1 - x2;
        var b = y1 - y2;
        return Math.sqrt(a * a + b * b);
    }

    static round(value, decimal = 0) {
        var x;
        switch (decimal) {
            case 0:
                x = 1;
                break;
            case 1:
                x = 10;
                break;
            case 2:
                x = 100;
                break;
            case 3:
                x = 1000;
                break;
            default:
                x = Math.pow(10, decimal);
                break;
        }
        return (Math.round(value * x) / x)
    }

    /**
     * if the number is smaller than the range, then the highes number is returned,
     * if it is higher, the smallest number is returned
     * @param min
     * @param max
     * @returns {*}
     */
    static torusRange(val, min, max) {
        if (val < min)return max;
        if (val > max)return min;
        return val;
    }

    /**
     * returns a random int between (including) max and min
     * @param max highes possible random number
     * @param min lowest possible random number (is 0 by default)
     * @returns {number} the random number
     */
    static randomInRange(max, min = 0) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    /**
     * forces a number to be in a range
     * @param min bottem boundary of the range
     * @param max upper boundary of the range
     * @returns {number} which is in the range, including the boundaries
     */
    static forceRange(val, min, max) {
        if (val <= min)return min;
        if (val >= max)return max;

        return val;
    }

    static removeByValue(array) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && array.length) {
            what = a[--L];
            while ((ax = array.indexOf(what)) !== -1) {
                array.splice(ax, 1);
            }
        }
        return array || [];
    };

    static arrayContains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

    /**
     * performs linaar interpolation
     *
     * @param start {number} start value
     * @param end {number} target value
     * @param t {number} prograss between 0.0 and 1.0, everything is extrapolation
     * @returns {number} the interpolated value
     */
    static lerp(start, end, t) {
        return (1 - t) * start + t * end;
    }


    /**
     * returns a random rotation
     * a.k.a. a number between 0 and 2PI
     * @returns {number}
     */
    static randomRotation(){
        return Math.random() * Math.PI * 2;
    }

    /**
     * caluclates a random point on a circle circumfence
     * @param x position of the circle
     * @param y position of the circle
     * @param radius of the circle
     * @returns {{x: *, y: *}}
     */
    static randomPointOnCircle(x, y, radius) {
        var angle = Util.randomRotation();
        return {
            x: x + Math.cos(angle) * radius,
            y: y + Math.sin(angle) * radius,
        }
    }

    /**
     * returns points on a circle
     * @param x center of the circle
     * @param y centerof the circle
     * @param radius radius of the circle
     * @param resolution number of points
     * @returns {[{x: *, y: *}]}
     */
    static pointsOfCircle(x=0, y=0, radius=1,resolution=1) {

        var result = [];
        var step = Math.PI*2 / resolution;

        var cur=0;
        for(var i=0;i<resolution;i++) {
            result.push({
                x: x + Math.cos(cur) * radius,
                y: y + Math.sin(cur) * radius,
            });

            cur+=step;
        }
        return result;
    }

    static pythagorean(a,b){
        return Math.sqrt((a*a)+(b*b));
    }

    /**
     * converst a string to html nodes
     * @param string {string}
     * @returns {NodeList}
     */
    static htmlStringToNode(htmlString){
        /*var div =  document.createDocumentFragment(); //document.createElement('div');
        div.innerHTML = string;
        return div.childNodes[0];*/
        return document.createRange().createContextualFragment(htmlString);
    }

    /**
     * tests if a passed string is a mail
     * @param mailString {string}
     * @returns {boolean} true, if passed string is a mail
     */
    static isValidMail(mailString) {
        if (!mailString)return false;
        if (typeof mailString != "string") return false;
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(mailString);
    }

    /**
     * Shuffles array in place. ES6 version
     * @param {Array} a items The array containing the items.
     */
    static shuffleArray(a) {
       var j, x, i;
        for (i = a.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
        return a;
    }

    static isPointInRectangle(x,y,rectX,rectY,rectWidth,rectHeight){
        return rectX <= x && x <= rectX + rectWidth && rectY <= y && y <= rectY + rectHeight;
    }

    /**
     * converts a loaded image from the pixi loader to the base64 format,
     * afterwards an url is created, which can be used as cursor
     * @param resName name of the available pixi loader resource
     * @param outputFormat optional
     * @param tint {number} or {string}
     * @returns {string}
     * @private
     */
    static convertTextureToBase64String(pixiResource, outputFormat,tint) {
        var curentResource = pixiResource;
        var img = curentResource.data;
        var width = curentResource.texture.width;
        var height = curentResource.texture.height;


        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        canvas.height = height;
        canvas.width = width;
        ctx.drawImage(img, 0, 0);

        tint = Util.parseColor(tint);
        if(tint) {
            var buffer = ctx.getImageData(0, 0, width, height);
            var len = buffer.data.length;
            var data = buffer.data;
            var c = Util.hexToRGB(tint);

            // use inverse to tint white
            c.r = 255-c.r;
            c.g = 255-c.g;
            c.b = 255-c.b;

            // loop through pixel array (RGBA = 4 bytes)
            for (var i=0; i < len; i += 4) {
                data[i] = data[i] - c.r;  // add R
                data[i + 1] = data[i + 1] - c.g;  // add G
                data[i + 2] = data[i + 2] - c.b;  // add B
            }

            // we're done, put back the new data to canvas
            ctx.putImageData(buffer, 0, 0);

        }

        var dataURL = canvas.toDataURL(outputFormat);
        canvas = null;

        return  dataURL;
    }

    static intToColorString(int){
        if(typeof int != 'number') return "#000000";
        return "#"+int.toString(16);
    }

    static stopPropagation(htmlNode){
        htmlNode.addEventListener("mousewheel", (e)=>e.stopPropagation(), true);
        htmlNode.addEventListener("mousemove", (e)=>e.stopPropagation(), true);
        htmlNode.addEventListener("mousedown", (e)=>e.stopPropagation(), true);
        htmlNode.addEventListener("mouseup", (e)=>e.stopPropagation(), true);
        htmlNode.addEventListener("keydown", (e)=>e.stopPropagation(), true);
        htmlNode.addEventListener("keyup", (e)=>e.stopPropagation(), true);
      //  htmlNode.addEventListener("click", (e)=>e.stopPropagation(), true);
    }


    static postXHTML(postAction, query,succesCallback,sentCallback,errorCallback){
        if(!postAction || !query){
            errorCallback("no_action_or_query_passed");
            return;
        }

        var xhttp = new XMLHttpRequest();
        xhttp.onerror = errorCallback;

        xhttp.onreadystatechange = function() {
            if (xhttp.readyState != 4) return;

            var result = JSON.parse(xhttp.response || "{]");
            if(succesCallback)
                succesCallback({action:postAction, query:query,result:result});
        };

        xhttp.open("POST", postAction, true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        xhttp.send(query);
        if(sentCallback)
            sentCallback({action:postAction, query:query});
    }
}

module.exports = Util;