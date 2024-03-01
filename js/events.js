
class EventAlreadyExistsError extends Error {

    constructor() {
        super("An event with this name already exists!");
    }

}

class SingletonAlreadyTriggeredError extends Error {

    constructor() {
        super("This singleton was already triggered!");
    }

}


class UCEvent {

    /**@type {Map<string,UCEvent>} */
    static ALL_EVENTS = new Map();

    constructor(/**@type {string} */ name) {
        if (UCEvent.getEventByName(name)) {
            throw new EventAlreadyExistsError();
        }
        /**@type {string} */
        this.name = name;
        /**@type {Function[]} */
        this.listeners = [];

        UCEvent.ALL_EVENTS.set(this.name, this);
    }

    on(/**@type {Function} */ listener) {
        this.listeners.push(listener);
    }

    /**Returns true if the listener was found and removed. false otherwise */
    removeListener(/**@type {Function} */ listener) {
        var index = this.listeners.findIndex((func) => func == listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /** Any number of parameters can be used, those parameters will be sent over to each listener */
    emit() {
        this.listeners.forEach((listener) => {
            listener(...arguments);
        });
    }

    static getEventByName(/**@type {string} */ name) {
        return UCEvent.ALL_EVENTS.get(name);
    }

}

class UCSingleton extends UCEvent {

    constructor(/**@type {string} */ name) {
        super(name);
        /**@type {boolean} */
        this.triggered = false;
        /**@type {IArguments} */
        this.savedArguments = null;
    }

    emit() {
        if (this.triggered) {
            throw new SingletonAlreadyTriggeredError();
        }
        super.emit(...arguments);
        this.triggered = true;
        this.savedArguments = arguments;
        this.listeners = [];
    }

    on(/**@type {Function} */ listener) {
        if (this.triggered) {
            listener(...this.savedArguments);
        } else {
            super.on(listener);
        }
    }

}