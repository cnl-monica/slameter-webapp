import Ember from 'ember';

import AccUser from 'slameter/models/accounting/accuser';
import ToolManagerMixin from 'slameter/mixins/tool-manager';

var AccUsersController = Ember.ArrayController.extend(ToolManagerMixin, {
    accounting: true,
    accuserSelected: function() {
        var accuserID = this.get('query.id');

        return ( typeof accuserID === 'number') && accuserID !== '';
    }.property('query.id'),

    filteredContent: function() {
        var searchedInput = this.get('searchedValue'),filterByID = this.get('content');

        if (this.get('filterByID')) {
            filterByID = filterByID.filterBy('id', this.get('query.id'));
        }

        if (!searchedInput) {
            return filterByID;
        } else {
            searchedInput = searchedInput.toLowerCase();
        }

        return filterByID.filter(function(item){
            return item.get('name').toLowerCase().indexOf(searchedInput) > -1 || item.get('email').toLowerCase().indexOf(searchedInput) > -1;
        });
    }.property('searchedValue', 'content.@each', 'filterByID', 'query.id'),


    init: function() {
        this._super();
        this.set('content', AccUser.find());
        if(!this.get('accounting'))
            this.transitionToRoute({queryParams: {accuser: 'all'}});
    },

    actions: {
        deselectAccUser: function() {
            this.transitionToRoute({queryParams: {accuser: ''}});
        }
    }



});

export default AccUsersController;
