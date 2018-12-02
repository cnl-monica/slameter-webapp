import Model from './main';
import {attr} from './main';

var Client = Model.extend({
    id: attr(),
    email: attr(),
    name: attr(),
    exporter: attr(),
    ip_address: attr(),
    url: attr()
});

Client.reopenClass({
    url: '/clients',
    primaryKey: 'id'
});

export default Client;
