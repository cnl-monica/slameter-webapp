import Ember from 'ember';

import BaseSectionController from 'slameter/controllers/base-app/base-section';

var ApplicationsSummaryClientsSectionController = BaseSectionController.extend({
    queryParams: [
        { accuser:'accuser' }
    ],

    accuser: 'all',

    sendNavigationToModules: function() {
        var navigation = {
            accuser: this.get('accuser')
        };

        if (Ember.isNone(navigation.accuser)) {
            delete navigation.accuser;
        }
        this.sendQueryToModules(navigation, true);

    },


     init: function() {
        this._super();
    }
});

export default ApplicationsSummaryClientsSectionController;
