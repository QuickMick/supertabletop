/**
 * Created by Mick on 25.05.2017.
 */
'use strict';

/**
 * used to post updates,
 * so that you do not need to send every change at once.
 * you post it to the update queue and send it in an accumulated format every interval (use setInverval and popUpdatedData)
 * to post data use postUpdate
 */
class UpdateQueue{
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
     * @param data changed data {data1:asd, data2:4,_mode= push(if item should be pushed to existing array, or add
     *          if data should be added to existing value  --> creates empty data fist in both cases if not existing,
     *          or pushAvoidDuplicates, pushes values to the array and avoids duplicate values}
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
                // continue, if key==__mode, because this is just used to define how the data is pushed
                if (!updatedData.hasOwnProperty(key) || key == "_mode") continue;

                if(updatedData._mode){
                    var mode = updatedData._mode;
                    delete updatedData._mode;   // delete mode, we do not need to send it

                    switch(mode){
                        case "add":                // if data field looks like {add:true,value:3} then add,
                            if(!this._queue[type][id][key]) this._queue[type][id][key]= 0;
                            this._queue[type][id][key] += updatedData[key];
                            break;
                        case "push":
                            if(!this._queue[type][id][key]) this._queue[type][id][key] = [];
                            this._queue[type][id][key] = this._queue[type][id][key].concat(updatedData[key]);
                            break;
                        case "pushAvoidDuplicates": //TODO: does not work for objects
                            if(!this._queue[type][id][key]) this._queue[type][id][key] = [];
                            // convert the concatinated array to a set, to avoid duplicates, then convert back to array
                            this._queue[type][id][key] = [...new Set(this._queue[type][id][key].concat(updatedData[key]))];
                            break;
                        default:
                            console.error("mode",mode,"does not exist! data was not posted");
                            return;
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
     * removes all posted updates
     */
    flush(){
        this._queue = {_sendUpdateRequired:false};
    }
    /**
     * get data which has changed since the last call, every changes will be deleted in this instance
     */
    popUpdatedData(){
        // only send, when updates are available
        if(!this._queue._sendUpdateRequired) return null;

        var toSend = this._queue;
        delete toSend._sendUpdateRequired;

        this.flush();

        return toSend;
    }

}

module.exports = UpdateQueue;