import Ember from 'ember';

/**
 * View for the topbar.
 * Makes topbar stick to the top of the page when scrolled.
 */
var TopbarView = Ember.View.extend({
    scrollingListener: null,

    addTooltipToScrolledNav: function() {
        this.$('.tooltip').tooltipster();
    }.observes('apps'),

    didInsertElement: function() {
        var self = this,
            $topbar = this.$(),
            $utilbar = $('.l-utilbar'),
            $topbarEmulator = $('<div>').addClass('emulator l-topbar-emulator'),
            previousScrollTop = 0;

        this.scrollingListener = function topbarScrolling() {
            var scrollTop = $(document).scrollTop(),
                topbarHeight = $topbar.outerHeight();

            if (!$topbar.hasClass("is-fixed") && scrollTop > 0) {
                $topbarEmulator.height(topbarHeight).insertAfter($topbar);
                $topbar.one("webkitTransitionEnd oTransitionEnd msTransitionEnd transitionend", function(){
                    topbarScrolling();
                });
                $topbar.addClass("is-fixed");
            } else if (scrollTop === 0) {
                $topbarEmulator.detach();
                $topbar.removeClass("is-fixed");
            }

            // on scrolling up, match emulator elements height with emulated elements height
            if (topbarHeight !== $topbarEmulator.outerHeight() && previousScrollTop >= scrollTop) {
                $topbarEmulator.height(topbarHeight);
                $utilbar.css("top", topbarHeight);
            }

            previousScrollTop = scrollTop;
        };

        Ember.run.next(function() {
            $(window).scroll(self.scrollingListener);
            $(window).scroll();
        });
    },
    willDestroyElement: function() {
        $(window).off('scroll', this.scrollingListener);
    }
});

export default TopbarView;
