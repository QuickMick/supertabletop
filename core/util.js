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
        var color = parseInt(colorString.replace("#", "0x"));
        return !Number.isNaN(color)?color: 0xFFFFFF;
    }
}

module.exports = new Util();