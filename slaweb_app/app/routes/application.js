import Ember from 'ember';

import {apiAjax} from 'slameter/lib/api-connector';
import siteConfig from 'slameter/lib/site-config';

var ApplicationRoute = Ember.Route.extend({
    /**
     * Main title token
     *
     * @property titleToken
     */
    titleToken: 'SLAmeter',

    langSk: true,

    /**
     * Construction of full page title.
     *
     * @method title
     * @param {Array} tokens
     * @returns {string} full page title
     */
    title: function(tokens) {
        return tokens.reverse().join(' | ');
    },

    /**
     * Try to load session with no rejection on failure
     * by giving `true` parameter to `load` function
     *
     * @returns {Ember.RSVP.Promise}
     */
    beforeModel: function() {
        return this.session.load(true);
    },

    /**
     * Load site config and apps.
     *
     * @returns {Ember.RSVP.Promise} promise of eventual application model
     */
    model: function(params, transition) {
        var self = this;
        return Ember.RSVP.hash({
            siteConfig: apiAjax('config'),
            apps: new Ember.RSVP.Promise(function(resolve){
                // if session was authenticated in beforeModel hook,
                // load apps data.
                if (self.session.get('isAuthenticated')) {
                    return self.store.find('app', true).then(function(model) {
                        self.container.lookup('router:main').constructor.buildAppRoutes(model);
                        return model;
                    }).then(resolve);
                }
                return resolve([]);
            })
        }).catch(function() {
            transition.send('showMessage', 'Error while trying to load data from server. ' +
                'SLAmeter web client will not work without server connection.', 'error', 1000000);
        });
    },

    /**
     * Register and inject site config on all views, so it can be
     * easily used in templates, and save it also on external object
     */
    afterModel: function(model, transition) {
        if (!model) {
            return;
        }

        this.container.register('siteConfig:main', model.siteConfig, {instantiate: false, singleton: true});
        this.container.lookup('application:main').inject('view', 'siteConfig', 'siteConfig:main');

        siteConfig.set('model', model);

        if (transition.intent && transition.intent.url) {
            this.transitionTo(transition.intent.url);
        }
    },

    actions: {

        /**
         * Logout action
         */
        logout: function() {
            this.session.invalidate();
            // perform real page reload
            // best way to clear application state after logout :)
            window.location.pathname = '/';
        },

        /**
         * Action for opening modal dialog.
         *
         * @param modalName - name of the modal controller and template
         * @param model - model to pass to modal dialog
         */
        openModal: function(modalName, model) {
            this.controllerFor(modalName).set('content', model);
            this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },

        /**
         * Action for closing modal dialog.
         */
        closeModal: function() {
            this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        },

        /**
         * Action for showing message in messenger.
         *
         * @param messageContent content of the message
         * @param [messageType] message type
         * @param [timeout]
         */
        showMessage: function(messageContent, messageType, timeout) {
            this.controllerFor('messenger').send('show', messageContent, messageType, timeout);
        },

        closeAllMessages: function() {
            this.controllerFor('messenger').send('closeAll');
        },

        setLang: function(lang){
            if(lang === "en"){
                this.controller.set('langSk', false);
            }
            if(lang === "sk"){
                this.controller.set('langSk', true);
            }
        }
    }
});

export default ApplicationRoute;
