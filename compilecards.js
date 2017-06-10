/**
 * Created by Mick on 10.06.2017.
 */

'use strict';


const x =JSON.stringify({
    "type": "wordcard",
    "overwrite": {
        "surfaceIndex": 0,
        "surfaces.0": {
            "texture": "wordcard.png",
            "text": [
                {
                    "position": {
                        "x": -40,
                        "y": -7
                    },
                    "content": "Yogalehrer",
                    "fontSize": 12,
                    "color": "0x000000",
                    "fontFamily": "arial",
                    "align":"left"
                }
            ]
        }
    }
});




var source="";
var target="";

process.argv.forEach(function (val, index, array) {
    if(val.startsWith("source=")){
        source = val.replace("source=","");
    }
    if(val.startsWith("target=")){
        target = val.replace("target=", "");
    }
});

if(!source || !target){
    throw "no source or target was passed in the command line!";
}

console.log("staring - file in:",source,"file out:",target);
var fs = require('fs');
var result = [];
var array = fs.readFileSync(source).toString().split("\n");
for(let i in array) {
    if(array[i].includes(" ")) continue; //just take names wihtout whitespace

    var r = JSON.parse(x);
    r.overwrite["surfaces.0"].text[0].content = array[i].trim();
    result.push(r);
}
console.log(result.length,"words written");
fs.writeFileSync(target, JSON.stringify(result));