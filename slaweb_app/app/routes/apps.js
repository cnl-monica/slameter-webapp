import Ember from 'ember';

import ProtectedRouteMixin from 'slameter/mixins/protected-route';

var AppsRoute = Ember.Route.extend(ProtectedRouteMixin, {
    model: function() {
        var self = this;
        return this.store.find('app', true).then(function(model) {
            var Router = self.container.lookup('router:main').constructor;
            if (!Router.routesAreBuilt) {
                Router.buildAppRoutes(model);
            }

            return model;
        });
    },

    afterModel: function(model, transition) {
        this.controllerFor('application').set('model.apps', model);

        if (model.get('length')) {
            var firstApp = model.get('firstObject');
            if (!transition.intent.url || transition.intent.url === '/') {
                this.transitionTo(Ember.get(firstApp, 'name'));
            }
        } else {
            // TODO user has disabled access to all apps
            this.controllerFor('messenger').send('show', 'You have disabled access to all apps of SLAmeter.', 'error');
        }
    },

    /**
     * On route deactivation, remove active app
     * info from application controller
     */
    deactivate: function() {
        var transitioningTo = this.router.router.activeTransition.intent.name,
            transitioningToFirstName;

        if (!transitioningTo) {
            return;
        }

        transitioningToFirstName = transitioningTo.split('.')[0];

        // if transitioning to other app route, switch activeApp value immediately
        // else set it to null
        if (this.currentModel.findBy('name', transitioningToFirstName)) {
            this.controllerFor('application').set('activeApp', transitioningToFirstName);
        } else {
            this.controllerFor('application').set('activeApp', null);
        }
        this.controllerFor('application').set('activeSection', null);
    }

});

export default AppsRoute;
