import Ember from 'ember';

import BaseFilterSectionComponent from './base-filter-section';

var PortFilterComponent = BaseFilterSectionComponent.extend({

    sections: [
        ['source_port', 'Sources'],
        ['destination_port', 'Destinations'],
        ['host_port', 'Nondirectional']
    ],

    providerDirTemplate: Ember.Object.extend({
        checked: false,

        setEmpty: function() {
            this.set('multiPort', []);
            this.set('type', 'range');
            this.set('startPort', null);
            this.set('endPort', null);
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

    setEmpty: function() {
        this.set('multiPort', []);
        this.set('type', 'range');
        this.set('direction', 'source_port');
        this.set('startPort', null);
        this.set('endPort', null);
    },

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

                ['direction', 'multiPort', 'startPort', 'endPort', 'type', 'checked'].forEach(function(property){
                    template.addObserver(property, self, self.mapValuesOutForProvider);
                });

                self.get('providerDirs').pushObject(template);
            });
            //this.get('providerDirs.0').checked = true;
        } else {
           ['direction', 'multiPort', 'startPort', 'endPort', 'type'].forEach(function(property){
               self.addObserver(property, self, self.mapValuesOutForClient);
           });
        }
    },

    rangeSelected: function() {
        return this.get('type') === 'range';
    }.property('type'),

    arraySelected: function() {
        return this.get('type') === 'array';
    }.property('type'),


    mapValuesIn: function() {
        var inputValue = this.get('inputValue'),
            property, type, ports, providerDir;

        this.send('clear');

        if (this.get('forProvider')) {
            for (property in inputValue) {
                if (inputValue.hasOwnProperty(property) &&
                        (property === 'source_port' || property === 'destination_port' || property === 'host_port')) {
                    type = Ember.get(inputValue, [property,'type'].join('.'));
                    ports = Ember.get(inputValue, [property, 'ports'].join('.'));

                    providerDir = this.get('providerDirs').findBy('direction', property);

                    providerDir.set('type', type);
                    providerDir.set('checked', true);

                    if (type === 'range') {
                        providerDir.set('startPort', Ember.isArray(ports) ? ports[0] : undefined);
                        providerDir.set('endPort', Ember.isArray(ports) ? ports[1] : undefined);
                    } else {
                        providerDir.set('multiPort', Ember.isArray(ports) ? Ember.copy(ports) : []);
                    }
                }
            }
        } else {
            for (property in inputValue) {
                if (inputValue.hasOwnProperty(property) &&
                        (property === 'source_port' || property === 'destination_port' || property === 'host_port')) {
                    type = Ember.get(inputValue, [property,'type'].join('.'));
                    ports = Ember.get(inputValue, [property, 'ports'].join('.'));

                    this.set('type', type);
                    this.set('direction', property);

                    if (type === 'range') {
                        this.set('startPort', Ember.isArray(ports) ? ports[0] : undefined);
                        this.set('endPort', Ember.isArray(ports) ? ports[1] : undefined);
                    } else {
                        this.set('multiPort', Ember.isArray(ports) ? Ember.copy(ports) : []);
                    }

                    break; // process only first one
                }
            }
        }

    }.observes('inputValue').on('init'),

    mapValuesOutForProvider: function() {
        var outputValue = {};

        this.get('providerDirs').forEach(function(dir) {
            if (dir.checked) {
                outputValue[dir.get('direction')] = {
                    type: dir.get('type'),
                    ports: dir.get('type') === 'range' ? [dir.get('startPort'), dir.get('endPort')] : dir.get('multiPort')
                };
            }
        });

        this.set('outputValue', outputValue);
    },

    mapValuesOutForClient: function() {
        var outputValue = {};

        outputValue[this.get('direction')] = {
            type: this.get('type'),
            ports: this.get('type') === 'range' ? [this.get('startPort'), this.get('endPort')] : this.get('multiPort')
        };

        this.set('outputValue', outputValue);
    },

    actions:  {
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
        reset: function() {
             this.set('inputValue', Ember.copy(this.get('inputValue'), true));
        }
    }
});

export default PortFilterComponent;
