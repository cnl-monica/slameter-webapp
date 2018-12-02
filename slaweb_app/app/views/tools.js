import Ember from 'ember';

var ToolsView = Ember.View.extend({
    classNameBindings: ['isAnyToolOpened:is-expanded'],
    isAnyToolOpened: Ember.computed.readOnly('controller.isAnyToolOpened'),
    openedToolName: Ember.computed.alias('controller.openedToolName'),

    toggleTools: function() {
        var children = this.get('childViews'),
            openedToolName = this.get('openedToolName');

        Ember.EnumerableUtils.forEach(children, function(child) {
            var toolName = child.get('toolName');

            if (toolName && openedToolName && toolName.classify() === openedToolName.classify()) {
                child.set('isVisible', true);
            } else {
                Ember.run.later(function() {
                    child.set('isVisible', false);
                }, 1000);
            }

        });
    }.observes('openedToolName')
});

export default ToolsView;
