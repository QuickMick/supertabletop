/**
 * Created by Mick on 07.06.2017.
 */

'use strict';

const RIGHTS={
    guest:"guest",
    registered: "registered",
    mod:"mod",
    admin:"admin"
};

/**
 * just to measure the strenght of a right
 * @type {*[]}
 */
const RIGHTS_STRENGTH=[
    RIGHTS.guest,
    RIGHTS.registered,
    RIGHTS.mod,
    RIGHTS.admin
];

var strength = function (right) {
    return RIGHTS_STRENGTH.indexOf(right);
};

/**
 * compares rights
 * @param a
 * @param b right to compare with
 * @returns {boolean}
 */
var strongerOrEqual = function (a,b) {
    return strength(a) >= strength(b);
};

module.exports = {
    RIGHTS:RIGHTS,
    strongerOrEqual:strongerOrEqual,
    strength:strength,
    STRONGEST_STRENGTH:RIGHTS_STRENGTH.length
};