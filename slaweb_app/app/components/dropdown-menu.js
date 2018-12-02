import Ember from 'ember';

/**
 * Container for creating dropdown menu.
 *
 * Usage:
 *  - element that should, by clicking on it, bring up the menu,
 *  should have class `dropdown-trigger`
 *  - content of the menu should be wrapped in a `view` with viewName
 *  attribute set to `dropdownContent`
 *  - both of these should be children of this component
 */
var DropdownMenuComponent = Ember.Component.extend({
    tagName: 'li',
    theme: 'dropdown-theme',
    position: 'bottom',

    prepareContentView: function() {
        var dropdownContent = this.get('dropdownContent');

        Ember.run.scheduleOnce('afterRender', function() {
            dropdownContent.removeFromParent();
        });

        this.removeObserver('dropdownContent', this, this.prepareContentView);
    }.observes('dropdownContent'),


    didInsertElement: function() {
        var $triggerElement = this.$(".dropdown-trigger").first(),
            $dropdownElement = $('<div>');

        Ember.run.next(this, function(){
            this.get('dropdownContent').appendTo($dropdownElement);
        });

        $triggerElement.tooltipster({
            theme: '.' + this.get('theme'),
            interactive: true,
            trigger: "click",
            delay: 0,
            arrow: true,
            position: this.get('position'),
            contentCloning: false,
            multiple: true,
            content: $dropdownElement
        });
    },

    willDestroyElement: function() {
        try {
            this.$(".dropdown-trigger").first().tooltipster('destroy');
        } catch (e) {
            // pass error
        }
    }

});

export default DropdownMenuComponent;
