/**
 * Created by Mick on 16.06.2017.
 */

'use strict';

const Util = require('./../core/util');


function avoidDuplicaes(children,messages){
    var m = [];
    var valid = true;
    for (var i = 0; i < messages.length; i++) {
        var curMsg = messages[i];
        valid = true;
        for (var j = 0; j < children.length; j++) {
            var node = children[j];
            if (node.dataset.message = curMsg) {
                valid = false;
                break;
            }
        }

        if (valid) {
            m.push(curMsg);
        }
    }
    return m;
}

module.exports = function (rootNode,messages,errors,clean) {
    if(!rootNode || (!errors && !messages)) return;

    messages = (messages || []);
    errors = (errors || []);

    var m = [];
    var e = [];

    if(!clean) {
        var children = rootNode.childNodes;
        m=avoidDuplicaes(children,messages);
        e=avoidDuplicaes(children,errors);
    }else{
        m = messages;
        e = errors;
    }

    var fragment = Util.htmlStringToNode(window["messages"]({
        errors:e,
        messages:m,
        I18N:I18N.completeLanguageData
    }));

    if(clean) {
        while (rootNode.firstChild) {
            rootNode.removeChild(rootNode.firstChild);
        }
    }

    rootNode.appendChild(fragment);
};