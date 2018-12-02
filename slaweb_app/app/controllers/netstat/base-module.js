import Ember from 'ember';

import BaseModuleController from 'slameter/controllers/base-module';
import {apiCall} from 'slameter/lib/api-connector';

var NetstatBaseModuleController = BaseModuleController.extend({

    savedQueries: function() {
        var sectionName = this.get('sectionName');
        return this.get('content.filter_queries').filterBy('section_name', sectionName);
    }.property('content.filter_queries.@each'),

    /**
     * Initialize required values on controller creation
     */
    initialize: function() {
        var lastQueryModel = this.get('savedQueries').findBy('last');

        if (lastQueryModel) {
            this.set('inputQuery', lastQueryModel.get('query'));
        } else {
            this.set('inputQuery', {});
        }
    },

    _loadData: function(query) {
        var self = this,
            sectionName = this.get('sectionName');

        query = query || this.get('query');

        this.send('closeAllMessages');
        this.trigger('dataLoadingStarted');

        this.get('content').getData(query, sectionName).finally(function() {
            self.trigger('dataLoadingFinished');
        }).catch(function(error) {
            error = error || {};
            error.message = error.message || 'Unspecified error while loading data from server';
            self.send('showMessage', error.message, 'warning');
            throw error;
        }).then(function(data) {
            self.afterLoadData(data);
        });
    },

    afterLoadData: function(data) {
        var status = Ember.get(data, 'data.status'),
            response = Ember.get(data, 'data.response');

        this.set('inputQuery', Ember.get(data, 'used_query.query'));

        if (status === 'ok') {
            if (response && response.length === 0) {
                this.send('showMessage', 'No data to display for current filter', 'info');
            }
            this.set('data', response);

        } else if (status === 'error') {
            this.send('showMessage', response || 'Module data source returned unspecified error.', 'warning');
        } else if (status === 'unavailable') {
            this.set('isUnavailable', true);
        }
    },

    reload: function() {
        Ember.run.throttle(this, this._loadData, 'last', 500);
    }.on('reload'),

    actions: {
        applyFilter: function() {
            this.loadData();
        },

        restoreFilter: function() {
            this.restoreQuery();
        },

        saveFilter: function(name) {
            var self = this,
                query = this.get('query'),
                sectionName = self.get('sectionName'),
                queryClass = this.get('model.filter_queries.modelClass'),
                queryModel = queryClass.create({
                    query: query,
                    name: name,
                    section_name: sectionName
                });

            queryModel.save();
        },

        loadFilter: function(query) {
            this.set('inputQuery', Ember.copy(query, true));
        }
    },

    saveQuery: function() {
        this.send('saveFilter');
    },

    applyFilter: function() {
        this.send('applyFilter');
    }.on('applyFilter')
});

export default NetstatBaseModuleController;
