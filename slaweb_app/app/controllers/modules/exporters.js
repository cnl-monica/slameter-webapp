import Ember from 'ember';

import Exporter from 'slameter/models/exporter';

/**
 * Module showing a list with registered exporters.
 */
var ExportersController = Ember.Controller.extend({
    needs: ['$app/$section'],

    currentNavigation: Ember.computed.readOnly('controllers.$app/$section.navigation'),

    init: function() {
        this._super();

        this.get('controllers.$app/$section').send('deferModuleLoading');
        this.set('model', Exporter.find());

        if (this.get('model.isLoaded')) {
            Ember.run.next(Ember.run.bind(this, this.autoSelectFirstExporter));
        } else {
            this.get('model').on('didLoad', this, this.autoSelectFirstExporter);
        }
    },

    /**
     * If no exporter queryParam is set, transition to first exporter
     */
    autoSelectFirstExporter: function() {
        var currentExporterParam = Ember.get(this, 'currentNavigation.exporter_id');

        if (!currentExporterParam || currentExporterParam === -1 || currentExporterParam === 'null' || currentExporterParam === 'undefined') {  // weird...
            this.replaceRoute({queryParams: {exporter: this.get('model.firstObject.exporter_id')}});
        }
        this.get('controllers.$app/$section').send('advanceModuleLoading');
    }
});

export default ExportersController;
