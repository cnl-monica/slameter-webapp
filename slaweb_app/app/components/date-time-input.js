import Ember from 'ember';

/**
 * Form widget for entering date and time
 */
var DateInputComponent = Ember.Component.extend({
    tagName: 'span',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    formattedTime: function(key, value) {
        var timestamp, timestampMoment;
        var format = this.get('dateFormat') + ' ' + this.get('timeFormat');

        if (value) {
            timestampMoment = moment(value, format);
            if (timestampMoment.isValid()) {
                this.set('time', timestampMoment.valueOf());
            }
        }

        timestamp = this.get('time');

        if (timestamp) {
            timestampMoment = moment(this.get('time'));
            if (moment(timestampMoment).isValid()) {
                return timestampMoment.format(format);
            }
        }

        return null;
    }.property('time')
});

export default DateInputComponent;
