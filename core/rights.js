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

const RIGHTS_STRENGTH_MAP={
    [RIGHTS.guest]:0,
    [RIGHTS.registered]: 1,
    [RIGHTS.mod]:2,
    [RIGHTS.admin]:3
};


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
    RIGHTS_STRENGTH:RIGHTS_STRENGTH,
    strongerOrEqual:strongerOrEqual,
    strength:strength,
    STRONGEST_STRENGTH:RIGHTS_STRENGTH.length,
    RIGHTS_STRENGTH_MAP:RIGHTS_STRENGTH_MAP
};