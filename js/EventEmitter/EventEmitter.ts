import { Events } from '../Constants';

interface EventSubscription {
    event: Events,
    callback: Function
}

export default class EventEmitter {

    subscriptions: EventSubscription[] = [];

    subscribe = (event: Events, callback: Function) : Function => {
        this.subscriptions.push({ event, callback });
        return () => {
            this.subscriptions = this.subscriptions.filter(subscription => subscription.callback !== callback);
        }
    }

    emit = (event: Events, ...args: any[]) => {
        this.subscriptions.forEach(subscription => {
            if (event === subscription.event) {
                subscription.callback(...args);
            }
        });
    }

}
