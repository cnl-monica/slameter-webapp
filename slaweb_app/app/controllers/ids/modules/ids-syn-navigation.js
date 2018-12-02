import Ember from 'ember';

import IdsBaseModuleController from '../base-module';
import IdsAttackSectionController from '../monitoring';

var IdsSynNavigationController = IdsBaseModuleController.extend({

    name: 'IdsSynNavigation',

    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    callModule: "IdsSynFloodAttack",

    actions: {
        callSectionControllerToScroll: function(){
            var sectionController = this.get('sectionController');
            sectionController.send('scrollTo', this.callModule);
        },

        showDetectMessage: function(){
            this.send('showMessage', 'Attack detected!', 'error');
        }
    },

    toolboxTemplate: 'ids/modules/ids-syn-navigation--toolbox'

});

export default IdsSynNavigationController;
