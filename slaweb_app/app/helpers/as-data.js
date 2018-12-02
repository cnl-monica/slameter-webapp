import Ember from 'ember';

import {bytesTo} from 'slameter/lib/data-units';

/**
 * This helper converts passed value with `bytesTo` utility,
 * from *bytes* to other data unit. If no `unit` option is specified,
 * conversion will be automatic. You can also specify number of decimal
 * places to round to, with option `decimals`.
 * Value is also appended with unit it was converted to
 *
 * @param {String} value value to convert. Must contain parsable int value
 * @param {Object} options recognized options are `unit`, `decimals` and `postfix`
 * @return {String}
 */
var AsDataHelper = Ember.Handlebars.makeBoundHelper(function(value, options) {
    options = options || {};

    var parsedValue = parseInt(value),
        unit = options.hash.unit || 'auto',
        decimals = options.hash.decimals ? parseInt(options.hash.decimals) : 3,
        input_unit = options.hash.input_unit || 1,
        output;

    if(parsedValue)
        parsedValue = parsedValue * input_unit;

    if (!isNaN(parsedValue)) {
        output = bytesTo[unit](parsedValue, decimals);
    } else {
        output = value;
    }

    return Ember.isEmpty(output) ? '' : output + (options.hash.postfix || '');
});

export default AsDataHelper;
