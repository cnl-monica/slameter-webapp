import Ember from 'ember';

/**
 * This Base Index route for app makes immediate
 * transition to first section, if it exists.
 *
 * @class BaseAppIndexRoute
 * @extends Ember.Route
 */
var BaseAppIndexRoute = Ember.Route.extend({
    /**
     * If sections exist in app,
     * redirect to the first of them.
     *
     * @method beforeModel
     */
    beforeModel: function() {
        var activeAppName = this.controllerFor('application').get('activeApp');
        var sections = this.modelFor('apps').findBy('name', activeAppName).get('config.sections');
        if (sections && sections.length) {
            this.replaceWith(activeAppName + '.' + Ember.get(sections[0], 'name'));
        }
    }
});

export default BaseAppIndexRoute;
