import Ember from 'ember';

import ApplicationsBaseModuleController from 'slameter/controllers/applications/base-module';
import AsDataHelper from 'slameter/helpers/as-data';

var DscpClassesController = ApplicationsBaseModuleController.extend({
    model: Ember.Object.create({
        default_title: 'Applications by Dscp classes',
        title: 'Applications by Dscp classes',
        name: 'apps_by_dscp'
    }),
    init: function(){
        this._super();
    }

});

export default DscpClassesController;
