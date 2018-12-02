import Ember from 'ember';

import IdsBaseModuleWithChartController from '../base-module';

var IdsUdpNavigationController = IdsBaseModuleWithChartController.extend({

    name: 'IdsUdpNavigation',

    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    callModule: "IdsUdpFloodAttack",

    actions: {
        callSectionControllerToScroll: function(){
            var sectionController = this.get('sectionController');
            sectionController.send('scrollTo', this.callModule);
        },

        showDetectMessage: function(){
            this.send('showMessage', 'Attack detected!', 'error');
        }
    },

    toolboxTemplate: 'ids/modules/ids-udp-navigation--toolbox'

});

export default IdsUdpNavigationController;
