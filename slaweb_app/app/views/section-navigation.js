import Ember from 'ember';

var SectionNavigationView = Ember.CollectionView.extend({
    contentBinding: 'controller.model',

    classNamesForChildren: ['l-sidebar-section'],

    createChildView: function(viewClass, attr) {
        // The way Route#render method is implemented in Ember prevents us from
        // binding directly to childViews property of ContainerView, which would be more
        // appropriate than CollectionView for displaying different child views.
        // So we bind an array of child view instances on content property of this view
        // and here we simply return child view instance without class lookup
        // or instantiation typical for this method.

        attr.content.get('classNames').pushObjects(this.get('classNamesForChildren'));
        return attr.content;
    }
});

export default SectionNavigationView;
