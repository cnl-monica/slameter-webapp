import Ember from 'ember';

export default {
    name: 'model-init',
    after: 'store-init',

    initialize: function(container, application) {
        var Model = container.lookupFactory('model:main');
        Model.reopenClass({
            container: container
        });

        container.register('model:main', Model, {instantiate: false});
    }
};
