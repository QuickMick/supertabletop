/**
 * Created by Mick on 07.06.2017.
 */

'use strict';

var target="";

process.argv.forEach(function (val, index, array) {
    if(val.startsWith("target=")){
        target = val.replace("target=", "");
    }
});

if(!target){
    throw "no target was passed in the command line!";
}


var http = require('https');
var parser = require('xml2json');
var fs = require('fs');

var req = http.get('https://www.mogelmail.de/mogelmails.xml', function(res) {
    // save the data
    var xml = '';
    res.on('data', function(chunk) {
        xml += chunk;
    });

    res.on('end', function() {


        var j = JSON.parse(parser.toJson(xml, {
            trim: true
        }));

        var l = j.domainlist.domainitem;

        var result = {};

        for(var k in l){
            if(!l.hasOwnProperty(k)) continue;
            var c = l[k];
            result[c.domain] = c.lastupdate;

        }
        result.source = "https://www.mogelmail.de/mogelmails.xml";
        console.log(result);
        fs.writeFileSync(target, JSON.stringify(result));
        console.log("finished with",Object.keys(result).length,"elements");
    });
});
/*
console.log("staring - file out:",target);

var result = [];
var array = fs.readFileSync(source).toString().split("\n");
for(var i in array) {
    if(array[i].includes(" ")) continue; //just take names wihtout whitespace
    result.push(array[i].trim());
}
console.log(result.length,"names written");
*/