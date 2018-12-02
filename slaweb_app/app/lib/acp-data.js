/* globals io */
import Ember from 'ember';

import {concatUrl} from './misc';
import config from 'slameter/config/environment';

var websocket, websocketPromise;

var socketIoOptions = {
    resource: config.APP.SOCKETIO_RESOURCE
};

var subscriptions = {},
    errors = Ember.Object.create({});

function logWS(message) {
    if (config.APP.LOG.LOG_LIVE_DATA_WEBSOCKET) {
        Ember.Logger.info(message);
    }
}

function initWebSocket(authToken) {
    if (websocketPromise) {
        return websocketPromise;
    }

    websocketPromise =  new Ember.RSVP.Promise(function(resolve, reject) {
        var url = concatUrl(config.APP.BASE_URLS.base, config.APP.BASE_URLS.wsACP);

        if (websocket && (websocket.socket.connected || websocket.socket.connected)) {
            resolve();
        }

        if (!authToken) {
            var message = 'you must pass user authToken to `initWebsocket` method.';
            Ember.Logger.error(message);
            reject({message: message, reason: 'noToken'});
        }

        websocket = io.connect(url, socketIoOptions);

        websocket.on('connect', function() {
            logWS('Connection to live data websocket was successful. Now logging in...');
            websocket.emit('login', authToken, function(resp) {
                if (resp[0] === 'OK') {
                    logWS('Login to live data websocket was successful.');
                    resolve();
                }
            });
        }).on('connect_failed', function() {
            var message = 'Connection to live data websocket failed';
            Ember.Logger.error(message);
            reject({message: message, reason: 'connectionFailed'});
        }).once('error', function(errorId, error){
            if (error.code === 'error_login') {
                // this is weird case ...
                Ember.Logger.error('User is logged in, but websocket login failed with message:', error.message);
                reject({message: error.message, reason: 'loginFailed'});
            }
        }).on('error', processErrors);
    });

    return websocketPromise;
}

function observeError(errorId , rejectHandler) {
    function errorObserved(_, key) {
        if (this[key]) {
            rejectHandler(this[key]);
            this.removeObserver(key, errors, errorObserved);
        }
    }

    errors.addObserver(errorId, errors, errorObserved);
    errorObserved.call(errors, null, errorId);
}

function subscribe(object, property, options) {

    options = options || {};

    var module = options.module,
        query = options.query;

    function dataRecieved(data) {
        Ember.run(function() {
            Ember.set(object, property, data);
        });
    }

    var subscription,
        promise = new Ember.RSVP.Promise(function(resolve, reject) {
            websocket.emit('subscribe', module, function(resp) {
                var subscrToken = resp[0],
                    state = resp[1];

                if (subscriptions[subscrToken]) {
                    return;
                }

                subscription = subscriptions[subscrToken] = {
                    token: subscrToken,
                    state: state
                };

                websocket.on(subscrToken, dataRecieved);

                resolve();
            });
        });

    return {
        getState: function(){
            return subscription.state;
        },
        promise: function() {
            return promise;
        },
        pause: function() {
            websocket.emit('control', subscription.token, 'pause', function(state){
                subscription.state = state[0];
            });
        },
        resume: function() {
            websocket.emit('control', subscription.token, 'resume', function(state){
                subscription.state = state[0];
            });
        },
        unsubscribe: function() {
            websocket.emit('control', subscription.token, 'unsubscribe');
            websocket.removeListener(subscription.token, dataRecieved);
            delete subscriptions[subscription.token];
        }
    };
}

function processErrors(errorId, error) {
    Ember.Logger.error('WS error:', error.code, error.message);
    errors.set(errorId, error);

}

var acpData = {
    init: initWebSocket,
    subscribe: subscribe
};

export default acpData;
