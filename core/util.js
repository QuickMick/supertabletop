/**
 * Created by Mick on 23.05.2017.
 */

'use strict';

/**
 * Contains various utility methods
 */
class Util{

    /**
     * Converts a string to color,
     * if input parameter is null, then white will be returned
     * @param s input string of color in format #FFFFFF or 0xFFFFFF
     * @returns {Number} color as int
     */
    parseColor(colorString){
        if(!colorString) return 0xFFFFFF;
        var color = parseInt(colorString.replace("#", "0x"));
        return !Number.isNaN(color)?color: 0xFFFFFF;
    }


    /**
     * Creates a random color string
     * @returns {string}
     */
    getRandomColor() {
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
    getVectorDistance(x1,y1,x2,y2){
        var a = x1 - x2;
        var b = y1 - y2;
        return Math.sqrt( a*a + b*b );
    }

}

module.exports = new Util();