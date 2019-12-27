class EventEmitter {

    constructor() {
        this.subscribers = [];
    }

    subscribe(eventName, callback) {
        this.subscribers.push({
            eventName, 
            callback
        });
        return () => {
            this.subscribers = this.subscribers.filter(subscription => subscription.callback !== callback);
        }
    }

    broadcast(eventName, ...args) {
        this.subscribers.forEach(subscription => {
            if (subscription.eventName === eventName) {
                subscription.callback(...args);
            }
        });
    }
    
}

const emitter = new EventEmitter();

//export const emitter = 42;

export default emitter;