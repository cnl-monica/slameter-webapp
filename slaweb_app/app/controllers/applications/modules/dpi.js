import Ember from 'ember';

import ApplicationsBaseModuleController from 'slameter/controllers/applications/base-module';
import AsDataHelper from 'slameter/helpers/as-data';

var DpiController = ApplicationsBaseModuleController.extend({
    model: Ember.Object.create({
        default_title: 'Applications by Deep Packet Inspection (DPI)',
        title: 'Applications by Deep Packet Inspection (DPI)',
        name: 'apps_by_dpi'
    }),
    init: function(){
        this._super();
    }

});

export default DpiController;
