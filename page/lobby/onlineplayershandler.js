/**
 * Created by Mick on 26.06.2017.
 */

'use strict';

const Util = require('./../../core/util');
const Color = require('./../../public/resources/colors.json');
const Rights = require('./../../core/rights');

class OnlinePlayersHandler {

    constructor(rootContainerID) {
        this._rootContainer = document.getElementById(rootContainerID) || document.body;

        // following initializes the "no player" text



        this._noPlayersBanner = Util.htmlStringToNode(window.lobbyOnlinePlayerListItem({I18N:I18N.completeLanguageData})).childNodes[0];
        this._rootContainer.appendChild(this._noPlayersBanner);
        this._playerNodes = {};
    }

    onUserConnected(evt){
        if(!evt || !evt.connects) return;

        for(var i = 0; i< evt.connects.length; i++) {
            var cur = evt.connects[i];

            var elem = Util.htmlStringToNode(
                window.lobbyOnlinePlayerListItem(
                    {
                        displayName:cur.displayName,
                        isGuest: cur.status <= 0 || !cur.status,
                        color: (Color.PLAYERS_COLORS[cur.color] || "").replace("0x","#"),
                        prefix: I18N.translate(Rights.RIGHTS_STRENGTH[cur.status]),
                        playerID: cur.id
                    }
                )
            );
            this._playerNodes[cur.id] = elem.childNodes[0];
            this._rootContainer.appendChild(elem);
        }

        // if there are players connected, remove the "no players" banner
        if(this._noPlayersBanner.parentElement && Object.keys(this._playerNodes).length > 0 ){
            this._noPlayersBanner.parentElement.removeChild(this._noPlayersBanner);
        }
    }

    onUserDisconnected(evt){
        for(var i = 0; i< evt.disconnects.length; i++) {
            var cur = this._playerNodes[evt.disconnects[i]];// document.getElementById(ID_PREFIX+evt.disconnects[i]);
            if(!cur || ! cur.parentElement) continue;
            cur.parentElement.removeChild(cur);

            delete this._playerNodes[evt.disconnects[i]];
        }

        if(!this._noPlayersBanner.parentElement && Object.keys(this._playerNodes).length <= 0 ){
            this._noPlayersBanner.parentElement.appendChild(this._noPlayersBanner);
        }
    }
}

module.exports = OnlinePlayersHandler;