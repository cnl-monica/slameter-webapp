import Ember from 'ember';

/**
 * Creates container with mCustomScrollbar jQuery plugin
 */
var CustomScrollbarComponent = Ember.Component.extend({

    init: function() {
        this._super();

        this.set('scrollbarSettings', {
            scrollInertia: 250,
            scrollButtons: {
                enable: false
            },
            advanced: {
                updateOnContentResize: true
            },
            theme: this.get('theme') || 'green'
        });
    },

    setupScrollbar: function() {
        var settings = this.get('scrollbarSettings');
        this.$().mCustomScrollbar(settings);
    }.on('didInsertElement'),

    scrollbarTeardown: function() {
        this.$().mCustomScrollbar('destroy');
    }.on('willDestroyElement')
});

export default CustomScrollbarComponent;
