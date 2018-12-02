import Ember from 'ember';

import AccountingBaseModuleController from '../base-module';
import Client from 'slameter/models/client';
import AccUser from 'slameter/models/accounting/accuser';
import {apiCall} from 'slameter/lib/api-connector';
import {speed_basic_constraints, billTypeSelect, volume_basic_constraints} from 'slameter/lib/select-constraints';
import {buildApiUrl} from 'slameter/lib/api-connector';
import ajax from 'slameter/lib/ajax';
import AsBpsDataHelper from 'slameter/helpers/as-bps-data';
import AsDataHelper from 'slameter/helpers/as-data';

var BasicEvaluationController = AccountingBaseModuleController.extend({
    pdf_buttons_enable: true,
    email_failed: false,
    email_sended: false,
    sending_started: false,
    disabled_apply: true,
    form: false,
    basic_interval: true,
    speed_form_part: true,
    volume_form_part: false,
    speed_graph: false,
    evaluated: false,
    model: Ember.Object.create({
        evaluatedData: null,
        title: 'Basic Speed/Volume billing'
    }),
    desc_speed: 'Take the sum(IN, OUT) for each interval and then calculate 95th percentile value from the merged records',
    desc_volume: 'Total costs will be calculated by combining both upload and download data transfer',
    show_volume_calendar: false,
    show_speed_calendar: false,
    show_calendar: false,

    changeUser: function() {
        var inputQuery = this.get('inputQuery');
        this.set('isAdmin', this.get('session.user.is_staff'));
        this.send('closeAllMessages');
        if( this.get('isAdmin') && inputQuery.accuser===0)
            {this.set('form', false);
               this.send('showMessage', "No chosen User !", 'info');
            }
        else{
            this.setProperties({'speed_graph': false, 'form': true, 'evaluated': false});
            this.set('speed_form_part',this.get('currentBillType')==='speed');
            this.set('volume_form_part', this.get('currentBillType')!=='speed');
        }

    }.observes('inputQuery.accuser'),

    calcSpeedTypeSelect: speed_basic_constraints['calcTypeSelect'],
    currentSpeedCalcType: 'in_out_merged',

    calcVolumeTypeSelect: volume_basic_constraints['calcTypeSelect'],
    currentVolumeCalcType: 'up_down_load',

    calcIntervalSelect: volume_basic_constraints['calcIntervalSelect'],
    currentCalcInterval: 'last_month',

    billTypeSelect: speed_basic_constraints['billTypeSelect'],
    currentBillType: 'speed',

    base_speed_select: speed_basic_constraints['unit'],
    base_speed_unit: 1,
    additional_speed_unit: 1,

    base_volume_select: volume_basic_constraints['unit'],
    base_volume_unit: 1,
    additional_volume_unit: 1,

    change_speed_desc: function(){
        this.set('desc_speed',this.get('calcSpeedTypeSelect').findBy('val',this.get('currentSpeedCalcType')).desc_speed);
    }.observes('currentSpeedCalcType'),

    change_volume_desc: function(){
        this.set('desc_volume',this.get('calcVolumeTypeSelect').findBy('val',this.get('currentVolumeCalcType')).desc_volume);
    }.observes('currentVolumeCalcType'),


    speed_or_volume: function(){
        this.set('speed_form_part',this.get('currentBillType')==='speed');
        this.set('volume_form_part', this.get('currentBillType')==='volume');
    }.observes('currentBillType'),

    change_show_calendar: function(){
        if (this.get('currentCalcInterval')==='absolete'){
            this.set('show_calendar',true);
        }
        else{
            this.set('show_calendar',false);
        }
    }.observes('currentCalcInterval'),
     actions: {

         apply: function () {
             this.evaluate();
         }.on('apply'),
         reload: function () {
             this.evaluate();
         }.on('reload'),
         new_parameters: function () {
             this.setProperties({form: true, speed_graph: false, evaluated: false});
         }.on('new_parameters'),
         generate_bill: function () {
             this.generate_invoice();
         }.on('generate_bill'),
         send_bill: function(){
             this.send_invoice();
         }.on('send_bill')
     },

    evaluate: function(){
         var self = this;
         var data = this.prepare_request_data();
            this.send('closeAllMessages');
            this.trigger('dataLoadingStarted');
            this.getDataFromApi(data).finally(function () {
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                self.trigger('dataLoadingFinished');
                throw error;
            }).then(function (data) {
                self.afterLoadData(data);
                if(self.model.evaluatedData.error){
                        self.send('showMessage', self.model.evaluatedData.message, 'warning');
                        self.trigger('dataLoadingFinished');
                }
                else {
                    // 'octet_total_count': octet_total_count,
                    // 'total_cost': total_cost

                    if(self.get('currentBillType')==='speed'){
                        self.setProperties({'graph_data': [
                                            self.model.evaluatedData.graph.percentil,
                                            self.model.evaluatedData.graph.downData,
                                            self.model.evaluatedData.graph.upData
                                        ],'speed_graph': true, 'form':false, 'evaluated':true,
                                        'timeFrom': self.model.evaluatedData.time_from,
                            'timeTo': self.model.evaluatedData.time_to
                        });
                    }
                    else{
                         self.setProperties({'form':false, 'evaluated':true,
                                        'timeFrom': self.model.evaluatedData.time_from,
                            'timeTo': self.model.evaluatedData.time_to
                        });
                    }
                    self.trigger('dataLoadingFinished');
                }
            });

    },

     prepare_request_data: function(){
         var data, base_speed, additional_speed, base_volume, additional_volume;
         if(this.get('currentBillType')==='speed'){
             base_speed = parseInt(this.get('base_speed'))*this.get('base_speed_unit');
             additional_speed = parseInt(this.get('additional_speed'))*this.get('additional_speed_unit')|| '';
             base_speed = base_speed.toString();
             additional_speed = additional_speed.toString();
             data = {
                 "eval_type": this.get('currentSpeedCalcType'),
                 "base_speed": base_speed,
                 "additional_speed": additional_speed,
                 "base_cost": this.get('base_speed_cost'),
                 "additional_cost": this.get('additional_speed_cost') || ''
             };
             this.set('calc_type', this.get('calcSpeedTypeSelect').findBy('val',this.get('currentSpeedCalcType')));
         }
        else{
             base_volume = parseInt(this.get('base_volume'))*this.get('base_volume_unit');
             additional_volume = parseInt(this.get('additional_volume'))*this.get('additional_volume_unit')|| '';
             base_volume = base_volume.toString();
             additional_volume = additional_volume.toString();
             data = {
                 "eval_type": this.get('currentVolumeCalcType'),
                 "base_volume": base_volume,
                 "additional_volume": additional_volume,
                 "base_cost": this.get('base_volume_cost'),
                 "additional_cost": this.get('additional_volume_cost') || ''
             };
             this.set('calc_type', this.get('calcVolumeTypeSelect').findBy('val',this.get('currentVolumeCalcType')));
         }
         data['bill_type'] =  this.get('currentBillType');
         var userId;
         if(this.get('isAdmin')){
             var inputQuery = this.get('inputQuery');
             userId = inputQuery.accuser;
         }
         else {
             userId = this.get('session.user.id');
         }
         this.set('model.user', AccUser.find(userId));
         data['userId'] = userId;
         if(this.get('currentCalcInterval')==='absolete') {
             data['interval_type'] = 'absolete';
             data['time_from'] = this.get('startTime');
             data['time_to'] = this.get('endTime');
         }
         else{
             data['interval_type'] = this.get('currentCalcInterval');
         }
         return data;
     },

     getDataFromApi: function(query) {
        return apiCall("/apps/accounting/basicEvaluate/", query, 'POST').then(function(data) {
            return data;
        });
     },

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
     costPattern : new RegExp('^ *(\\d)+(.\\d|.\\d\\d|.\\d\\d\\d)?$'),
     speedVolPattern : new RegExp('^ *\\d*$'),

    base_speed_field: function(){
        this.set('baseSpeedError', this.get('base_speed') && !this.speedVolPattern.test(this.get('base_speed')) ? true : false);
    }.observes('base_speed'),

    additional_speed_field: function(){
        this.set('additionalSpeedError', this.get('additional_speed') && !this.speedVolPattern.test(this.get('additional_speed')) ? true : false);
    }.observes('additional_speed'),

    base_speed_cost_field: function(){
        this.set('baseSpeedCostError', this.get('base_speed_cost') && !this.costPattern.test(this.get('base_speed_cost')) ? true : false);
    }.observes('base_speed_cost'),

    additional_speed_cost_field: function(){
        this.set('additionalSpeedCostError', this.get('additional_speed_cost') && !this.costPattern.test(this.get('additional_speed_cost')) ? true : false);
    }.observes('additional_speed_cost'),

    base_volume_field: function(){
        this.set('baseVolumeError', this.get('base_volume') && !this.speedVolPattern.test(this.get('base_volume')) ? true : false);
    }.observes('base_volume'),

    additional_volume_field: function(){
        this.set('additionalVolumeError', this.get('additional_volume') && !this.speedVolPattern.test(this.get('additional_volume')) ? true : false);
    }.observes('additional_volume'),

    base_volume_cost_field: function(){
        this.set('baseVolumeCostError', this.get('base_volume_cost') && !this.costPattern.test(this.get('base_volume_cost')) ? true : false);
    }.observes('base_volume_cost'),

    additional_volume_cost_field: function(){
        this.set('additionalVolumeCostError', this.get('additional_volume_cost') && !this.costPattern.test(this.get('additional_volume_cost')) ? true : false);
    }.observes('additional_volume_cost'),

    show_hide_submit: function(){
        if(this.get('currentBillType')==='speed'){
            if (this.get('base_speed') && this.get('base_speed_cost') && ! this.get('baseSpeedError') && ! this.get('baseSpeedCostError'))
                {
                if (! this.get('additional_speed') && ! this.get('additional_speed_cost'))
                    this.set('disabled_apply', false);
                else
                    this.set('disabled_apply', !( this.get('additional_speed') && this.get('additional_speed_cost') && !this.get('additionalSpeedError') && !this.get('additionalSpeedCostError')));
                }
            else
                this.set('disabled_apply', true);
            }
        else{
            if (this.get('base_volume') && this.get('base_volume_cost') && ! this.get('baseVolumeError') && ! this.get('baseVolumeCostError'))
                {
                if (! this.get('additional_volume') && ! this.get('additional_volume_cost'))
                    this.set('disabled_apply', false);
                else
                    this.set('disabled_apply', !( this.get('additional_volume') && this.get('additional_volume_cost') && !this.get('additionalVolumeError') && !this.get('additionalVolumeCostError')));
                }
            else
                this.set('disabled_apply', true);
         }
    }.observes('base_speed','base_volume','additional_speed','additional_volume','base_speed_cost','additional_speed_cost','base_volume_cost','additional_volume_cost'),

    prepare_data_for_invoice: function(){
        var inputQuery = this.get('inputQuery');
        var data = this.model.evaluatedData;
        var postData = {};
        var base_speed, additional_speed, base_volume, additional_volume;

        //var url = 'http:' + buildApiUrl('/apps/accounting/createInvoice/');
        var url = buildApiUrl('/apps/accounting/createInvoice/');
        postData['userId'] = this.get('session.user.is_staff') ? inputQuery.accuser : this.get('session.user.id');
        postData['intervalTimeFrom'] =  data.time_from.toString();
        postData['intervalTimeTo'] = data.time_to.toString();
        postData['total_sum'] = data.total_cost.toString();
        var calc_type = null;
        if(this.get('currentBillType')==='speed'){
            postData['subject'] = "SLAmeter Bill - Speed (95th Percentile) Evaluation method";
            postData['type'] = 'speed';
            postData['result_data'] = data.billing_95_interval.toString();
            calc_type = this.get('calcSpeedTypeSelect').findBy('val',this.get('currentSpeedCalcType'));
            postData['calc_type'] = {
                    'label': calc_type.label,
                    'desc': calc_type.desc_speed
            };
            postData['billing_data'] = {
                'download': data.download,
                'upload': data.upload
            };
            base_speed = parseInt(this.get('base_speed'))*this.get('base_speed_unit');
            additional_speed = parseInt(this.get('additional_speed'))*this.get('additional_speed_unit')|| '';
            base_speed = base_speed.toString();
            additional_speed = additional_speed.toString();
            postData['tariff_costs'] = {
                'base_data' : base_speed,
                'base_cost' : this.get('base_speed_cost'),
                'additional_data' : additional_speed,
                'additional_cost' : this.get('additional_speed_cost')
            };
        }
        else{
            postData['type'] = 'volume';
            postData['subject'] = "SLAmeter Bill - Volume Evaluation method";
            calc_type = this.get('calcVolumeTypeSelect').findBy('val',this.get('currentVolumeCalcType'));
            postData['result_data'] = data.total_cost.toString();
            postData['calc_type'] = {
                    'label': calc_type.label,
                    'desc': calc_type.desc_volume
            };
            if (this.get('currentVolumeCalcType') === 'up_down_load')
                postData['total_data'] = data.octet_total_count_download + data.octet_total_count_upload;
            else
                if ( this.get('currentVolumeCalcType') === 'download')
                    postData['total_data'] = data.octet_total_count_download;
                else
                    postData['total_data'] = data.octet_total_count_upload;
            base_volume = parseInt(this.get('base_volume'))*this.get('base_volume_unit');
            additional_volume = parseInt(this.get('additional_volume'))*this.get('additional_volume_unit')|| '';
            base_volume = base_volume.toString();
            additional_volume = additional_volume.toString();
            postData['tariff_costs'] = {
                'base_data' :base_volume,
                'base_cost' : this.get('base_volume_cost'),
                'additional_data' : additional_volume,
                'additional_cost' : this.get('additional_volume_cost')
            };
        }
        return {'postData':postData, 'url': url};
    },

    generate_invoice: function() {
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
    },

    send_invoice: function(){
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
        url_and_postData['postData']['text'] = "Dear Customer " + this.get('model.user.name') +"\n\nFor billing network services, your company or ISP used SLAmeter tool.\nIn attachement is yours invoice for last period.\n\nBest regards\n \n\nIf you have any questions, please contact us on: ";
        url_and_postData['postData']['filename'] = 'SLAmeter_Invoice.pdf';
        this.sendEmail(url_and_postData['url'], url_and_postData['postData']).finally(function () {
            }).catch(function (error) {
                self.set('email_failed', true);
                throw error;
            }).then(function (data) {
                if(data['success']===true) {
                    self.setProperties({'sending_started': false, 'email_sended': true});
                }
                else
                    self.setProperties({'sending_started': false, 'email_failed': true});
            });

    },
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
    }.observes('email_sended'),
    sendEmail: function(dataUrl,requestData) {
        return apiCall(dataUrl, requestData, 'POST').then(function(data) {
            return data;
        });
    }


});


export default BasicEvaluationController;
