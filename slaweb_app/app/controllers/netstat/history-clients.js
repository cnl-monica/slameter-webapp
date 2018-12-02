import Ember from 'ember';

import NetstatHistoryBaseSectionController from './history-base-section';

/**
 * Section for `provider` users, where they can view
 * historical statistics for specific client IP address
 */
var NetstatAppSectionController = NetstatHistoryBaseSectionController.extend({
    queryParams: [
        { exporter: 'exporter' },
        { client: 'client'},
        { time: 'time' } ,
        { ips: 'ips' },
        { ports: 'ports' }
    ],

    exporter: -1,
    client: '',
    time:[],
    ips:{},
    ports:{},

    paramGlobalQuery: {
        timeBinding: 'NetstatAppSectionController.time',
        ipsBinding: 'NetstatAppSectionController.ips',
        portsBinding: 'NetstatAppSectionController.ports'
    },

    _emptyParams: {exporter: -1, client: '', time: [], ips: {}, ports: {}},

    filterIsOpened: false,

    sendNavigationToModules: function() {
        var navigation = {
            exporter_id: this.get('exporter'),
            client_ip: this.get('client')
        };

        if (Ember.isNone(navigation.client_ip)) {
            delete navigation.client_ip;
        }
        if (navigation.client_ip === '') {
            navigation.client_ip = null;
        }
        if (navigation.exporter_id === -1) {
            delete navigation.exporter_id;
        }

        this.sendQueryToModules(navigation, true);
    },

    toolboxTemplate: 'netstat/history--toolbox',
    toolsTemplate: 'netstat/history--tools'
});

export default NetstatAppSectionController;
