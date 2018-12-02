import Ember from 'ember';

var AsPeriodHelper = Ember.Handlebars.makeBoundHelper(function(value, options) {
    var res = value;
    options = options || {};
    var months_output = '';
    var months = options.hash.months;
    var day = options.hash.day;
    var day_output;
    if(months===undefined&&day===undefined)
        if (res.search('1') !== -1)
            return 'Monthly';
        else
            return 'Quarterly';
    switch (day) {
            case '1':
                day_output = '1st ';
                break;
            case '2':
                day_output = '2nd ';
                break;
            case '3':
                day_output = '3rd ';
                break;
            default:
                day_output = day + 'th ';
        }
    if (res.search('1') !== -1)
        return day_output + ' in every Month';
    else{
        switch (months) {
            case '1,4,7,10':
                months_output = months_output + ' Jan, Apr, July, Oct';
                break;
            case '2,5,8,11':
                months_output = months_output + ' Feb, May, Aug, Nov';
                break;
            case '3,6,9,12':
                months_output = months_output + ' Mar, June, Sept, Dec';
                break;
        }
        return day_output + ' in ' + months_output;
    }
});

export default AsPeriodHelper;
