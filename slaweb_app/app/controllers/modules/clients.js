import Ember from 'ember';

import Client from 'slameter/models/client';
import ToolManagerMixin from 'slameter/mixins/tool-manager';

/**
 * Module showing list of registered clients.
 */
var ClientsController = Ember.ArrayController.extend(ToolManagerMixin, {
    needs: ['$app/$section'],

    sectionController: Ember.computed.alias('controllers.$app/$section'),

    currentNavigation: Ember.computed.readOnly('controllers.$app/$section.navigation'),

    /**
     * If true, only clients for active exporter are shown
     * (see filterContentByExporter method).
     * Controls checkbox in component's search tool.
     *
     * @property filterByExporter
     */
    filterByExporter: false,

    testExporterParam: function(exporterParam) {
        return !!exporterParam && exporterParam !== 'null' && exporterParam !== 'undefined' && exporterParam !== -1;
    },

    notifyNoClientsForExporter: function() {
        this.send('showMessage', 'There are no clients for selected exporter. ' +
                'Modules will not load until you select a client.', 'info');
    },

    filteredContentByExporter: function() {
        var model = this.get('model');

        if (this.get('currentNavigation.exporter_id')) {
            return model.filterBy('exporter.exporter_id', this.get('currentNavigation.exporter_id'));
        } else {
            return model;
        }
    }.property('content.@each', 'filterByExporter', 'currentNavigation.exporter_id'),

    filteredContent: function() {
        var searchedInput = this.get('searchedValue'),
            filteredByExporter = this.get('filteredContentByExporter'),
            model = this.get('filterByExporter')? filteredByExporter : this.get('model');

        if (!searchedInput) {
            return model;
        } else {
            searchedInput = searchedInput.toLowerCase();
        }

        return model.filter(function(item){
            return item.get('name').toLowerCase().indexOf(searchedInput) > -1 || item.get('email').toLowerCase().indexOf(searchedInput) > -1;
        });
    }.property('searchedValue', 'filteredContentByExporter'),

    init: function() {
        this._super();

        this.get('sectionController').send('deferModuleLoading');
        this.set('content', Client.find());

        if (this.get('model.isLoaded')) {
            Ember.run.next(Ember.run.bind(this, this.autoSelectFirstClient));
        } else {
            this.get('model').on('didLoad', this, this.autoSelectFirstClient);
        }
    },

    autoSelectFirstClient: function() {
        var currentClientParam = Ember.get(this, 'currentNavigation.client_ip'),
            currentExporterParam = Ember.get(this, 'currentNavigation.exporter_id'),
            content = this.get('filteredContentByExporter'),
            firstClient = content.get('firstObject'),
            clientIsSet = !!currentClientParam && currentClientParam !== 'null' && currentClientParam !== 'undefined',
            exporterIsSet = this.testExporterParam(currentExporterParam),
            selectedClient;

        if (!firstClient) {
            this.notifyNoClientsForExporter();
            this.replaceRoute({queryParams: {client: ''}});
            this.get('sectionController').send('dismissPendingLoads');
            return;
        }

        if (!clientIsSet && !exporterIsSet) {
            this.replaceRoute({queryParams:{
                client: firstClient.get('ip_address'),
                exporter: firstClient.get('exporter.exporter_id')
            }});
        } else if (!clientIsSet) {
            this.replaceRoute({queryParams: {client: firstClient.get('ip_address')}});
        } else if (clientIsSet && exporterIsSet) {
            selectedClient = this.get('model').findBy('ip_address', currentClientParam);
            if (selectedClient.get('exporter.exporter_id') !== currentExporterParam) {
                this.replaceRoute({queryParams: {exporter: selectedClient.get('exporter.exporter_id')}});
            }
        }

        this.get('sectionController').send('advanceModuleLoading');
    },

    /**
     * Check if selected exporter has client.
     * If no client is in query params, select first one for exporter.
     * If no client exists for exporter, show info message and do not load modules.
     */
    exporterChanged: function() {
        this.get('sectionController').send('deferModuleLoading');

        Ember.run.next(this, function() {
            var currentExporterParam = this.get('currentNavigation.exporter_id'),
                currentClientParam = this.get('currentNavigation.client_ip'),
                selectedClient = this.get('model').findBy('ip_address', currentClientParam),
                client_ip;

            if (!currentClientParam || selectedClient.get('exporter.exporter_id') !== currentExporterParam) {
                client_ip = this.get('filteredContentByExporter.firstObject.ip_address');
                if (client_ip) {
                    this.replaceRoute({queryParams: {client: client_ip || ''}});
                    this.get('sectionController').send('advanceModuleLoading');
                } else {
                    this.get('sectionController').send('dismissPendingLoads');
                    this.notifyNoClientsForExporter();
                }
            } else {
                this.get('sectionController').send('advanceModuleLoading');
            }
        });
    }.observes('currentNavigation.exporter_id')

});

export default ClientsController;
