import Ember from 'ember';

/**
 * Creates wrapper for filter elements,
 * gives them controll buttons.
 */
var FilterToolComponent = Ember.Component.extend({
    toolName: 'FilterTool',
    tagName: 'form',
    classNames: ['tool', 'filter-tool'],
    layoutName: 'components/filter-tool',

    canRestore: true,

    /**
     * Orientation of the button tooltips
     */
    tooltipOrientation: function() {
        return this.get('controlsAtBottom') ? 'top' : 'left';
    }.property('controlsAtBottom'),

    /**
     * Class for content wrapper, based on control button orientation
     */
    toolContentClass: function() {
        var cssClass = 'tool-content';
        return this.get('controlsAtBottom') ? cssClass + ' has-controls-down' : cssClass;
    }.property('controlsAtBottom'),

    savedQueriesWithName: Ember.computed.filter('savedQueries', function(query) {
        var name = query.get('name');
        return name && name !== '';
    }),

    init: function() {
        this._super();

        this.set('component', this);
    },

    actions: {
        /**
         * Action for applying the filter
         */
        apply: function() {
            this.sendAction('apply');
        },

        /**
         * Action to restoring filter
         */
        restore: function() {
            this.sendAction('restore');
        },

        /**
         * Action to store actual filter.
         */
        save: function() {
            if (Ember.isEmpty(this.get('newFilterName'))) {
                this.set('newFilterNameError', 'name can not be empty');
                return;
            }
            this.sendAction('save', this.get('newFilterName'));
        },

        /**
         * Action to load stored filter
         *
         * @param query query to load
         */
        load: function(query) {
            this.sendAction('load', query);
        }
    }
});

export default FilterToolComponent;
