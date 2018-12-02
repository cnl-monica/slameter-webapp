import Ember from 'ember';

import AccountingBaseModuleController from '../base-module';
import {apiCall} from 'slameter/lib/api-connector';
import {buildApiUrl} from 'slameter/lib/api-connector';
import ajax from 'slameter/lib/ajax';
import AccUser from 'slameter/models/accounting/accuser';
import {criter_eval_form} from 'slameter/lib/select-constraints';

var CriteriaEvaluationController = AccountingBaseModuleController.extend({
    pdf_buttons_enable: true,
    formattedData : null,
    reload: false,
    expanded: true,
    model: Ember.Object.create({
        evaluatedData: null,
        title: 'Criteria evaluation',
        url: '/apps/accounting/criteriaEvaluate/'
    }),
    init: function() {
        var self = this;
        this._super();
    },
    evaluate: function(formattedData,reload) {
        this.set('formIsActive',false);
        var self = this;
        self.set('model.title', 'Criteria evaluation');
        var isAdmin = this.get('session.user.is_staff');
        this.set('isAdmin', isAdmin);
        var userId = self.get('query.userId');
        try {

        if ((userId!==undefined&&userId!==0) || !isAdmin ) {
            //this.send('closeAllMessages');
            this.trigger('dataLoadingStarted');
            this.set('model.title','Criteria evaluation');
            this.send('closeAllMessages');
            var request = null;
            if( (typeof reload === 'boolean' && reload===true)||(formattedData!==null && formattedData.hasOwnProperty('userId'))){
                request = formattedData;
            }
            else {
                    request = userId;
                    self.set('model.user', AccUser.find(request));
            }
            this.getDefaultData(this.model.url, request).finally(function () {
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                self.trigger('dataLoadingFinished');
                throw error;
            }).then(function (data) {
                self.afterLoadData(data);
                if(self.model.evaluatedData.error){
                    self.send('closeAllMessages');

                    if(self.model.evaluatedData.info)
                        self.send('showMessage', self.model.evaluatedData.message, 'info');
                    else
                        self.send('showMessage', self.model.evaluatedData.message, 'warning');
                    self.set('noUsersLoaded', true);
                    self.set('model.title','Criteria evaluation');
                    self.set('model.evaluatedData.data', null);
                    self.trigger('dataLoadingFinished');
                }
                else {
                    try {
                        self.send('closeAllMessages');
                        var response = self.model.evaluatedData.data;
                        var two_tariff = response.billing_data.two_tariff;
                        self.set('two_tariff', two_tariff);

                        if (response !== undefined) {
                            if (two_tariff) {
                                self.setProperties(
                                    {
                                        'fstTimeTariff': response.invoice.hour_from + ' - ' + response.invoice.hour_to,
                                        'sndTimeTariff': response.invoice.hour_to + ' - ' + response.invoice.hour_from,
                                    }
                                );
                                self.set('data',
                                    [
                                        self.model.evaluatedData.data.strong_traffic_rate_colls,
                                        self.model.evaluatedData.data.weak_traffic_rate_colls
                                    ]
                                );
                            }
                            else {
                                self.set('data', [self.model.evaluatedData.data.colls]);
                            }

                            self.setProperties(
                                {
                                    'model.title': response.title,
                                    'billingtabledata': response.billing_data.data,
                                    'total_sum': response.billing_data.total_sum,
                                    'timeFrom': response.invoice.intervalTimeFrom,
                                    'timeTo': response.invoice.intervalTimeTo

                                }
                            );

                            if (!request.hasOwnProperty('userId')) {
                                self.set('model.user', AccUser.find(request));
                            }
                        }
                    }
                    catch (err) {
                        self.set('model.evaluatedData.data', null);
                        self.set('model.title','Criteria evaluation');
                        //self.send('showMessage', "User don't have criteria !", 'info');
                    }
                    self.trigger('dataLoadingFinished');

                }


            });

        }
        else
            {
                this.formattedData = null;
                this.send('closeAllMessages');
                this.send('showMessage', "No chosen User !", 'info');
            }

                    } catch(reason) {
                        self.trigger('dataLoadingFinished');
                        if(self.get('messageShowed')===true)
                           self.set('messageShowed', false);
                        else{
                            self.set('messageShowed', true);
                        }
        }
    }.observes('query.userId'),

    inputQueryChanged: function() {
        var inputQuery = this.get('inputQuery');
        this.set('isProvider', this.get('session.user.is_staff'));
        this.set('query.userId', ! this.get('isProvider') ? this.get('session.user.id'): inputQuery.accuser);
    }.observes('inputQuery.accuser'),

    messageShowed: false,
    afterLoadData: function(data) {
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


    getDefaultData: function(dataUrl,query) {
        var self = this,
            requestMethod,
            requestData = null;
        if (typeof query === 'string' || typeof query === 'number') {
            dataUrl += '?accUserID=' + query;
            requestMethod = 'GET';
        } else if (typeof query === 'object') {
            requestMethod = 'POST';
            requestData = query;
        }
        return apiCall(dataUrl, requestData, requestMethod).then(function(data) {
            return data;
        });
    },

    sendEmail: function(dataUrl,requestData) {
        return apiCall(dataUrl, requestData, 'POST').then(function(data) {
            return data;
        });
    },


    'fieldsError': false,
    'formIsActive': false,
    'errorMessage':'',

    actions: {

    expand: function(){
      if (this.expanded===true) {
          this.set('expanded',false);
      }
      else{
          this.set('expanded',true);
      }

    }.on('expand'),
    email_failed: false,
    email_sended: false,
    sending_started: false,
    send_bill: function(){
        this.setProperties({'sending_started': true, 'email_failed': false, 'email_sended': false});
        var self = this;
        var url_and_postData = this.prepare_data_for_invoice();
        url_and_postData['postData']['send'] = true;
        if (this.get('email_checked')===true){
            url_and_postData['postData']['to'] = this.get('email');
            this.setProperties({'email':'', 'email_checked':false});
        }
        else
            url_and_postData['postData']['to'] = this.get('model.user.email');
        url_and_postData['postData']['subject'] = "SLAmeter Bill - Criteria Evaluation method";
        url_and_postData['postData']['text'] = "Dear Customer " + this.get('model.user.name') +"\n\nFor billing network services, your company or ISP used SLAmeter tool.\nIn attachement is yours invoice for last period.\n\nBest regards\n \n\nIf you have any questions, please contact us on: ";
        url_and_postData['postData']['filename'] = 'SLAmeter_Invoice.pdf';
        this.sendEmail(url_and_postData['url'], url_and_postData['postData']).finally(function () {
            }).catch(function (error) {
                self.set('email_failed', true);
                throw error;
            }).then(function (data) {
                if(data['success']===true) {
                    self.set('email_sended', true);
                }
                else
                    self.set('email_failed', true);
            });

    },
    generate_bill: function() {
        this.set('sending_started', true);
        var url_and_postData = this.prepare_data_for_invoice();
        var options = {
            url: url_and_postData['url'],
            type: 'POST',
            data: JSON.stringify(url_and_postData['postData']),
            dataType: 'text',
            contentType: 'application/json'
        };

        ajax(options).finally(function () {
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                throw error;
            }).then(function (data) {
                window.saveAs(new Blob([data], {type: "application/pdf"}), "invoice.pdf");
            }
        );
        this.set('sending_started', false);

        /*
        var xhr = new XMLHttpRequest;
        xhr.open( "GET", url );
        xhr.setRequestHeader("Authorization", "Token " + this.get('session._authToken'));
        xhr.addEventListener( "load", function(){
            var raw_pdf_data = this.responseText;
            window.saveAs(new Blob([raw_pdf_data], {type: "application/pdf"}),"invoice.pdf" );
        }, false);
        xhr.send();
        */

    },

    reload: function() {
        if (this.formattedData!== null)
           this.evaluate(this.formattedData,true);
        else
            this.evaluate(null,false);
    }.on('reload'),

    toggleForm: function(){
        this.setProperties(
            {'formIsActive': true}
        );
    }.on('toggleForm'),


    cancel: function(){
         this.set('formIsActive',false);
         this.clearValidationMessages();
         this.clearFormData();
    }.on('cancel'),

    recompute: function(){
         if(this.validateFormData()){
             this.formattedData = this.formatData();
             this.evaluate(this.formattedData,false);

         }

         //this.set('formIsActive',false);
    }.on('recompute')

    },
    prepare_data_for_invoice: function(){
        var inputQuery = this.get('inputQuery');
        var data = this.model.evaluatedData.data;
        var two_tariff = data.invoice.two_tariff;
        var postData = {};

        //var url = 'http:' + buildApiUrl('/apps/accounting/createInvoice/');
        var url = buildApiUrl('/apps/accounting/createInvoice/');
        //var url = "http://127.0.0.1:8000/api/apps/accounting/createInvoice/";

        if(this.get('session.user.is_staff')) {
            //url = url + '?userId=' + this.get('inputQuery.accuser');
            postData['userId'] = inputQuery.accuser;
        }
        else
        {
            //url = url + '?userId=' + this.get('session.user.id');
            postData['userId'] = this.get('session.user.id');
        }

        //url = url + '&intervalTimeFrom=' + data.invoice.intervalTimeFrom.toString();
        postData['intervalTimeFrom'] = data.invoice.intervalTimeFrom.toString();
        //url = url + '&intervalTimeTo=' + data.invoice.intervalTimeTo.toString();
        postData['intervalTimeTo'] = data.invoice.intervalTimeTo.toString();
        postData['total_sum'] = data.billing_data.total_sum.toString();
        postData['billing_data'] = data.billing_data.data;
        postData['type'] = 'criteria';
        if (two_tariff){
        //url = url + '&hour_to=' + data.invoice.hour_to;
        postData['hour_to'] = data.invoice.hour_to.toString();
        //url = url + '&hour_from=' + data.invoice.hour_from;
        postData['hour_from'] = data.invoice.hour_from.toString();
        }
        return {'postData':postData, 'url': url};
    },
    getUserID: function(){
        if(this.get('session.user.is_staff')){
            var inputQuery = this.get('inputQuery');
            return inputQuery.accuser;
        }
        else{
            return this.get('session.user.id');
        }
    },


    formatData: function(){
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
        data['userId'] = this.getUserID();
        data['time_tariff'] = null;


        if(this.get('two_tariff'))
        {
                    data['time_tariff'] = {
                        "hour_from": this.get('currentFromHour'),
                        "hour_to": this.get('currentToHour')
                    };
        }



        return data;

    },
    validateFormData: function(){
        this.clearValidationMessages();
        var start = this.get('startTime');
        var end = this.get('endTime');
        if ((this.get('currentSpeedCalcType')==='absolete') && (start===undefined||end===undefined||start.toString().trim().length===0 || end.toString().trim().length===0)){
            this.setProperties(
                {
                    'fieldsError': true,
                    'errorMessage':'Datetime fields are empty !'
                }
            );
            return false;
        }
        if (this.get('two_tariff') && (parseInt(this.get('currentFromHour')) >= parseInt(this.get('currentToHour')))) {
            this.setProperties(
                {
                    'fieldsError': true,
                    'errorMessage': 'From Hour must be lower than To Hour !'
                }
            );
            return false;
        }
        return true;
    },




    clearFormData: function(){
                 this.setProperties({
                'startTime': '','endTime': '',
                'two_tariff': true,
                'currentToHour': '16','currentFromHour': '8'
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

    formatDataForInvoice : function(){
        var data = this.model.evaluatedData.data;
        var inputQuery = this.get('inputQuery');
        var two_tariff = data.invoice.two_tariff;
        var request = {
            "billing_data" : {
                "data": data.billing_data.data
            },
            "two_tariff": two_tariff,
            "total_sum": data.billing_data.total_sum,
            "userId": inputQuery.accuser,
            "intervalTimeFrom": data.invoice.intervalTimeFrom,
            "intervalTimeTo": data.invoice.intervalTimeTo
        };
        if (two_tariff){
            request["hour_to"] = data.invoice.hour_to;
            request["hour_from"] = data.invoice.hour_from;
        }
        return request;
    },

    calcTypeSelect: criter_eval_form['calcTypeSelect'],
    namedSelect: criter_eval_form['namedSelect'],
    relativeSelect: criter_eval_form['relativeSelect'],
    hourSelect: criter_eval_form['hour_select'],

    //default values for selects
    show_calendar: false,
    show_named: true,
    show_relative: false,
    currentCalcType:  'named',
    currentNamedSelect:  'last_day',
    currentRelativeSelect: 'days',
    currentRelativeValue: 1,
    currentFromHour: '8',
    currentToHour: '16',
    two_tariff: true,

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
    }.observes('currentCalcType'),
    email_checked: false,
    email_input_hidden: true,
    specific_email: function(){
        if(this.get('email_checked')===true)
            this.set('email_input_hidden',false);
        else
            this.set('email_input_hidden',true);
    }.observes('email_checked'),

    hide_email_failed: function(){
        if(this.get('email_failed')===true) {
            this.set('sending_started', false);
            var self = this;
            Ember.run.later(function(){
              self.set('email_failed', false);
            }, 6000);
        }
    }.observes('email_failed'),

    hide_email_sended: function(){
        if(this.get('email_sended')===true) {
            this.set('sending_started', false);
            var self = this;
              Ember.run.later(function(){
              self.set('email_sended', false);
            }, 6000);

        }
    }.observes('email_sended')
});



export default CriteriaEvaluationController;

