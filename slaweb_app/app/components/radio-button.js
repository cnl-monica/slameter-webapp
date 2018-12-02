import Ember from 'ember';

/**
 * Form radio button
 */
var RadioButtonComponent = Ember.Component.extend({
    classNames: ['radio'],

    changeSelection: function() {
        var value =  this.get('value'),
            selection = this.get('selection');
        if (value === selection) {
            this.set('checked', true);
        } else {
            this.set('checked', false);
        }
    }.observes('selection').on('init'),

    changeChecked: function() {
        var value =  this.get('value'),
            selection = this.get('selection');
        if (this.get('checked')) {
            this.set('selection', value);
        }
    }.observes('checked').on('init'),

    click: function() {
        this.set('checked', true);
    }
});

export default RadioButtonComponent;
