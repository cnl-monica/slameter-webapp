import Ember from 'ember';

var ToolboxButtonComponent = Ember.Component.extend({
    classNames: ['toolbox-button'],
    attributeBindings: ['title'],

    layoutName: 'toolbox-button',

    /**
     * Compute icon class for button based on passed `icon` attribute
     */
    iconClass: function(){
        return 'icon-' + this.get('icon');
    }.property('icon'),

    /**
     * Toggle state and send action on button click
     */
    click: function() {
        this.sendAction('action', this.get('toolName'));
    },

    /**
     * Initial tooltip creation
     */
    createTooltip: function() {
        this.$().tooltipster({
            updateAnimation: false,
            delay: 500
        });
    }.on('didInsertElement'),

    /**
     * Destroy tooltip prior to button element destruction
     */
    destroyTooltip: function() {
        this.$().tooltipster('destroy');
    }.on('willDestroyElement')
});

export default ToolboxButtonComponent;
