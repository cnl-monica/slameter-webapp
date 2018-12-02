import Ember from 'ember';

var NotfoundRoute = Ember.Route.extend({
    beforeModel: function() {
        if (!this.session.get('isAuthenticated')) {
            // if user is not yet authenticated,  transition to
            // index route, which handles session authentication.
            this.transitionTo('/');
        } else {
            // if user is redirected here after authentication,
            // when no other route has been visited,
            // enable transition to index
            this.session.set('initialURL', '/');
        }
    },

    didTransition: function(model) {
        this.controller.set('content', model);
    },

    serialize: function(model) {
        return {path: 'notfound'};
    }
});

export default NotfoundRoute;
