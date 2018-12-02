import Model from './main';
import Module from './module';
import {attr} from './main';

var App = Model.extend({
    name: attr(),
    title: attr(),
    config: attr(),
    modules: attr(Module, {isNested: true})
});

App.reopenClass({
    modelName: 'app',
    url: '/apps',
    primaryKey: 'name',

    _enableClassByAppLookup: true,

    _lookupClass: function(data) {
        var modelFactory = this.getContainer().lookupFactory('model:' + data.name + '.' + this.modelName);
        return modelFactory ? modelFactory : this;
    }

});

export default App;
