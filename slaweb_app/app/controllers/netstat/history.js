import Ember from 'ember';

import NetstatHistoryBaseSectionController from './history-base-section';

/**
 * Section for providers to view statistics for specific client connection.
 */
var NetstatAppSectionController = NetstatHistoryBaseSectionController.extend({
    queryParams: [
        { exporter: 'exporter' },
        { time: 'time' } ,
        { ips: 'ips' },
        { ports: 'ports' }
    ],

    // Ember uses type of default value for automatic deserialization
    exporter: -1,
    time:[],
    ips:{},
    ports:{},

    paramGlobalQuery: {
        timeBinding: 'NetstatAppSectionController.time',
        ipsBinding: 'NetstatAppSectionController.ips',
        portsBinding: 'NetstatAppSectionController.ports'
    },

    _emptyParams: {exporter: -1, time: [], ips: {}, ports: {}},

    filterIsOpened: false,

    sendNavigationToModules: function() {
        var navigation = {
            exporter_id: this.get('exporter')
        };

        if (navigation.exporter_id === -1) {
            delete navigation.exporter_id;
        }

        this.sendQueryToModules(navigation, true);
    }
});

export default NetstatAppSectionController;
