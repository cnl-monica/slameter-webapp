import Ember from 'ember';

/**
 * @module /slameter/controllers/base-app
 */

/**
 * Base controller for SLAmeter app with modules.
 */
var BaseAppController = Ember.ObjectController.extend({
    /**
     * List of section routes for links in utilbar.
     * @property sectionRoutes
     */
    sectionRoutes: function() {
        var self = this;
        return this.get('config.sections').map(function(section) {
            return {
                name: self.get('name') + '.' + Ember.get(section, 'name'),
                title: Ember.get(section, 'title')
            };
        });
    }.property('name', 'title', 'config')
});

export default BaseAppController;
