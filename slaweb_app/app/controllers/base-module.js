import Ember from 'ember';

import ToolManagerMixin from 'slameter/mixins/tool-manager';
import AutoModuleTemplatesMixin from 'slameter/mixins/auto-module-templates';

/**
 * Controller for base module.
 * Defines common things module will need.
 */
var BaseModuleController = Ember.ObjectController.extend(Ember.Evented, ToolManagerMixin, AutoModuleTemplatesMixin, {

    /**
     * Module data
     *
     * @property {object} data
     */
    data: null,

    /**
     * Name of the section the module is in
     *
     * @property sectionName
     */
    sectionName: null,

    /**
     * Name of the outlet of the section the module is in
     *
     * @property
     */
    outletName: null,

    /**
     * Indicates whether this module allows query to be set from the controller
     * Navigation params from URL are accepted regardless of this value
     *
     * @property {boolean} acceptsGlobalQueries
     */
    acceptsGlobalQueries: true,

    /**
     * When module is in brick, this is set to an array of sizes this module has
     * in different brick layouts
     *
     * @property {array} sizesInBrick
     */
    sizesInBrick: null,

    /**
     * reference to the parent brick view, if module is in brick
     *
     * @property {BrickView} brickView
     */
    brickView: null,

    /**
     * If true, module was expanded to all columns in layout
     *
     * @property expandedInWall
     */
    expandedInWall: false,

    /**
     * Detects whether module can be expanded in wall section.
     *
     * @property canBeExpandedInWall
     */
    canBeExpandedInWall: false,

    /**
     * Observes changes on input query and sets the current query to it's value.
     *
     * @method inputQueryChanged
     */
    inputQueryChanged: function() {
        this.set('query', Ember.copy(this.get('inputQuery'), true));
    }.observes('inputQuery'),

    /**
     * Hook to initialize variables
     *
     * @method initializeVars
     * @public
     */
    initializeVars: function() {
        this.set('inputQuery', {});
        this.set('query', {});

        // place for module messages
        this.set('messages',Ember.A([]));
    },

    /**
     * This method runs after `init` method
     *
     * @method initialize
     */
    initialize: function() {
        this.loadData();
    },

    /**
     * Ember init method
     *
     * @method init
     */
    init: function() {
        this.initializeVars();
        this._super();
        this.initialize();
    },

    /**
     * Public api for data loading.
     *
     * @method loadData
     * @public
     */
    loadData: function() {
        Ember.run.throttle(this, this._loadData, 500);
    },

    /**
     * Actual method for data loading, needs to be implemented on subclass.
     *
     * @method _loadData
     * @private
     */
    _loadData: Ember.K,

    saveQuery: Ember.K,

    /**
     * Restores query to its last retrieved state by re-settings `inputQuery`,
     * This will notify observers.
     */
    restoreQuery: function() {
        this.set('inputQuery', Ember.copy(this.get('inputQuery'), true));
    },

    actions: {
        /**
         * Shows message in module messenger
         * @param {string} message message to display
         * @param {string} type type of the message
         * @param {number} timeout timeout for message removal
         */
        showMessage: function(message, type, timeout) {
            this.get('messages').pushObject({message: message, type: type, timeout: timeout});
        },

        /**
         * Close all messenger messages.
         */
        closeAllMessages: function() {
            var messageCount = this.get('messages.length');

            while (messageCount>0) {
                this.get('messages').popObject();
                messageCount = messageCount - 1;
            }
        },

        /**
         * Restore query.
         */
        restoreQuery: function() {
            return this.restoreQuery();
        },

        /**
         * Action to trigger reload event, which should be implemented by subclass.
         */
        reload: function() {
            this.trigger('reload');
        },

        /**
         * If module is in wall and can be expanded, expands module.
         */
        expandInWall: function() {
            if(this.get('canBeExpandedInWall')) {
                this.get('brickView').expandBrick(this.get('expandedInWall'));
            }
        }
    },

    /**
     * When loading data, you could trigger `dataLoadingStarted` event on this controller
     * and this method will set `isLoading` variable to true, which is bound to
     * `{{module-loading-overlay}}` component in `base-module-layout` template, that will
     * show nice `loading` overlay over the module content.
     */
    whenDataLoadingStarts: function() {
        this.set('isLoading', true);
        this.set('isUnavailable', false);
    }.on('dataLoadingStarted'),

    /**
     * When data loading finishes, you may trigger 'dataLoadingFinished' event on this controller
     * and module 'loading' overlay, bound to 'isLoading' variable value by
     * `{{module-loading-overlay}}` component will be hidden.
     */
    whenDataLoadingEnds: function() {
        this.set('isLoading', false);
    }.on('dataLoadingFinished'),

    /**
     * Event for wall layout change.
     * Used only in modules placed in wall section.
     * This event will not be fired on other modules.
     *
     * @method wallLayoutChanged
     */
    wallLayoutChanged: function(layoutName, layoutConfig, brickView) {
        var sizesInBrick = this.get('sizesInBrick'),
            li, lName, lSize = layoutConfig.defaultBrickColSpan;

        this.set('brickView', brickView);

        if (!sizesInBrick) {
            // module not in brick
            this.set('canBeExpandedInWall', false);
            return;
        }

        for (li=0; li<sizesInBrick.length; li++) {
            lName = sizesInBrick[li].split('-')[0];
            if (lName === layoutName) {
                lSize = parseInt(sizesInBrick[li].split('-')[1]);
                if (isNaN(lSize)) {
                    this.set('canBeExpandedInWall', false);
                    return;
                }
            }
        }

        if (lSize < layoutConfig.columnCount) {
            this.set('canBeExpandedInWall', true);
        } else {
             this.set('canBeExpandedInWall', false);
        }
    }.on('wallLayoutChanged')

});

export default BaseModuleController;
