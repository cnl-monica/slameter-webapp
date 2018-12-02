import Ember from 'ember';

import IdsBaseModuleController from '../base-module';

var IdsPortNavigationController = IdsBaseModuleController.extend({

    name: 'IdsPortNavigation',

    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    callModule: "IdsPortScanAttack",

    actions: {
        callSectionControllerToScroll: function(){
            var sectionController = this.get('sectionController');
            sectionController.send('scrollTo', this.callModule);
        },

        showDetectMessage: function(){
            this.send('showMessage', 'Attack detected!', 'error');
        }
    },

    toolboxTemplate: 'ids/modules/ids-port-navigation--toolbox'

});

export default IdsPortNavigationController;
