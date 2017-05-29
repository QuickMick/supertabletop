/**
 * Created by Mick on 23.05.2017.
 */

'use strict';

/**
 * Contains various utility methods
 */
class Util{

    constructor(){
        throw "no instances allowd of util";
    }

    /**
     * Converts a string to color,
     * if input parameter is null, then white will be returned
     * @param s input string of color in format #FFFFFF or 0xFFFFFF
     * @returns {Number} color as int
     */
    static parseColor(colorString){
        if(!colorString) return 0xFFFFFF;
        var color = parseInt(colorString.replace("#", "0x"));
        return !Number.isNaN(color)?color: 0xFFFFFF;
    }


    /**
     * Creates a random color string
     * @returns {string}
     */
    static getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '0x';
        for (var i = 0; i < 6; i++ ) {
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
    static getVectorDistance(x1,y1,x2,y2){
        var a = x1 - x2;
        var b = y1 - y2;
        return Math.sqrt( a*a + b*b );
    }

    static round (value, decimal=0) {
        var x;
        switch(decimal){
            case 0: x=1; break;
            case 1: x=10; break;
            case 2: x=100; break;
            case 3: x=1000; break;
            default: x= Math.pow(10,decimal); break;
        }
        return (Math.round(value * x)/x)
    }

    /**
     * if the number is smaller than the range, then the highes number is returned,
     * if it is higher, the smallest number is returned
     * @param min
     * @param max
     * @returns {*}
     */
    static torusRange(val,min, max) {
        if(this < min)return max;
        if(this > max)return min;
        return val;
    }

    /**
     * returns a random int between (including) max and min
     * @param max highes possible random number
     * @param min lowest possible random number (is 0 by default)
     * @returns {number} the random number
     */
    static randomInRange(max,min=0){
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    /**
     * forces a number to be in a range
     * @param min bottem boundary of the range
     * @param max upper boundary of the range
     * @returns {number} which is in the range, including the boundaries
     */
    static forceRange(val, min, max) {
        if(this <= min)return min;
        if(this >= max)return max;

        return val;
    }

    /**
     * loads a resurce and passes the data to the callback
     * the loaded data is base64 and can be used to load
     * @param url
     * @param callback
     */
    /*loadDataBase64(url, callback) {
        if(!url){
            console.log("loadDataURL: no url passed!");
            return;
        }
        if(!callback){
            console.log("loadDataURL: no callback passed!");
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }*/


    /**
     * performs linaar interpolation
     *
     * @param start {number} start value
     * @param end {number} target value
     * @param t {number} prograss between 0.0 and 1.0, everything is extrapolation
     * @returns {number} the interpolated value
     */
    static lerp(start,end,t){
        return (1 - t) * start + t * end;
    }
}

module.exports = Util;