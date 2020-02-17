import { Events } from '../Constants';

interface EventSubscription {
    event: Events,
    callback: Function
}

export default class EventEmitter {

    subscriptions: EventSubscription[] = [];

    /**
     * Creates a subscription that will call the given callback whenever the given event is fired.
     * Returns a function that will end the subscription when called.
     */
    subscribe = (event: Events, callback: Function) : Function => {
        this.subscriptions.push({ event, callback });
        return () => {
            this.subscriptions = this.subscriptions.filter(subscription => subscription.callback !== callback);
        }
    }

    /**
     * If there are any current subscriptions for the event being fired it will call the callbacks
     * associated with those subscriptions, passing them any additional arguments that were supplied
     * to the emit method. 
     */
    emit = (event: Events, ...args: any[]) : void => {
        this.subscriptions.forEach(subscription => {
            if (event === subscription.event) {
                subscription.callback(...args);
            }
        });
    }

}
