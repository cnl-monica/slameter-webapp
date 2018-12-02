import Ember from 'ember';

import BaseFilterSectionComponent from './base-filter-section';

/**
 * Time filter.
 *
 * Static time range (type==='absolute') is represented by array of two timestamps -
 * start time and end time.
 * Relative time range is represented by array, where second value is 0 (current time)
 * and first value is negative integer representing number of milliseconds before current time.
 */
var TimeFilterComponent = BaseFilterSectionComponent.extend({
    intervalUnits: ['seconds', 'minutes', 'hours', 'days', 'months'],

    /**
     * Signalizes whether relative type of interval is selected
     * @property relativeSelected
     */
    relativeSelected: function() {
        return this.get('type') === 'relative';
    }.property('type'),

    init: function(){
        this.set('type', 'absolute');

        this._super();
    },

    /**
     * Transforms inputValue to internal format
     *
     * @method mapValuesIn
     */
    mapValuesIn: function() {
        var interval, unit, duration;

        if (Ember.isArray(this.get('inputValue')) && this.get('inputValue')[0] < 0) {
            interval = -this.get('inputValue')[0];

            this.set('type', 'relative');

            duration = moment.duration(interval);

            if (duration.as('seconds') < 60) {
                unit = 'seconds';
            } else if (duration.as('minutes') < 60) {
                unit = 'minutes';
            } else if (duration.as('hours') < 24) {
                unit = 'hours';
            } else if (duration.as('days') < 30) {
                unit = 'days';
            } else {
                unit = 'months';
            }

            this.setProperties({
                intervalUnit: unit,
                intervalValue: duration.as(unit)
            });
        } else if (Ember.isArray(this.get('inputValue')) && this.get('inputValue')[0] > 0) {
            this.setProperties({
                type: 'absolute',
                startTime: this.get('inputValue.0'),
                endTime: this.get('inputValue.1')
            });
        }
    }.observesImmediately('inputValue').on('init'),

    /**
     * Transforms internal value to output.
     *
     * @method mapValuesOut
     */
    mapValuesOut: function() {
        var interval, unit;

        if (this.get('type') === 'absolute') {
            this.set('outputValue', [this.get('startTime'), this.get('endTime')]);
        } else {
            interval = parseFloat(this.get('intervalValue'));
            unit = this.get('intervalUnit');

            if (isNaN(interval) && this.get('intervalValue') !== '') {
                this.set('intervalValue', '');
                return;
            }
            this.set('outputValue', [moment.duration().subtract(interval, unit).valueOf(), 0]);
        }

    }.observes('type', 'startTime', 'endTime', 'intervalValue', 'intervalUnit'),

    actions: {
        /**
         * Clears state of the filter
         *
         * @method clear
         */
        clear: function() {
            this.setProperties({
                type: 'absolute',
                startTime: undefined,
                endTime: undefined,
                intervalValue: '',
                intervalUnit: this.get('intervalUnits')[0],
                outputValue: null
            });
        },

        /**
         * Resets state to the last set input value
         *
         * @method reset
         */
        reset: function() {
            this.set('inputValue', Ember.copy(this.get('inputValue'), true));
        }
    }

});

export default TimeFilterComponent;
