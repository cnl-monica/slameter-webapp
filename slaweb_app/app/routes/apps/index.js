import Ember from 'ember';

var AppsIndexRoute = Ember.Route.extend({
    beforeModel: function() {
        var model = this.modelFor('apps');
        if (model.get('firstObject')) {
            this.transitionTo(model.get('firstObject.name'));
        }
    }
});

export default AppsIndexRoute;
