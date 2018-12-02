import BaseModuleController from 'slameter/controllers/base-module';
import {apiCall} from 'slameter/lib/api-connector';
import AsDataHelper from 'slameter/helpers/as-data';

var ApplicationsBaseModuleController = BaseModuleController.extend({
    acceptsGlobalQueries: true,
    module_filter: true,
    model: {
        evaluatedData: null,
        title: null
    },
    init: function(){
        this._super();
        this.set('isProvider', this.get('session.user.is_staff'));
        var inputQuery = this.get('inputQuery');
        this.set('query.userId', ! this.get('isProvider') ? this.get('session.user.id'): inputQuery.accuser);
        this.set('query.name',this.get('model.name'));
    },
    name: null,
    actions: {
        applyFilter: function() {
            var inputQuery = this.get('inputQuery');
            this.set('query.userId', ! this.get('isProvider') ? this.get('session.user.id'): inputQuery.accuser);
            this.set('query.name',this.get('model.name'));
            this.loadDataFromApi();
        }
    },
    openTimeFilter: function(){
        this.set('module_filter', this.get('module_filter'));
    }.observes('openedToolName'),

    applyFilter: function() {
        if (this.get('query.userId')!==undefined) {
            this.send('applyFilter');
        }
    }.on('applyFilter'),
    reload: function() {
        this.loadDataFromApi();
    }.on('reload'),

    inputQueryChanged: function() {
        this._super();
        var inputQuery = this.get('inputQuery');
        this.set('isProvider', this.get('session.user.is_staff'));
        this.set('query.userId', ! this.get('isProvider') ? this.get('session.user.id'): inputQuery.accuser);
        this.set('query.name',this.get('model.name'));
        this.loadDataFromApi();
    }.observes('inputQuery'),

    loadDataFromApi: function() {
        var self = this,
        query = self.get('query');
        self.send('closeAllMessages');
        self.trigger('dataLoadingStarted');
        self.set('model.title',this.get('model.default_title'));
        if(query.hasOwnProperty('name')&&query.hasOwnProperty('userId')){
            self.getData('/apps/applications/basicAppModule/', query).finally(function() {
                self.trigger('dataLoadingFinished');
            }).catch(function(error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                throw error;
            }).then(function(data) {
                self.afterLoadData(data);
            });
        }
    },

    getData: function(dataUrl,query) {
        var self = this,
            requestMethod,
            requestData = null;
        if (! self.get('query').hasOwnProperty('time')) {
            dataUrl += '?userId=' + query.userId + '&';
            dataUrl += 'name=' + query.name;
            requestMethod = 'GET';
        } else if (typeof query === 'object') {
            requestMethod = 'POST';
            requestData = query;
        }
        return apiCall(dataUrl, requestData, requestMethod).then(function(data) {
            return data;
        });
    },
    /*
    $("table").delegate('td','mouseover mouseout', function(e) {
       // do stuff
    }),*/
    afterLoadData: function(data) {
        var status = data.status,
            response = data.data,
            user = '';
        if(this.get('isProvider'))
            user = this.get('inputQuery.accuser') === 'all' ? ' fol all Clients' : ' for chosen Client';
        if (status === 'ok') {
            if (response && response.length === 0) {
                this.send('showMessage', 'No data to display', 'info');
            }
            this.set('data', response);
            if (response.info)
                this.send('showMessage', response.message || 'No accounting entity in database !', 'info');
            else
                this.set('model.title', this.get('model.default_title') + ' - Period from ' + response.time_from +  ' to ' + response.time_to + user);
        } else if (status === 'error') {
            this.send('showMessage', response.message || 'Module data source returned unspecified error.', 'warning');
            this.set('data', response.data);
        }
            //this.set('model.title', this.get('model.default_title') + ' - Period from ' + response.data.time_from +  ' to ' + response.data.time_to + user);
        else if (status === 'unavailable') {
            this.set('isUnavailable', true);
            this.set('data', null);
        }
    }

});

export default ApplicationsBaseModuleController;