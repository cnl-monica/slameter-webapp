export default {
    name: 'store-init',

    initialize: function(container, application) {
        var store = container.lookup('controller:store');

        application.register('store:main', store, {instantiate: false, singleton: true});
        Ember.A(['controller', 'route', 'model']).forEach(function(component) {
            application.inject(component, 'store', 'store:main');
        });
    }
};
