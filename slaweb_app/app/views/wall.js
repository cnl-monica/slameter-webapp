import Ember from 'ember';

import BrickView from './brick';

import config from 'slameter/config/environment';

var WallView = Ember.CollectionView.extend(Ember.Evented, {
    // class names added to view element
    classNames: ['l-wall'],

    itemViewClass: BrickView,

    //jquery selector for bricks
    brickSelector: '.l-brick',

    contentBinding: 'controller.model',

    layouts: config.APP.BRICKLAYOUTS['default'],

    initialize: function() {
        Ember.run.scheduleOnce('afterRender', this, this.makeBrickLayout);
    }.on('didInsertElement', 'brickInserted'),

    makeBrickLayout: function() {
        var self = this,
            $view = this.$(),
            brickSelector = this.get('brickSelector'),
            layouts = this.get('layouts');

        if ($view) {
            if ($view.data('brickLayout')) {
                $view.brickLayout('destroy');
            }
            $view.brickLayout({
                brickSelector: brickSelector,
                layouts: layouts,
                callbacks: {
                    onLayoutChange: function(layoutName, layoutConfig) {
                        self.trigger('wallLayoutChanged', layoutName, layoutConfig);
                    }
                }
            });
        }
    },

    /**
     * Trigger event on all modules in wall when layout changes
     */
    triggerLayoutChangeOnModules: function(layoutName, layoutConfig) {
        this.get('childViews').forEach(function(brickView){
            brickView.get('childViews').forEach(function(moduleView) {
                moduleView.get('controller').trigger('wallLayoutChanged', layoutName, layoutConfig, brickView);
            });
        });
    }.on('wallLayoutChanged'),

    shutdown: function() {
        this.$().brickLayout('destroy');
    }.on('willDestroyElement')
});

export default WallView;
