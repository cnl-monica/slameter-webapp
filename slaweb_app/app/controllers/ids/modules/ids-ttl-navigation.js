import Ember from 'ember';

import IdsBaseModuleController from '../base-module';

var IdsTtlNavigationController = IdsBaseModuleController.extend({

    name: 'IdsTtlNavigation',

    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    callModule: "IdsTtlFloodAttack",

    actions: {
        callSectionControllerToScroll: function(){
            var sectionController = this.get('sectionController');
            sectionController.send('scrollTo', this.callModule);
        },

        showDetectMessage: function(){
            this.send('showMessage', 'Attack detected!', 'error');
        }
    },

    toolboxTemplate: 'ids/modules/ids-ttl-navigation--toolbox'

});

export default IdsTtlNavigationController;
