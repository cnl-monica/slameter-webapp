import Ember from 'ember';

import BrickView from './brick';

var BaseModuleView = Ember.View.extend(Ember.ActionHandler, {
    tagName: 'section',
    classNames: ['module'],
    classNameBindings: ['controller.isLoading'],

    /**
     * Template for the module layout
     */
    layoutName: function() {
        return Ember.getWithDefault(this, 'controller.layoutTemplate','base-module-layout');
    }.property(),

    sizesInBrick: [],

    setSizesInBrick: function() {
        var parentBrickView = this.nearestOfType(BrickView);
        if (parentBrickView) {
            parentBrickView.set('sizes', this.get('sizesInBrick'));
            this.set('controller.sizesInBrick', this.get('sizesInBrick'));
        }
    }.observes('sizesInBrick', 'parentView').on('init')
});

export default BaseModuleView;
