import Ember from 'ember';

/**
 * Displays overlay for loading state
 * Usage:
 * ```handlebars
 * {{loading-overlay isVisibleWhen=isLoading}}
 * ```
 */
var ModuleLoadingOverlayComponent = Ember.Component.extend({
    classNames: ['module-overlay', 'module-loading-overlay'],

    observeLoadingState: function() {
        var self = this,
            visible = this.get('isVisibleWhen'),
            currentlyVisible = this.get('currentlyVisible') || false,
            classesWhenVisible = 'is-displaying is-visible';

        if (visible && !currentlyVisible) {
            this.set('currentlyVisible', true);
            this.$().addClass('is-displaying');
            Ember.run.next(function() {
                self.$().addClass('is-visible');
            });
        } else if (currentlyVisible && !visible) {
            this.set('currentlyVisible', false);
            this.$().removeClass('is-visible');
            Ember.run.later(this, function() {
                self.$().removeClass('is-displaying');
            }, 500);
        } else if (visible) {
            this.set('currentlyVisible', true);
            this.$().addClass(classesWhenVisible);
        } else {
            this.set('currentlyVisible', false);
            this.$().removeClass(classesWhenVisible);
        }
    }.observes('isVisibleWhen').on('didInsertElement')
});

export default ModuleLoadingOverlayComponent;
