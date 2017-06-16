/**
 * Created by Mick on 08.06.2017.
 */

'use strict';

var BaseDialog = require('./basedialog');
const Util = require('./../../../core/util');

var GAMES_PER_SITE = 10;

class GameChooserDialog extends BaseDialog{

    constructor() {
        super(
            "gameChooserTemplate",
            {I18N:I18N.completeLanguageData}
        );


        this.listContentNode = this.fragment.querySelectorAll("div.game-chooser-content")[0];

        this._requestPage(0);
    }

    _requestPage(pageNumner = 0){
        var request = new XMLHttpRequest();
        request.open("GET","games");
        request.setRequestHeader("pagenumber",pageNumner);
        request.addEventListener('load', function(event) {
            if (request.status >= 200 && request.status < 300) {
                //  console.log(request.responseText);
                this._setListContent(request.response);
            } else {
                // console.warn(request.statusText, request.responseText);
                this._showError(request.responseText);
            }
        }.bind(this));
        request.send();
    }

    _setListContent(response){
        if(!response){
            this._showError("unknown_error");
            return;
        }

        response = JSON.parse(response);
       // var x = document.createDocumentFragment();


        var newContent = "";

        for(var i=0; i<response.games.length;i++) {
            var curGame = response.games[i];
            newContent +=" "+window.gameListItem(
                {
                    I18N:I18N.completeLanguageData,
                    thumbnail:"resources/users/mick/mick_avatar.png",
                    name:curGame.name || "unknown",
                    rating:curGame.rating || 0,
                    description:curGame.description || I18N.translate("no_description"),
                    creator:curGame.creator || "unknown"
                }
            );
        }
//
        this.listContentNode.innerHTML = newContent;

    }

    _showError(error){

    }

    /**
     * @Override
     * @param action
     * @private
     */
    _click(action){
        super._click(action);

        switch (action){
            case "close": this.close(); break;
            case "back":  break;
            case "forward":  break;

            default: return;
        }

        //this.close();
    }

}

module.exports = GameChooserDialog;