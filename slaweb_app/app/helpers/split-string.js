import Ember from 'ember';

var SplitStringHelper = Ember.Handlebars.makeBoundHelper(function(value, options) {
    options = options || {};
    var splitter = options.hash.splitter ,
        output = '';
    if (value === undefined || value===null)
        return;
    if(splitter === undefined || splitter === null)
        return;
    var res = value.split(splitter);

    for (var prop in res) {
        if( res.hasOwnProperty( prop ) && prop!=='' ) {
                output = output + '<div>' + res[prop] + '</div>';
          }
    }


    return new Ember.Handlebars.SafeString(output);
});

export default SplitStringHelper;
