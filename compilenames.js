/**
 * Created by Mick on 07.06.2017.
 */

'use strict';

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
var array = fs.readFileSync('random_names.txt').toString().split("\n");
for(var i in array) {
    if(array[i].includes(" ")) continue; //just take names wihtout whitespace
    result.push(array[i].trim());
}
console.log(result.length,"names written");
fs.writeFileSync("./core/random_names.json", JSON.stringify(result));