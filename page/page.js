/**
 * Created by Mick on 09.06.2017.
 */

'use strict';
var i18n =require('./../core/i18n');
window.I18N = new i18n(_I18N_DATA,_LANGUAGES,_LANGUAGE_ID);
/*delete _I18N_DATA;
delete _LANGUAGES;
delete _LANGUAGE_ID;*/


var LobbyHandler = require('./lobbyhandler');


class Page
{

    constructor()
    {
        this.lobbyHandler = new LobbyHandler();

        this.show(this.lobbyHandler);

    }


    show(handler){
        //TODO: altes hiden
        handler.show();
    }

}
window.onunload = function () {
  console.log("window.onunload");
};

window.showLoadingDialog=function(){
    document.getElementById("loading-overlay").style.display=""; //"flex";
};

window.hideLoadingDialog=function(){
    document.getElementById("loading-overlay").style.display="none";
};

window.onload = function() {
    new Page();
};