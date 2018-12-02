import Model from './main';
import {attr} from './main';

var Module = Model.extend({
    name: attr(),
    title: attr(),
    url: attr(),
    data_url: attr()
});

Module.reopenClass({
    primaryKey: 'name',
    modelName:  'module'
});

export default Module;
