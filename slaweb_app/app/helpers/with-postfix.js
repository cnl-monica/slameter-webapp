import Ember from 'ember';

var WithPostfixHelper = Ember.Handlebars.makeBoundHelper(function(value, options) {
    options = options || {};

    var output = parseInt(value);

    if (isNaN(output)) {
        output = value;
    }

    return Ember.isEmpty(output) ? '' : output + (options.hash.postfix || '');
});

export default WithPostfixHelper;
