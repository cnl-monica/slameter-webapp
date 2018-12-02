import Ember from 'ember';

import BaseSectionController from 'slameter/controllers/base-app/base-section';
import acpData from 'slameter/lib/acp-data';

var RealTimeSectionController = BaseSectionController.extend({

    loadModules: function() {
        var self = this;{}
        acpData.init(this.get('session._authToken')).then(function() {
            self.get('model.modules').forEach(function(module){
                var subscription = acpData.subscribe(module.controller, 'adat', {module: module.controller.name});
                module.controller.set('subscription', subscription);
            });
        });
    }.on('loadModules')
});

export default RealTimeSectionController;
