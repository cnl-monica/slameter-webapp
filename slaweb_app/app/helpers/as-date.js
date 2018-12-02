import Ember from 'ember';

var AsDate = Ember.Handlebars.makeBoundHelper(function(value, options) {
    options = options || {};

    return moment(value).format(options.format || 'MMMM Do YYYY, h:mm:ss a');

});

export default AsDate;
