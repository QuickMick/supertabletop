/**
 * Created by Mick on 06.06.2017.
 */

'use strict';

var fs = require('fs');
var pug = require('pug');
var Path = require('path');

class CompileLayouts {

    constructor() {
    }

    compile(){
        console.log("COMPILE TEMPLATES");
        var chat = "";
        //chat += this._add('chat/chat.pug', "chatTemplate");
      //  chat += this._add('chat/chat_user_msg.pug', "chatUserMsg");
      //  chat += this._add('chat/chat_server_msg.pug', "chatServerMsg");
      //  chat += this._add('chat/chat_server_error_msg.pug', "chatServerErrorMsg");

        var tabletop = "";
        tabletop += this._add('tabletop/user_item.pug',"tabletopUserItem");

        console.log("WRITE TEMPLATES");
        fs.writeFileSync("./public/js/templates.js", chat+tabletop);
    }


    _add(file,name){
        var path = Path.join(__dirname,file);
        console.log("compile:",path);
        return pug.compileFileClient(path, {name:name,inlineRuntimeFunctions: true,compileDebug: false,client:true})+" ";
    }

}

module.exports = CompileLayouts;