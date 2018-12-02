import Ember from 'ember';

var OnOffSwitchComponent = Ember.Component.extend({
    classNames: ['onoffswitch'],

    isOn: true,

    click: function() {
        this.toggleProperty('isOn');
        this.sendAction('action', this.get('isOn'));
    }
});

export default OnOffSwitchComponent;
