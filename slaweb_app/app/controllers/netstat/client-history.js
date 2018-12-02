import Ember from 'ember';

import NetstatHistoryController from './history';

/**
 * Section with history modules available for `client` users
 */
var ClientHistoryController = NetstatHistoryController.extend({
    queryParams: [
        { time: 'time' } ,
        { ips: 'ips' },
        { ports: 'ports' }
    ],

    // Ember uses type of default value for automatic deserialization
    time:[],
    ips:{},
    ports:{},

    paramGlobalQuery: {
        timeBinding: 'NetstatAppSectionController.time',
        ipsBinding: 'NetstatAppSectionController.ips',
        portsBinding: 'NetstatAppSectionController.ports'
    },
    navigation: null,
    _emptyParams: {time: [], ips: {}, ports: {}},

    sendNavigationToModules: Ember.K
});

export default ClientHistoryController;
