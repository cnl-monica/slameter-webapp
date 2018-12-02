import Ember from 'ember';

import IdsBaseModuleController from '../base-module';

var IdsFinNavigationController = IdsBaseModuleController.extend({

    name: 'IdsFinNavigation',

    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    callModule: "IdsFinFloodAttack",

    actions: {
        callSectionControllerToScroll: function(){
            var sectionController = this.get('sectionController');
            sectionController.send('scrollTo', this.callModule);
        },

        showDetectMessage: function(){
            this.send('showMessage', 'Attack detected!', 'error');
        }
    },

    toolboxTemplate: 'ids/modules/ids-fin-navigation--toolbox'

});

export default IdsFinNavigationController;
