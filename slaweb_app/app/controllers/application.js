import Ember from 'ember';

/**
 * @module /slameter/controllers/application
 */

/**
 * Top-level application controller.
 * Its content is set in application route with site config
 * and in apps route with list of apps available for logged-in user.
 */
var ApplicationController = Ember.ObjectController.extend({
    /**
     * @property {Ember.Object} model
     */
    model: Ember.Object.create({}),

    /**
     * Name of the app the user is viewing
     * @property activeApp
     */
    activeApp: null,

    /**
     * Name of the section in activeApp the user is viewing
     * @property activeSection
     */
    activeSection: null,

    /**
     * Serves to set css class with left margin, to make space
     * for left sidebar if it contains modules
     * @property {boolean} hasLeftSidebar
     */
    hasLeftSidebar: true,

    /**
     * Serves to set css class with right margin, to make space
     * for right sidebar if it contains modules
     * @property {boolean} hasRightSidebar
     */
    hasRightSidebar: true
});

export default ApplicationController;
