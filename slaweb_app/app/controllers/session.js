import Ember from 'ember';

import {apiAjax} from 'slameter/lib/api-connector';
import ajax from 'slameter/lib/ajax';
import SingletonMixin from 'slameter/mixins/singleton';
import User from 'slameter/models/user';
import Client from 'slameter/models/client';

import config from 'slameter/config/environment';

var SessionController = Ember.Controller.extend(Ember.Evented, {

    /**
     * Key for storing token in cookie
     *
     * @property _authTokenKey
     */
    _authTokenKey: 'authToken',

    _secure: null,  // store cookie as secure? (if using https)
    _expires: 365,
    _path: '/',

    /**
     * Value of the authentication token
     * @property _authToken
     */
    _authToken: null,

    /**
     * State of the authentication
     * @property isAuthenticated
     */
    isAuthenticated: Ember.computed.notEmpty('_authToken'),

    init: function() {
        var self = this;

        this.set('_secure', window.location.protocol.indexOf('https') === 0);

        // set authorization header on all ajax api requests
        Ember.$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
            if (self.shouldAuthorizeRequest(options.url)) {
                self.authorizeRequest(jqXHR);
            }
        });
    },

    /**
     * Authentication with the server.
     * @param loginData object containing username and password properties
     * @return {Promise}
     */
    authenticate: function(loginData) {
        var self = this;
        return ajax({
            url: config.APP.BASE_URLS.base + 'token-auth',
            data: JSON.stringify(loginData),
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json'
        }).then(function(data) {
            self.set('_authToken', data['token']);
        });
    },

    /**
     * Check if request to given url should be authorized in header.
     * (we want our key to be sent only to our server and nowhere else)
     *
     * @method shouldAuthorizeRequest
     *
     * @param url url to check for authorization
     * @return {boolean} authorize or not to authorize :)
     */
    shouldAuthorizeRequest: function(url) {
        return !!(this.get('isAuthenticated') && url.indexOf(config.APP.BASE_URLS.apiRoot) > -1);
    },

    /**
     * Set authorization header on XHR request
     *
     * @method authorizeRequest
     *
     * @param jqXHR jQuery XHR object
     */
    authorizeRequest: function(jqXHR) {
        jqXHR.setRequestHeader('Authorization', 'Token ' + this.get('_authToken'));
    },

    /**
     * Loads
     * @param {boolean} tryout if true, auth. load will fail silently (this only checks for available authentication)
     * @return {*}
     */
    load: function(tryout) {
        var self = this;
        if (this.get('isAuthenticated') && this.get('user')) {
            return Ember.RSVP.resolve();
        }
        this.restore();
        if (this.get('_authToken')) {
            return apiAjax('me').then(function(data) {
                var userModelClass = data.is_staff ? User : Client;

                self.set('user', userModelClass.create({}).load(data));
                Ember.run.later(self, self.watchStore, 2500);
            }, function() {
                self.invalidate();
                if (tryout) {
                    return Ember.RSVP.resolve(null);
                }
            });
        } else if (tryout) {
            // if we are only trying out session load,
            // do not reject here
            return Ember.RSVP.resolve(null);
        } else {
            return Ember.RSVP.reject();
        }
    },

    storeToken: function() {
        $.cookie(this.get('_authTokenKey'), this.get('_authToken'), {
            expires: this.get('_expires'),
            secure: this.get('_secure'),
            path: this.get('_path')
        });
    }.observesImmediately('_authToken'),

    restore: function() {
        var token = $.cookie(this.get('_authTokenKey'));
        if (token) {
            this.set('_authToken', token);
        }
    },

    invalidate: function() {
        this.set('_authToken', null);
        if (this.get('user')) {
            this.user.destroy();
        }
        this.set('user', null);
        $.removeCookie(this.get('_authTokenKey'), {
            expires: this.get('_expires'),
            secure: this.get('_secure'),
            path: this.get('_path')
        });
    },

    watchStore: function() {
        var storedAuthToken = $.cookie(this.get('_authTokenKey')),
            applicationRoute;
        if (!storedAuthToken) {
            applicationRoute = this.container.lookup('route:application');
            applicationRoute.send('logout');
        } else {
            Ember.run.later(this, this.watchStore, 2000);
        }
    },

    user: null
});

SessionController.reopenClass(SingletonMixin);


export default SessionController;
