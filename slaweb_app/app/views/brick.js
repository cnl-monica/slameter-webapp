import Ember from 'ember';

var BrickView = Ember.ContainerView.extend({
    classNames: ['l-brick'],
    classNameBindings: ['joinedSizes'],
    childViewsBinding: 'content',
    sizes: [],
    joinedSizes: function() {
        if (Ember.isEmpty(this.get('sizes'))) {
            return '';
        }
        return 'bcs-' + this.get('sizes').join(' bcs-');
    }.property('sizes'),

    registerBrick: function() {
        this.get('parentView').trigger('brickInserted');
    }.on('didInsertElement'),

    expandBrick: function(doExpand) {
        this.get('parentView').$().brickLayout('setColSpanToBrick', this.$(), doExpand ? 'max' : null);
    },

    toStringExtension: function() {
        return 'BrickView';
    }

});

export default BrickView;
