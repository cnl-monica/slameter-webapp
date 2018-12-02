import Ember from 'ember';

export default {
    name: 'session-init',
    after: 'model-init',

    initialize: function(container, application) {
        var Session = container.lookupFactory('controller:session'),
            session = Session.current(),
            router = container.lookup('router:main');

        // register and inject session
        application.register('session:current', session, {instantiate: false, singleton: true});
        Ember.A(['controller', 'view', 'route']).forEach(function(component) {
            application.inject(component, 'session', 'session:current');
        });
    }
};
