import Ember from 'ember';

/**
 * Form input element with icon
 */
var IconedFormfieldComponent = Ember.Component.extend({
    classNames: ['iconed-formfield'],

    checkType: function() {
        Ember.assert('Component iconed-formfield should not be used with type `checkbox` or `radio`.',
            this.get('type') !== 'checkbox' && this.get('type') !== 'radio');
    }.on('init'),

    iconClass: function() {
        return 'icon-' + this.get('icon');
    }.property('icon')
});

export default IconedFormfieldComponent;
