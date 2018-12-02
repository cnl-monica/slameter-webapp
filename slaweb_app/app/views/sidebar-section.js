import Ember from 'ember';

var SidebarSectionView = Ember.ContainerView.extend({
    classNames: ['l-sidebar-box-section'],

    childViewsBinding: 'content'
});

export default SidebarSectionView;
