/**
 * Created by Mick on 28.05.2017.
 */
'use strict';

/**
 * uses to interpolate positions
 */
class LerpManager {

    constructor() {
        this._queue = {};
    }

    getLerp(id){
        return this._queue[id];
    }

    /**
     * queues a lerp operation to the manager,
     * the operations are processed every frame.
     * pushing another operation for an existing id will cause to override it.
     * @param objectID looks like
     *  {
     *       value: cur,
     *       start: {x: cur.position.x, y: cur.position.y},
     *       end: {x: transformation.position.x, y: transformation.position.y},
     *       type: "position",
     *       interval: Ticks.SERVER_UPDATE_INTERVAL
     *   }
     * @param label of the lerping operation
     * @param lerpOperation
     */
    push(objectID,label,lerpOperation){
        if(!objectID){
            console.log("pushLerp: no id passed!");
            return;
        }

        if(!label){
            console.log("pushLerp: no lablel for lerp was passed");
            return;
        }

        if((!lerpOperation.value && lerpOperation.value !==0)
            || (!lerpOperation.start && lerpOperation.start !==0)
            || (!lerpOperation.end && lerpOperation.end !==0)
            || (!lerpOperation.interval && lerpOperation.interval !==0)
            || !lerpOperation.type){
          console.log("pushLerp: insufficient data passed, lerp cannot be performed!",lerpOperation);
          return;
        }

        //prepare necessary values
        //lerpObject.startTime = new Date().getTime();
        lerpOperation.intervallProgress = 0;
        lerpOperation.minDiff = lerpOperation.minDiff || 0;

        // finally add the lerpObject to the queue
        if(!this._queue[objectID]){
            this._queue[objectID] = {};
        }
        this._queue[objectID][label] = lerpOperation;
    }

    /**
     * flushes the complete lerp queue
     */
    flush(){
        this._queue={};
    }

    /**
     * stops a lerping operation for an object
     * @param objectID
     */
    abortAllLerpsOfObject(objectID){
        delete this._queue[objectID];
    }

    /**
     * removes a lerping operation of an obkect
     *
     * @param objectID the object to remove the lerp operation from
     * @param label the name of the operation itself,e.b. position
     */
    abortLerp(objectID,label) {
        // if lerps for object exist, remove the label
        if(this._queue[objectID]){
            delete this._queue[objectID][label];
        }

        // if there are no more lerp operations of this object
        // delete the key
        if(Object.keys(this._queue[objectID]).length <=0){
            delete this._queue[objectID];
        }
    }


    /**
     * performs a linear interpolation.
     * if t is smaller than 0, the start value is returned
     * and vice versam if t is bigger than 1, the end value is returned.
     *
     * @param start parameter wehre the lerpt begins
     * @param end lerp to this value
     * @param t current progress of the lerp
     * @param minDiff optional- minimal difference between end and current value,
     *      if the difference start to end value is smaller than this, then the
     *      end value is returned
     * @returns {number} the lerped value
     */
    static lerpInRange(start, end, t,minDiff=0) {
        var diff = end - start;

        if(Math.abs(diff) < minDiff)
            return end;

        if(t>1) //upper boundary reached
            return end;
        if(t<0) // lower boundary reached
            return start;

        //perform lerp
        return start + (diff * t);
    }

    update(delta){
        // convert timestep back to time, since last frame
        var deltaTime = delta*1000;

        for(var objectID in this._queue){
            if(!this._queue.hasOwnProperty(objectID)) continue;
            var objectLerps = this._queue[objectID];

            for(var label in objectLerps) {
                if (!objectLerps.hasOwnProperty(label)) continue;
                var cur = objectLerps[label];

                if(cur.beforeUpdate){
                    cur.beforeUpdate(cur);
                }

                cur.intervallProgress += deltaTime;
                var percent = cur.intervallProgress / cur.interval;

                // perform the lerp
                switch (cur.type) {
                    case "position":
                        var val = cur.value;
                        val.x = LerpManager.lerpInRange(cur.start.x, cur.end.x, percent, cur.minDiff);
                        val.y = LerpManager.lerpInRange(cur.start.y, cur.end.y, percent, cur.minDiff);
                        break;
                    case "value":
                        cur.value = LerpManager.lerpInRange(cur.start, cur.end, percent, cur.minDiff);
                        break;
                    default:
                        break;
                }

                // if lerp has reached end, prevent from further processing
                // by deleting it from the queue

                if(cur.afterUpdate){
                    cur.afterUpdate(cur);
                }

                if(percent >=1 || cur.aborted){
                    this.abortLerp(objectID,label);
                    // fire on finished event
                    if(cur.onFinished){
                        cur.onFinished({lerpTask:cur,wasAborted:cur.aborted});
                    }
                }
            }
        }
    }
}

module.exports = LerpManager;