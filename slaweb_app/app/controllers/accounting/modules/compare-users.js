import Ember from 'ember';

import AccountingBaseModuleController from '../base-module';
import {apiCall} from 'slameter/lib/api-connector';
import {buildApiUrl} from 'slameter/lib/api-connector';
import {cmp_users} from 'slameter/lib/select-constraints';
import AccPlanReport from 'slameter/models/accounting/accplanreport';
import AccUsers from 'slameter/models/accounting/accuser';

var CompareUsersController = AccountingBaseModuleController.extend({
    desc: 'Named interval',
    show_calendar: false,
    show_named: true,
    show_relative: false,
    noUsersLoaded: false,
    reload: false,
    formattedData: null,
    savedData: null,
    showContent: true,
    model: Ember.Object.create({
        evaluatedData: null,
        title: 'Downloaded/Uploaded Data per Accounting Entities',
        url: '/apps/accounting/compareUsersDataVolume/'
    }),
    init: function() {
        var users = AccUsers.find();
        this.set('users', users);
        var self = this;
        this._super();
        this.evaluateGraph(this.formattedData,false);
    },
    evaluateGraph: function(formattedData,reload) {
        this.set('formIsActive',false);
        var self = this;

        if (this.get('savedData')!=null) {
           this.send('closeAllMessages');
           this.trigger('dataLoadingStarted');
           var savedData = this.get('savedData');
           self.setProperties(
                        {   'model.title': 'Downloaded/Uploaded Data per Accounting Entities for period From ' +
                            savedData.time_from + ' To ' + savedData.time_to,
                            'time_from': savedData.time_from,
                            'time_to': savedData.time_to
                        }
           );
           self.set('data',
                        [
                            savedData.downData,
                            savedData.upData
                        ]
           );


            self.trigger('dataLoadingFinished');

        }
        else {

                this.send('closeAllMessages');
                this.trigger('dataLoadingStarted');
                var request = null;

                //if ((typeof reload === 'boolean' && reload == true) || (formattedData != null && formattedData.hasOwnProperty('time_from'))) {
                if ((typeof reload === 'boolean' && reload === true) || (formattedData !== null)) {
                    request = formattedData;
                }

                this.getEvaluatedData(this.model.url, request).finally(function () {
                }).catch(function (error) {
                    error = error || {};
                    error.message = error.message || 'Unspecified error while loading data from server';
                    self.send('showMessage', error.message, 'warning');
                    self.set('users', null);
                    self.trigger('dataLoadingFinished');
                    throw error;
                }).then(function (data) {
                    self.afterLoadingData(data);

                    var response = self.model.evaluatedData;
                    if(response.error){
                        self.set('noUsersLoaded', true);
                        self.set('users', null);
                        self.send('showMessage', response.message, 'warning');
                    }

                    else {
                        if(response.no_users){
                            self.set('noUsersLoaded', true);
                            self.set('users', null);
                            self.send('showMessage', response.message, 'info');
                        }
                        else {
                            self.setProperties(
                                {
                                    'model.title': 'Downloaded/Uploaded Data per Accounting Entities for period From ' +
                                    response.time_from + ' To ' + response.time_to,
                                    'time_from': response.time_from,
                                    'time_to': response.time_to,
                                    'noUsersLoaded': false
                                }
                            );
                            self.set('data',
                                [
                                    response.downData,
                                    response.upData
                                ]
                            );
                            self.set('savedData', response);
                        }
                    }

                    self.trigger('dataLoadingFinished');
                });


        }
    },

    afterLoadingData: function(data) {
        var status = data.status,
            response = data.data;

        if (status === 'ok') {
            if (response && response.length === 0) {
                this.send('showMessage', 'No data to display', 'info');
            }
            this.set('evaluatedData', response);
        } else if (status === 'error') {
            this.send('showMessage', response || 'Module data source returned unspecified error.', 'warning');
        } else if (status === 'unavailable') {
            this.set('isUnavailable', true);
        }
    },

    getEvaluatedData: function(dataUrl,query) {
        var self = this,
            requestMethod,
            requestData = null;
        if (typeof query === 'string' || typeof query === 'number'||query===null) {
            requestMethod = 'GET';
        } else if (typeof query === 'object') {
            requestMethod = 'POST';
            requestData = query;
        }
        return apiCall(dataUrl, requestData, requestMethod).then(function(data) {
            return data;
        });
    },

    actions: {

        show_module: function () {
            if (this.showContent === true) {
                this.set('showContent', false);
            }
            else {
                this.set('showContent', true);
            }

        }.on('expand'),

        reload: function () {
            this.set('savedData', null);
            if (this.formattedData !== null)
                this.evaluateGraph(this.formattedData, true);
            else
                this.evaluateGraph(null, false);
        }.on('reload'),

        toggleForm: function () {
            this.setProperties(
                {'formIsActive': true}
            );

        }.on('toggleForm'),

        recompute: function(){
         if(this.validateFormData()){
             this.set('savedData', null);
             this.formattedData = this.formatData();
             this.evaluateGraph(this.formattedData,false);

         }
         }.on('recompute'),

         cancel: function(){
             this.set('formIsActive',false);
             this.clearValidationMessages();
             this.clearFormData();
         }.on('cancel')

    },




    formatData : function(){
        var data = null;
        switch(this.get('currentCalcType')) {
        case 'named':
            data = {"interval_type": 'named',
                    "interval_value":this.get('currentNamedSelect')
            };
            break;
        case 'relative':
            data = {"interval_type": 'relative',
                    "interval_value": this.get('currentRelativeSelect'),
                    "interval_second_value": this.get('currentRelativeValue')
            };
            break;
        default:
            data = {"interval_type": 'absolete',
                        "time_from": this.get('startTime'),
                        "time_to": this.get('endTime')
            };

    }


    return data;
    },


    validateFormData: function(){
        this.clearValidationMessages();
        var start = this.get('startTime');
        var end = this.get('endTime');
        if (this.get('currentCalcType')==='absolete' && ( start===undefined||end===undefined||start.toString().trim().length===0 || end.toString().trim().length===0 ) ){
            this.setProperties(
                {
                    'fieldsError': true,
                    'errorMessage':'Datetime fields are empty !'
                }
            );
            return false;
        }

        return true;
    },
    clearFormData: function(){
          this.setProperties({
                'startTime': '','endTime': ''
          }
                 );
          this.clearValidationMessages();
    },

    clearValidationMessages: function(){
          this.setProperties({
                'fieldsError': false,
                'errorMessage': ''
                }
        );

    },

    currentCalcType:  'named',
    currentNamedSelect:  'last_hour',
    currentRelativeSelect: 'hours',
    currentRelativeValue: 1,
    calcTypeSelect: cmp_users['calcTypeSelect'],
    namedSelect: cmp_users['namedSelect'],
    relativeSelect: cmp_users['relativeSelect'],
    /*
    calcTypeSelect: [
        {val:'named', label: 'Named Time Period'},
        {val:'relative', label: 'Relative Time Period'},
        {val:'absolete', label: 'Absolete Time Period'}
    ],

    namedSelect: [
        {val:'last_hour', label: 'Last Hour'},
        {val:'last_day', label: 'Last Day'},
        {val:'today', label: 'Today'},
        {val:'last_month', label: 'Last Month'},
        {val:'last3m', label:'Last 3 Months'}
    ],

    relativeSelect: [
        {val:'hours', label: 'Hours'},
        {val:'days', label: 'Days'},
        {val:'months', label: 'Months'}
    ],
    */
    calc_type_method: function(){
        if (this.get('currentCalcType')==='relative'){
            this.setProperties({
                'show_relative': true,
                'show_named': false,
                'show_calendar': false
                }
        );

        }
        else{
            if(this.get('currentCalcType')==='absolete'){
                this.setProperties({
                        'show_relative': false,
                        'show_named': false,
                        'show_calendar': true
                        }
                );
            }
            else{
                this.setProperties({
                        'show_relative': false,
                        'show_named': true,
                        'show_calendar': false
                        }
                );

            }

        }
    }.observes('currentCalcType')


});



export default CompareUsersController;


