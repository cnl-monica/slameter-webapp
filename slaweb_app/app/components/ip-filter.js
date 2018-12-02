import Ember from 'ember';

import BaseFilterSectionComponent from './base-filter-section';

/**
 * IP addresses filter
 */
var IpFilterComponent = BaseFilterSectionComponent.extend({

    /**
     * Top-most sections of the filter
     */
    sections: [
        ['source_ip', 'Sources'],
        ['destination_ip', 'Destinations'],
        ['host_ip', 'Nondirectional']
    ],

    /**
     * Holds state of different sections for
     * provider-type user (can have enabled multiple sections)
     */
    providerDirTemplate: Ember.Object.extend({
        checked: false,

        setEmpty: function() {
            this.set('multiIp', []);
            this.set('type', 'range');
            this.set('startIp', null);
            this.set('endIp', null);
        },

        init: function() {
            this.setEmpty();
            this.set('direction', null);

            this._super();
        },

        rangeSelected: function() {
            return this.get('type') === 'range';
        }.property('type'),

        arraySelected: function() {
            return this.get('type') === 'array';
        }.property('type')
    }),

    /**
     * Reset function
     */
    setEmpty: function() {
        this.set('multiIp', []);
        this.set('type', 'range');
        this.set('direction', 'source_ip');
        this.set('startIp', null);
        this.set('endIp', null);
    },

    /**
     * Initialization function
     */
    init: function() {
        var self = this;

        this.setEmpty();

        this._super();

        this.set('forProvider', this.get('user.is_staff'));

        if (this.get('forProvider')) {
            this.set('providerDirs', Ember.A([]));
            this.get('sections').forEach(function(dir) {
                var template = self.get('providerDirTemplate').create();

                template.direction = dir[0];
                template.name = dir[1];

                ['direction', 'multiIp', 'startIp', 'endIp', 'type', 'checked'].forEach(function(property){
                    template.addObserver(property, self, self.mapValuesOutForProvider);
                });

                self.get('providerDirs').pushObject(template);
            });
            //this.get('providerDirs.0').checked = true;
        } else {
           ['direction', 'multiIp', 'startIp', 'endIp', 'type'].forEach(function(property){
               self.addObserver(property, self, self.mapValuesOutForClient);
           });
        }
    },

    /**
     * True if range is selected.
     * Only for `client` user.
     *
     * @property rangeSelected
     */
    rangeSelected: function() {
        return this.get('type') === 'range';
    }.property('type'),

    /**
     * True if array is selected.
     * Only for `client` user.
     *
     * @property arraySelected
     */
    arraySelected: function() {
        return this.get('type') === 'array';
    }.property('type'),


    /**
     * Transform input value to internal format
     *
     * @method mapValuesIn
     */
    mapValuesIn: function() {
        var inputValue = this.get('inputValue'),
            property, type, ips, providerDir;

        this.send('clear');

        if (this.get('forProvider')) {
            for (property in inputValue) {
                if (inputValue.hasOwnProperty(property) &&
                        (property === 'source_ip' || property === 'destination_ip' || property === 'host_ip')) {
                    type = Ember.get(inputValue, [property,'type'].join('.'));
                    ips = Ember.get(inputValue, [property, 'ips'].join('.'));

                    providerDir = this.get('providerDirs').findBy('direction', property);

                    providerDir.set('type', type);
                    providerDir.set('checked', true);

                    if (type === 'range') {
                        providerDir.set('startIp', Ember.isArray(ips) ? ips[0] : undefined);
                        providerDir.set('endIp', Ember.isArray(ips) ? ips[1] : undefined);
                    } else {
                        providerDir.set('multiIp', Ember.isArray(ips) ? Ember.copy(ips) : []);
                    }
                }
            }
        } else {
            for (property in inputValue) {
                if (inputValue.hasOwnProperty(property) &&
                        (property === 'source_ip' || property === 'destination_ip' || property === 'host_ip')) {
                    type = Ember.get(inputValue, [property,'type'].join('.'));
                    ips = Ember.get(inputValue, [property, 'ips'].join('.'));

                    this.set('type', type);
                    this.set('direction', property);

                    if (type === 'range') {
                        this.set('startIp', Ember.isArray(ips) ? ips[0] : undefined);
                        this.set('endIp', Ember.isArray(ips) ? ips[1] : undefined);
                    } else {
                        this.set('multiIp', Ember.isArray(ips) ? Ember.copy(ips) : []);
                    }

                    break; // process only first one
                }
            }
        }

    }.observes('inputValue').on('init'),

    /**
     * Transform internal values to output for `provider`
     *
     * @method mapValuesOutForProvider
     */
    mapValuesOutForProvider: function() {
        var outputValue = {};

        this.get('providerDirs').forEach(function(dir) {
            if (dir.checked) {
                outputValue[dir.get('direction')] = {
                    type: dir.get('type'),
                    ips: dir.get('type') === 'range' ? [dir.get('startIp'), dir.get('endIp')] : dir.get('multiIp')
                };
            }
        });

        this.set('outputValue', outputValue);
    },

    /**
     * Transform internal values to output for `client`
     *
     * @method mapValuesOutForClient
     */
    mapValuesOutForClient: function() {
        var outputValue = {};

        outputValue[this.get('direction')] = {
            type: this.get('type'),
            ips: this.get('type') === 'range' ? [this.get('startIp'), this.get('endIp')] : this.get('multiIp')
        };

        this.set('outputValue', outputValue);
    },

    actions:  {
        /**
         * Clear all values
         */
        clear: function() {
            this.setEmpty();
            if (this.get('forProvider')) {
                this.get('providerDirs').forEach(function(dir) {
                    dir.setEmpty();
                    dir.set('checked', false);
                });
            }

            //this.get('providerDirs.0').set('checked', true);
            this.set('outputValue', {});
        },

        /**
         * Reset internal values to last set input values
         */
        reset: function() {
             this.set('inputValue', Ember.copy(this.get('inputValue'), true));
        }
    }
});

export default IpFilterComponent;
