/**
 * Creates list of items for navigational modules. It supports scrolling
 * with customScrollbar while it makes active item always visible.
 */
import CustomScrollbarComponent from './custom-scrollbar';

var PinnableNavlistComponent = CustomScrollbarComponent.extend({
    tagName: 'ul',
    classNames: ['navlist'],

    activeClass: 'is-active',
    listItemClass: 'navlist-item',
    pinItem: true,

    pinnedScrolling: function(container){
        var element = '.' + this.get('listItemClass'),
            activeClass = this.get('activeClass'),
            activeElement,
            pinnedElement,
            isPinned = 0,  // 0 = no, 1 = to top, 2 = to bottom
            removePinned = function(){
                isPinned = 0;
                pinnedElement.remove();
                pinnedElement = null;
            };

        container.find(element).on('click.pinscroll', function(){
            if (pinnedElement && !pinnedElement.hasClass(activeClass)) {
                removePinned();
            }
        });

        return {
            onScrollStart: function(){
                activeElement = container.find(element + "." +activeClass).first();
            },
            whileScrolling: function(event){
                var eventTop = event.top*(-1);
                if ($(activeElement).length) {
                    if (isPinned === 0 && activeElement.position().top <= eventTop){
                        isPinned = 1;
                        pinnedElement = activeElement.clone().insertAfter(activeElement).addClass("is-pinned-to-top");
                    } else if (isPinned === 1 && pinnedElement && activeElement.position().top > eventTop) {
                        removePinned();
                    } else if (isPinned === 0 && !pinnedElement &&
                            (activeElement.position().top+activeElement.outerHeight()-container.outerHeight()) >= eventTop) {
                        isPinned = 2;
                        pinnedElement = activeElement.clone().insertAfter(activeElement).addClass("is-pinned-to-bottom");
                    }
                    if (isPinned === 2 && pinnedElement &&
                            (activeElement.position().top+activeElement.outerHeight()-container.outerHeight()) < eventTop) {
                        removePinned();
                    }
                }
                if (isPinned) {
                    if (isPinned === 1) {
                        pinnedElement.css({top: event.top*(-1)});
                    } else if (isPinned === 2) {
                        pinnedElement.css({top: event.top*(-1)+container.outerHeight()-pinnedElement.outerHeight()});
                    }
                }
            }
        };
    },

    setupScrollbar: function() {
        this.set('scrollbarSettings.callbacks', this.get('pinItem') ? this.pinnedScrolling(this.$()) : null);
        this._super();
    }.on('didInsertElement'),

    scrollbarTeardown: function() {
        this.$().find('.' + this.get('listItemClass')).off('click.pinscroll');
        this._super();
    }.on('willDestroyElement')
});

export default PinnableNavlistComponent;