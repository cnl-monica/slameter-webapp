import Ember from 'ember';

import BaseSectionController from 'slameter/controllers/base-app/base-section';

/**
 * Base section for history modules in Netstat app.
 * This is not used directly, only as base class.
 */
var NetstatHistoryBaseSectionController = BaseSectionController.extend({

    /**
     * Sets up observers for query params changes
     *
     * @method setupObervers
      */
    setupObservers: function() {
        this.one('queryParamsChanged', this, this.initQueryChange);
        this.on('queryParamsChanged', this, this.observeParamQuery);
    }.on('init'),

    /**
     * List of queries saved on section
     *
     * @property sectionQueries
     */
    sectionQueries: function() {
        return this.get('model.app.global_filter_queries').filterBy('section_name', this.get('sectionName'));
    }.property('model.app.global_filter_queries.@each'),

    /**
     * Initial query change
     *
     * @method initQueryChange
     * @param params queryParams
     */
    initQueryChange: function(params) {
        var isAnyParamSet = false,
            paramGlobalQuery = this.get('paramGlobalQuery');

        // check if paramGlobalQuery (serialized) is identical to the default version specified on controller
        Ember.EnumerableUtils.forEach(params, function(param) {
            var emptyParams = this.get('_emptyParams'),
                emptyVal = JSON.stringify(emptyParams[param.key]);
            if (emptyVal === '{}') {
                emptyVal = window.Base64.encode('{}');
            }

            if (param.key in emptyParams && param.value !== emptyVal) {
                isAnyParamSet = true;
            }
        }, this);

        if (!isAnyParamSet) {
            this.loadLastQuery();
        }

        this.sendQueryToModules(this.get('paramGlobalQuery'));
    },

    /**
     * Loads last used query
     * Splits it between global filter and navigation
     *
     * @method loadLastQuery
     */
    loadLastQuery: function() {
        var lastQuery = this.get('sectionQueries').findBy('last'),
            paramGlobalQuery = this.get('paramGlobalQuery'),
            navigation = this.get('navigation'),
            item;
        if (lastQuery) {
            lastQuery = lastQuery.get('query');
            // distribute items to right place
            this.beginPropertyChanges('paramGlobalQuery');
            this.beginPropertyChanges('navigation');
            for (item in lastQuery) {
               if (lastQuery.hasOwnProperty(item)) {
                   if (paramGlobalQuery && item in paramGlobalQuery) {
                       this.set('paramGlobalQuery.'+item, lastQuery[item]);
                   }
                   if (navigation && item in navigation) {
                       this.set('navigation.'+item, lastQuery[item]);
                   }
               }
            }
            this.endPropertyChanges('navigation');
            this.endPropertyChanges('paramGlobalQuery');
        }
    },

    observeParamQuery: function() {
        this.set('lastGlobalQuery', Ember.copy(this.get('paramGlobalQuery'), true));
        this.saveQuery();
    },

    /**
     * Saves query to the server
     *
     * @method saveQuery
     * @param [name] optional name of the query
     */
    saveQuery: function(name) {
        var query = this.get('paramGlobalQuery'),
            navigation = this.get('navigation'),
            sectionName = this.get('sectionName'),
            queryClass = this.get('model.app.global_filter_queries.modelClass'),
            lastQueryModel = queryClass.create({
                section_name: sectionName,
                name: name || '',
                query: Ember.merge(Ember.copy(query, true), name ? {} : navigation)
            });

        lastQueryModel.save();
    },

    actions: {
        saveGlobalQuery: function(name) {
            this.saveQuery(name);
        },

        loadGlobalQuery: function(query) {
            this.set('lastGlobalQuery', Ember.copy(query, true));
        }
    }

});

export default NetstatHistoryBaseSectionController;
