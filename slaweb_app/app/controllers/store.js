import Ember from 'ember';

var StoreController = Ember.ObjectController.extend({
    find: function(modelName) {
        var modelClass = this.container.lookupFactory('model:' + modelName);
        var lastArg = arguments[arguments.length-1],
            arg = null;

        if (arguments.length > 1 && typeof lastArg === 'boolean' && lastArg === true) {
            if (arguments.length > 2) {
                arg = arguments[1];
            }
            return modelClass.fetchWitNested(arg);
        }

        return modelClass.fetch(arguments[1]);
    }
});

export default StoreController;
