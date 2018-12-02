import Model from '../main';
import {attr} from '../main';

var AccUser = Model.extend({
    id: attr(),
    phone : attr(),
    mobile: attr(),
    ip_addresses: attr(),
    mac_addresses: attr(),
    accountNo: attr(),
    email: attr(),
    url: attr(),
    organization: attr(),
    name: attr(),
    exporter: attr(),
    ip_address: attr()

});

AccUser.url = '/apps/accounting/AccUsers/';
AccUser.primaryKey = 'id';

export default AccUser;
