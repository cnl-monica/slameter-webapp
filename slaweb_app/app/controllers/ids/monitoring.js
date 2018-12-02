import BaseSectionController from 'slameter/controllers/base-app/base-section';
import idsData from 'slameter/lib/ids-data';

var MonitoringSectionController = BaseSectionController.extend({

    name: 'MonitoringSectionController',

    loadModules: function () {
        var self = this;{}
        idsData.init(this.get('session._authToken')).then(function () {
            self.get('model.modules').forEach(function (module) {
                var subscription = idsData.subscribe(module.controller, 'adat', {module: module.controller.name});
                module.controller.set('subscription', subscription);
            });
        });
    }.on('loadModules'),


    actions: {
        scrollTo: function(moduleName) {
            this.get("model.modules").forEach(function(m){
                if (moduleName === m.get("controller._moduleName")) {
                    //console.log("posun stranky");
                    $(window).scrollTop(m.$().offset().top -70);
                }
            });
        },

        sendInfoAboutDetectedAttackToNavigation: function(callModule){
            this.get("model.modules").forEach(function(m){
                if (callModule === m.get("controller._moduleName")) {
                    var navigationController = m.get("controller");
                    navigationController.send('showDetectMessage');
                }
            });
        }
    }

   // this.get("model.modules").forEach(function(m){console.log(m.get("controller._moduleName"))});

});

export default MonitoringSectionController;