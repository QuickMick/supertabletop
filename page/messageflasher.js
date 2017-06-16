/**
 * Created by Mick on 16.06.2017.
 */

'use strict';

const Util = require('./../core/util');

module.exports = function (rootNode,messages,errors,clean) {

    if(!rootNode || (!errors && !messages)) return;
    var fragment = Util.htmlStringToNode(window["messages"]({
        errors:errors || [],
        messages:messages || [],
        I18N:I18N.completeLanguageData
    }));

    if(clean) {
        while (rootNode.firstChild) {
            rootNode.removeChild(rootNode.firstChild);
        }
    }

    rootNode.appendChild(fragment);
};