import Ember from 'ember';

import ApplicationsBaseModuleController from 'slameter/controllers/applications/base-module';
import AsDataHelper from 'slameter/helpers/as-data';

var ProtocolsController = ApplicationsBaseModuleController.extend({
    model: Ember.Object.create({
        default_title: 'Applications by Transport layer Protocol',
        title: 'Applications by Transport layer Protocol',
        name: 'apps_by_protocol'
    }),
    init: function(){
        this._super();
    }

});

export default ProtocolsController;
