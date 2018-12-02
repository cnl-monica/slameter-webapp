import Ember from 'ember';

import App from 'slameter/models/app';

var BaseAppRoute = Ember.Route.extend({
    /**
     * Token for page title creation - title of the app.
     *
     * @param model model of the route
     * @returns {String} title of the app
     */
    titleToken: function(model) {
        return model.get('title');
    },

    computeControllerName: function() {
        // controller name must be computed manually as at this point is not yet possible
        // to use lookup with variables
        if (this.container.lookup('controller:' + this.get('routeName'))) {
            this.set('controllerName', this.get('routeName'));
        } else {
            this.set('controllerName', 'base-app');
        }
    },

    templateName: '$app',

    model: function() {
        var model = this.modelFor('apps').findBy('name', this.routeName);
        if (!model) {
            this.transitionTo('notfound', {
                message: 'Application "%@" was not found.'.fmt(this.routeName)
            });
        }
        return model;
    },

    /**
     * Sets activeApp property on application controller
     *
     * @param model
     */
    afterModel: function(model) {
        var appName = Ember.get(model, 'name');
        this.set('appName', appName);
        this.controllerFor('application').set('activeApp', appName);

        this.computeControllerName();
    },

    /**
     * This method overwrites view lookup for app route.
     * It makes sure that each route that uses same base
     * class has a separate instance of it, so that it is
     * not treated as the same view.
     *
     * @param name
     * @param options
     * @returns {*}
     */
    render: function(name, options) {
		var viewFactory = this.container.lookupFactory('view:' + this.routeName),
			baseFactory;

		if (!viewFactory) {
			baseFactory = this.container.lookupFactory('view:baseApp') || this.container.lookupFactory('view:default');
			this.container.register('view:' + this.routeName, baseFactory.extend());
		}

		return this._super.apply(this, arguments);
	}
});

export default BaseAppRoute;
