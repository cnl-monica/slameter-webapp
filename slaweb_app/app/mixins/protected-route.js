import Ember from 'ember';

var ProtectedRouteMixin = Ember.Mixin.create({
    beforeModel: function(transition) {
        var self = this,
            loginController;
        if (!this.get('session.isAuthenticated')) {
            loginController = this.controllerFor('login');
            loginController.set('unfinishedTransition', transition);
            return this.session.load().catch(function() {
                self.transitionTo('login');
            }, ' transitions on session load in protected route');
        } else {
            return this.session.load();
        }
    }
});

export default ProtectedRouteMixin;

