import Ember from 'ember';

import NetstatBaseModuleController from './base-module';

/**
 * Module with chart, has modified data setup to the format
 * required by Flot
 */
var NetstatBaseModuleWithChartController = NetstatBaseModuleController.extend({
    afterLoadData: function(data) {
        this._super(data);
        this.set('data', [
                {
                    data: Ember.get(data, 'data.response'),
                    label: this.get('chartDataLabel')
                }
        ]);
    },

    toolboxTemplate: 'netstat/modules/common-wall-module--toolbox',
    toolsTemplate: 'netstat/modules/common-wall-module--tools'
});

export default NetstatBaseModuleWithChartController;
