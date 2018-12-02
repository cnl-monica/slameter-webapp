import Ember from 'ember';

/**
 * View for utilbar.
 * Makes utilbar stick on top of the page, when scrolled past it's position
 */
var UtilbarView = Ember.View.extend({
    layoutName: 'utilbar-layout',

    scrollingListener: null,

    didInsertElement: function() {
        var self = this,
            $utilbar = this.$(),
            $topbar = $('.l-topbar'),
            $utilbarEmulator = $('<div>').addClass('emulator l-utilbar-emulator'),
            previousScrollTop = 0;

        this.scrollingListener = function utilbarScrolling() {
            var scrollTop = $(document).scrollTop(),
                topbarHeight = $topbar.outerHeight(),
                utilbarHeight = $utilbar.outerHeight(),
                utilbarTop = $utilbar.offset().top,
                utilbarEmulatorTop = $utilbarEmulator.offset().top;

            if (!$utilbar.hasClass("is-fixed") && scrollTop + topbarHeight > utilbarTop) {
                $utilbarEmulator.height(utilbarHeight).insertAfter($utilbar);
                $utilbar.addClass("is-fixed").css("top", topbarHeight);
                $topbar.find(".scrolled-main-nav").removeClass("is-hidden");
                $utilbar.find(".scrolled-slameter-branding").removeClass("is-hidden");
            } else if (scrollTop + topbarHeight < utilbarEmulatorTop) {
                $utilbarEmulator.detach();
                $utilbar.removeClass("is-fixed").css("top", "");
                $topbar.find(".scrolled-main-nav").addClass("is-hidden");
                $utilbar.find(".scrolled-slameter-branding").addClass("is-hidden");
            }

            // on scrolling up, match emulator elements height with emulated elements height
            if (utilbarHeight !== $utilbarEmulator.outerHeight() && previousScrollTop >= scrollTop) {
                $utilbarEmulator.height(utilbarHeight);
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

export default UtilbarView;
