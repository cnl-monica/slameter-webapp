import Ember from 'ember';

/* globals io */

import {concatUrl} from 'slameter/lib/misc';
import config from 'slameter/config/environment';

function logWS() {
    if (config.APP.LOG.LOG_WEBSOCKETS) {
        Ember.Logger.info.apply(Ember.Logger, arguments);
    }
}

function errorWs() {
    if (config.APP.LOG.LOG_WEBSOCKETS) {
        Ember.Logger.error.apply(Ember.Logger, arguments);
    }
}
/**
 * Transforms WebSocket communication to more closely follow Ember style
 * with promises, rather than callbacks, where possible.
 * Also handles websocket authentication and subscription.
 */
var WebSocketController = Ember.Controller.extend({

    /**
     * SocketIO namespace to connect to.
     * Must be set prior to initialization, or passed to `initialize` method.
     */
    wsNamespace: null,

    websocketIsLive: false,

    /**
     * Options for creating socketIO connection.
     */
    socketIoOptions: {
        resource: config.APP.SOCKETIO_RESOURCE,
        'max reconnection attempts': 5
    },

    /**
     * Handles websocket initialization and authorization.
     *
     * @param {String} [wsNamespace] namespace to connect to
     * @return {Ember.RSVP.Promise}
     */
    initialize: function(wsNamespace) {
        var self = this,
            authToken = this.session.get('_authToken'),
            websocket;

        if (wsNamespace) {
            this.set('wsNamespace', wsNamespace);

        }

        Ember.assert('No namespace defined for websocket connection', this.get('wsNamespace'));

        if (this._websocket && (this._websocket.socket.connected || this._websocket.socket.connecting)) {
            this.set('websocketIsLive', true);
            return this._websocketPromise;
        }
        this.websocketIsLive = false;

        this._websocketPromise = new Ember.RSVP.Promise(function(resolve, reject) {
            var url = concatUrl(config.APP.BASE_URLS.base, self.get('wsNamespace')),
                ws = self._websocket;

            if (ws && (ws.socket.connected || ws.socket.connecting)) {
                resolve();
                return;
            }

            websocket = io.connect(url, self.get('socketIoOptions'));

            self.websocketIsLive = true;
            self._websocket = websocket;
            self._emberEvents.trigger('connected');

            websocket.on('connect', function() {
                logWS('Connection to %@ websocket was successful. Now logging in...'.fmt(self.get('wsNamespace')));
                websocket.emit('login', authToken, function(resp) {
                    if (resp === 'OK') {
                        logWS('Login to `%@` websocket was successful.'.fmt(self.get('wsNamespace')));
                        resolve();
                    }
                });
            }).on('connect_failed', function() {
                var message = 'Connection to %@ websocket failed'.fmt(self.get('wsNamespace'));
                Ember.Logger.error(message);
                self.set('websocketIsLive', false);
                self._websocket.socket.disconnect();
                reject({message: message, reason: 'connectionFailed'});
            }).on('reconnect_failed', function() {
                var message = 'Connection to %@ websocket failed'.fmt(self.get('wsNamespace'));
                Ember.Logger.error(message);
                self.set('websocketIsLive', false);
                self._websocket.socket.disconnect();
                reject({message: message, reason: 'connectionFailed'});
            }).once('error', function(errorId, error){
                if (error && error.code === 'error_login') {
                    Ember.Logger.error('User is logged in, but websocket login failed with message:', error.message);
                    reject({message: error.message, reason: 'loginFailed'});
                } else {
                    reject({message: error? error.message : 'undefined error received'});
                }
            }).on('error', Ember.run.bind(self, self._processErrors)
            ).on('disconnect', function() {
                logWS('Websocket connection `%@` was disconnected'.fmt(self.get('wsNamespace')));
                self.set('websocketIsLive', false);
                self._websocket.socket.disconnect();
            });
        });

        return this._websocketPromise;
    },

    /**
     * SocketIO emit method that plays nicely with promises.
     * So you can use .then() method instead of passing function
     * as last argument to this method.
     *
     * Example:
     * ```javascript
     * wsController.emit('myEvent', firstArg, secondArg, ...).then(function(firstArgFromServer, ...) {
     *   // code to be executed when server responds
     * });
     * ```
     * @return {Ember.RSVP.Promise}
     */
    emit: function() {
        var self = this,
            args = Array.prototype.slice.call(arguments);

        return this.initialize().then(function() {
            return new Ember.RSVP.Promise(function(resolve, reject) {
                args.push(function() {
                    if (arguments[0] === 'error') {
                        var errorId = arguments[1];
                        self._observeError(errorId, reject);
                    }
                    resolve.apply(null, arguments);
                });
                self._websocket.emit.apply(self._websocket, args);
            });
        });
    },

    /**
     * WS event listener, but enables to pass optional second argument,
     * that will became `this` in callback.
     *
     * @param eventName name of the event to listen to
     * @param [target] context of callback
     * @param callback callback to be executed when event is received
     */
    on: function(eventName, target, callback) {
        var self = this,
            bindedCallback,
            errorBindedCallback;

        if (arguments.length < 3) {
            callback = target;
            target = null;
        }

        errorBindedCallback = function() {
            callback.call(target, 'disconnected');
        };

        bindedCallback = Ember.run.bind(target, function() {
            self._websocket.removeListener('disconnect', errorBindedCallback);
            callback.apply(this, arguments);
        });

        this._callbackTrace.push([callback, bindedCallback]);

        if (this._websocket) {
            this._websocket.on('disconnect', errorBindedCallback);
            this._websocket.on(eventName, bindedCallback);
        } else {
            this._emberEvents.one('created', function(){
                self._websocket.on('disconnect', errorBindedCallback);
                self._websocket.on(eventName, bindedCallback);
            });
        }
    },

    /**
     * Cancel event listener
     * @param eventName event name to unregister
     * @param callback callback originally passed to `on` method
     */
    off: function(eventName, callback) {
        var cb = null, indexToRemove = -1;

        this._callbackTrace.forEach(function(cbTuple, index) {
            if (cbTuple[0] === callback) {
                cb = cbTuple[1];
                indexToRemove = index;
            }
        });
        if (cb && indexToRemove >= 0) {
            this._callbackTrace.removeAt(indexToRemove);
            this._websocket.removeListener(eventName, cb);
        } else {
            Ember.Logger.error('Event callback could not be removed');
        }
    },

    one: function(eventName, target, callback) {
        var self = this,
            oneCallback = function() {
                callback.apply(this, arguments);
                self.off(eventName, oneCallback);
            };

        this.on(eventName, target, oneCallback);
    },

    /**
     * Create subscription to update `object`'s property `property`.
     * `subscribe` event on server should return event name, which will be used
     * for subsequent updates and state the subscription is in.
     * Subsequent events should have single argument, that will be set as content
     * of the property of observing object.
     *
     * @param object object which `property' that will be updated
     * @param property property to update
     * @param {Array} args additional array of arguments that will be passed to `subscribe` event
     */
    subscribe: function(object, property, args) {
        var self = this,
             ret = Ember.Object.create({
                 promise: null,
                 subscriptionToken: null,
                 state: null,
                 emit: function(eventName) {
                     var args = Array.prototype.slice.call(arguments);
                     args.splice(1, 0, this.subscriptionToken);
                     return self.emit.apply(self, args);
                 }
            });

        args = args || [];
        args.unshift('subscribe');

        ret.promise =  this.emit.apply(this, args).then(function(subscriptionToken, state) {
            ret.set('subscriptionToken',subscriptionToken);
            ret.set('state', state);

            self.on(subscriptionToken, self, function(data) {
                self._setDataToObserver(object, property, data);
            });

            return ret;
        });

        return ret;
    },

    _setDataToObserver: function(object, property, data) {
        Ember.run(function() {
            Ember.set(object, property, data);
        });
    },

    /**
     * Reference to socketio websocket
     */
    _websocket: null,

    /**
     * Websocket promise
     */
    _websocketPromise: null,

    /**
     * events
     */
    _emberEvents: Ember.Object.createWithMixins(Ember.Evented),

    /**
     * errors buffer
     */
    _errors: Ember.Object.create({}),

    initCallbackTrace: function() {
        this._callbackTrace = Ember.A([]);
    }.on('init'),

    _observeError: function(errorId , rejectHandler) {
        var self = this;
        function errorObserved(_, key) {
            if (this[key]) {
                rejectHandler(this[key]);
                this.removeObserver(key, self._errors, errorObserved);
            }
        }

        this._errors.addObserver(errorId, this._errors, errorObserved);
        errorObserved.call(this._errors, null, errorId);
    },

    /**
     * Adds received error event buffer
     * @param errorId
     * @param error
     * @private
     */
    _processErrors: function(errorId, error) {
        if (error) {
            errorWs('WS error:', error.code, error.message);
        }
        this._errors.set(errorId ? errorId : '_' , error);
    }
});

export default WebSocketController;
