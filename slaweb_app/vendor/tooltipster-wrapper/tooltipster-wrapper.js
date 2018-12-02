/**
 * Wrapper for jQuery.tooltipster plugin.
 *
 * Tooltipster plugin, when set up with option trigger = 'click',
 * prevents bubbling of click events out of tooltip element.
 * This wrapper changes 'click' trigger to:
 *     'click' to open,
 *     'hover' to close.
 * This does not require capturing clicks on opened tooltip element.
 */

(function($) {

    var _tooltipster = $.fn.tooltipster;

    $.fn['tooltipster'] = function() {
        var jQt = _tooltipster.apply(this, arguments),
            tooltipster = jQt.data('tooltipster'),
            _showTooltipNow, customTrigger;
        if (tooltipster) {
            _showTooltipNow = tooltipster.showTooltipNow;
            customTrigger = tooltipster.options.trigger === 'click';

            tooltipster.showTooltipNow = function() {
                // before showing tooltip, set trigger to 'hover' so close event is set to that
                if (customTrigger) tooltipster.options.trigger = 'hover';
                // show the tooltip
                _showTooltipNow.apply(tooltipster, arguments);
                // return to previous value
                if (customTrigger) tooltipster.options.trigger = 'click';
            };
        }

        return jQt;
    }

}($));
