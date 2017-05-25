/**
 * Created by Mick on 25.05.2017.
 */
'use strict';


class EntityUpdateQueue{
    constructor(){
        this._queue = {_sendUpdateRequired:false};
    }


    /**
     * posts data which should be updated on the server
     * if the updated data object contains the filed "add", then all values get added to each other, if possible
     * e.g. if position.dx is already posted, the netxt position.dx gets added to the previeous value,
     * resulting in the value which is finaly sent do the server.
     * @param type
     * @param entity_id
     * @param updatedData
     */
    postEntityInteraction(type,entity_id,updatedData){
        if(!entity_id || !updatedData){
            console.log("cannot post update without sufficient data!");
            return;
        }

        if(!this._queue[type]){
            this._queue[type] = {};
        }

        if(!this._queue[type][entity_id]){
            this._queue[type][entity_id]={};
        }

        // merge update data to current queue
        for(var key in updatedData){
            if(!updatedData.hasOwnProperty(key))continue;

            // if data field looks like {add:true,value:3} then add,
            if(updatedData[key].add) {
                this._queue[type][entity_id][key] = this._queue[type][entity_id][key] || 0;
                this._queue[type][entity_id][key] += updatedData[key].value;
            }else{ // otherwise just replace
                this._queue[type][entity_id][key] = updatedData[key];
            }
        }
        this._queue._sendUpdateRequired = true;
    }

    get updateRequired(){
        return this._queue._sendUpdateRequired; //(this._queue._sendUpdateRequired)?true:false;
    }

    /**
     * get data which has changed
     */
    getUpdatedEntityData(){
        // only send, when updates are available
        if(!this._queue._sendUpdateRequired) return null;

        var toSend = this._queue;
        this._queue = {_sendUpdateRequired:false};
        delete toSend._sendUpdateRequired;

        return toSend;
    }

}

module.exports = EntityUpdateQueue;