import Ember from 'ember';

import SidebarSectionView from './sidebar-section';

var SummaryView = Ember.CollectionView.extend({
    contentBinding: 'controller.model',

    itemViewClass: SidebarSectionView
});

export default SummaryView;
