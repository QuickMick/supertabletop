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
        chat += this._add('chat/chat_template.pug', "chatTemplate");
        chat += this._add('chat/chat_user_msg.pug', "chatUserMsg");
        chat += this._add('chat/chat_server_msg.pug', "chatServerMsg");
        chat += this._add('chat/chat_server_error_msg.pug', "chatServerErrorMsg");

        var tabletop = "";
        tabletop += this._add('tabletop/user_item.pug',"tabletopUserItem");
        tabletop += this._add('tabletop/name_chooser.pug',"nameChooserTemplate");
        tabletop += this._add('tabletop/ingame_player_config.pug',"inGamePlayerConfig");

        tabletop += this._add('tabletop/game_chooser_template.pug',"gameChooserTemplate");
        tabletop += this._add('tabletop/game_list_item.pug',"gameListItem");

        tabletop += this._add('page/login_dialog.pug',"loginDialog");
        tabletop += this._add('page/signup_dialog.pug',"signupDialog");
        tabletop += this._add('page/profile_dialog.pug',"profileDialog");
        tabletop += this._add('page/empty_dialog.pug',"emptyDialog");
        tabletop += this._add('page/yesno_dialog.pug',"yesNoDialog");
        tabletop += this._add('page/messages.pug',"messages");

        tabletop += this._add('page/lobby_online_player_list_item.pug',"lobbyOnlinePlayerListItem");




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