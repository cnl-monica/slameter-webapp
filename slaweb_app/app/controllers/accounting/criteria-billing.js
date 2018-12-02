import Ember from 'ember';

import BaseSectionController from 'slameter/controllers/base-app/base-section';

var AccountingCriteriaBillingSectionController = BaseSectionController.extend({
    queryParams: [
        { accuser:'accuser' },
        { criteria:'criteria' },
        { action:'action' }
    ],

    accuser: 0,
    criteria: 0,
    action: 'list',

    /*navigation: {
        accuser: 0,
        criteria: 1,
        action: 'list'
    },*/


    sendNavigationToModules: function() {
        var navigation = {
            accuser: this.get('accuser'),
            criteria: this.get('criteria'),
            action: this.get('action')
        };

        if (Ember.isNone(navigation.accuser)) {
            delete navigation.accuser;
        }
        if (Ember.isNone(navigation.criteria) || navigation.action==='list' || navigation.criteria==='0') {
            delete navigation.criteria;
        }
        if (Ember.isNone(navigation.action) || navigation.action==='list') {
            delete navigation.action;
        }
        this.sendQueryToModules(navigation, true);

    },

     init: function() {
        this._super();

        //this.set('navigation.id', this.get('model.app.accuser.firstObject.id'));
    }
});

export default AccountingCriteriaBillingSectionController;
