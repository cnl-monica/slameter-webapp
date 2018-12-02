import Model from './main';
import {attr} from './main';

var Exporter = Model.extend({
    title: attr(),
    id: attr(),
    exporter_id: attr(),
    url: attr()
});

Exporter.reopenClass({
    url: '/exporters',
    primaryKey: 'id'
});

export default Exporter;