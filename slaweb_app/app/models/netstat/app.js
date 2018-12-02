import Ember from 'ember';

import Model from 'slameter/models/main';
import App from 'slameter/models/app';
import Module from 'slameter/models/module';
import {attr} from 'slameter/models/main';
import {apiCall} from 'slameter/lib/api-connector';

var FilterQuery = Model.extend({
    id: attr(),
    name: attr(),
    query: attr(),
    section_name: attr(),
    last: attr()
});
FilterQuery.reopenClass({
    primaryKey: 'id'
});


var NetstatModule = Module.extend({
    filter_names: attr(),
    filter_queries: attr(FilterQuery, {isNested: true}),

    getData: function(query, section) {
        var self = this,
            dataUrl = this.get('data_url'),
            requestMethod,
            requestData = null;

        Ember.assert('Pass section name to getData module method', section);

        if (typeof query === 'string' || typeof query === 'number') {
            dataUrl += '?query=' + query;
            dataUrl += '&section=' + section;
            requestMethod = 'GET';
        } else if (typeof query === 'object') {
            dataUrl += '?section=' + section;
            requestMethod = 'POST';
            requestData = query;
        }

        return apiCall(dataUrl, requestData, requestMethod).then(function(data) {
            self.get('filter_queries').load(data.used_query);
            return data;
        });
    }
});


var NetstatApp = App.extend({
    modules: attr(NetstatModule, {isNested: true}),
    global_filter_queries: attr(FilterQuery, {isNested: true})
});
NetstatApp.reopenClass({
    modelName: 'app'
});

export default NetstatApp;
