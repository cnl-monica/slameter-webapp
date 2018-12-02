import Ember from 'ember';

var TimepickerView = Ember.TextField.extend({

    didInsertElement: function() {
        var self = this;
        this.$().datetimepicker({
            firstDay: 1,
            changeMonth: true,
            changeYear: true,
            timeFormat: this.get('timeFormat') || 'HH:mm:ss',
            hourGrid: 1,
            minuteGrid: 5,
            secondGrid: 5,
            numberOfMonths: 2,
            showCurrentAtPos: 1,
            yearRange: "-10:+1",

            onSelect: function (dateText, datePicker) {
                // fix bug that causes strange datepicker behavior when showCurrentAtPos is set
                // see: http://stackoverflow.com/questions/16955134/jquery-ui-datepicker-weird-behavior
                datePicker.drawMonth += self.$().datepicker("option", "showCurrentAtPos");
            }

        });
    },

    willDestroyElement: function() {
        this.$().datetimepicker('destroy');
    }
});

export default TimepickerView;
