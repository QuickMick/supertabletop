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
     * @param type of the change
     * @param id affeced item/entity/player
     * @param data changed data
     */
    postUpdate(type, id, data){
        if(!id || !data){
            console.log("cannot post update without sufficient data!");
            return;
        }

        var array = [].concat(data);
        for(var i=0;i<array.length;i++) {
            var updatedData = array[i];
            if (!this._queue[type]) {
                this._queue[type] = {};
            }

            if (!this._queue[type][id]) {
                this._queue[type][id] = {};
            }

            // merge update data to current queue
            for (var key in updatedData) {
                if (!updatedData.hasOwnProperty(key) || key == "mode")continue;

                if(updatedData.mode){
                    switch(updatedData.mode){
                        case "add":                // if data field looks like {add:true,value:3} then add,
                            if(!this._queue[type][id][key]) this._queue[type][id][key]= 0;
                            this._queue[type][id][key] += updatedData[key];
                            break;
                        case "push":
                            if(!this._queue[type][id][key]) this._queue[type][id][key] = [];
                            this._queue[type][id][key] = this._queue[type][id][key].concat(updatedData[key]);
                            break;
                    }
                } else { // otherwise just replace
                    this._queue[type][id][key] = updatedData[key];
                }
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