import Ember from 'ember';

var ShowHideTable = Ember.Component.extend({
    isVisible: false,

    toggle: function(){
        this.toggleProperty('isVisible');
    }

});

export default ShowHideTable;
