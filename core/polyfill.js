/**
 * Created by Mick on 28.05.2017.
 */
"use strict";
/*
if (!Array.prototype.indexOf) {
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
*/
/*
Array.prototype.removeByValue = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};*/

/*
Number.prototype.between = function (min, max) {
    return this > min && this < max;
};

Number.prototype.inRange = function (min, max) {
    return this >= min && this <= max;
};

Number.prototype.round = function (decimal=0) {
    var x;
    switch(decimal){
        case 0: x=1; break;
        case 1: x=10; break;
        case 2: x=100; break;
        case 3: x=1000; break;
        default: x= Math.pow(10,decimal); break;
    }
    return (Math.round(this * x)/x)
};
*/

/**
 * forces a number to be in a range
 * @param min bottem boundary of the range
 * @param max upper boundary of the range
 * @returns {number} which is in the range, including the boundaries
 */
/*Number.prototype.forceRange = function (min, max) {
    if(this <= min)return min;
    if(this >= max)return max;

    return this;
};*/
/*
Number.prototype.nextRangeElement = function (min, max) {
    var cur = this+1;
    if(cur < min)return max;
    if(cur > max)return min;
    return this;
};

Number.prototype.previousRangeElement = function (min, max) {
    var cur = this-1;
    if(cur < min)return max;
    if(cur > max)return min;
    return this;
};*/

/**
 * if the number is smaller than the range, then the highes number is returned,
 * if it is higher, the smallest number is returned
 * @param min
 * @param max
 * @returns {*}
 */
/*Number.prototype.torusRange = function (min, max) {
    if(this < min)return max;
    if(this > max)return min;
    return this;
};*/

/**
 * returns a random int between (including) max and min
 * @param max highes possible random number
 * @param min lowest possible random number (is 0 by default)
 * @returns {number} the random number
 */
/*Math.randomInRange = function(max,min=0){
    return Math.floor(Math.random() * (max - min + 1) + min)
};*/