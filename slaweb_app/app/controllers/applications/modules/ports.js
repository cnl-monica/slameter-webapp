import Ember from 'ember';

import ApplicationsBaseModuleController from 'slameter/controllers/applications/base-module';
import AsDataHelper from 'slameter/helpers/as-data';

var PortsController = ApplicationsBaseModuleController.extend({
    model: Ember.Object.create({
        default_title: 'Applications by Ports',
        title: 'Applications by Ports',
        name: 'apps_by_ports'
    }),
    init: function(){
        this._super();
    }

});

export default PortsController;
