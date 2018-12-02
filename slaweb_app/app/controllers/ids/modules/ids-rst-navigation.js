import Ember from 'ember';

import IdsBaseModuleController from '../base-module';

var IdsRstNavigationController = IdsBaseModuleController.extend({

    name: 'IdsRstNavigation',

    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    callModule: "IdsRstFloodAttack",

    actions: {
        callSectionControllerToScroll: function(){
            var sectionController = this.get('sectionController');
            sectionController.send('scrollTo', this.callModule);
        },

        showDetectMessage: function(){
            this.send('showMessage', 'Attack detected!', 'error');
        }
    },

    toolboxTemplate: 'ids/modules/ids-rst-navigation--toolbox'

});

export default IdsRstNavigationController;
