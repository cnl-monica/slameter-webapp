import Ember from 'ember';

import AccountingBaseModuleController from '../base-module';
import AccPlanReport from 'slameter/models/accounting/accplanreport';
import {buildApiUrl} from 'slameter/lib/api-connector';
import ajax from 'slameter/lib/ajax';

var BillReportsController = AccountingBaseModuleController.extend({
    expanded: true,
    report: true,
    pdf_button_elsewhere: true,
    model: Ember.Object.create({
        title: 'Bill Plans Reports'
    }),
    init: function() {
        this._super();
        var self = this;
        this.trigger('dataLoadingStarted');
        var reports = AccPlanReport.find();
        this.set('reports', reports);
        var isAdmin = this.get('session.user.is_staff');
        this.set('isAdmin', isAdmin);
        if(!isAdmin)
            this.set('model.title', 'My Bill Plan Reports');
        if(reports.isLoaded){
            this.load_additional_fields(null, reports);
        } else {
            reports.on('didLoad', function() {
                self.load_additional_fields(self, reports);
            });
        }
    },
    load_additional_fields: function(self, reports) {
        if(self===null)
            self=this;
        reports.forEach(function (entry) {
            entry._data._showed = false;
            self.setBillingType(entry._data);
            });
        self.set('reports', reports);
        self.trigger('dataLoadingFinished');
        if (reports.content.length === 0) {
            self.send('showMessage', "No billing reports !", 'info');
        }
    },
    setBillingType: function(entry) {
        entry._removeDialog = false;
        switch (entry.plan.billing_type) {
            case "Criteria":
            {
                entry.criteria = true;
                entry.speed = false;
                entry.volume = false;
                if (entry.evaluated_data !== "" && entry.evaluated_data !== null)
                    if(entry.evaluated_data.error!==true)
                    {

                    if (entry.evaluated_data.billing_data.two_tariff)
                        entry.graph_data = [entry.evaluated_data.strong_traffic_rate_colls, entry.evaluated_data.weak_traffic_rate_colls];
                    else
                        entry.graph_data = [entry.evaluated_data.colls];

                    entry.fstTimeTariff = entry.evaluated_data.hour_from + ' - ' + entry.evaluated_data.hour_to;
                    entry.sndTimeTariff = entry.evaluated_data.hour_to + ' - ' + entry.evaluated_data.hour_from;
                }
                break;
            }
            case "Volume":{
                entry.criteria = false;entry.speed = false;entry.volume = true;break;
            }
            default:{
                if(entry.evaluated_data.error!==true&&entry.evaluated_data.graph!==undefined&&entry.evaluated_data.graph!==null)
                entry.graph_data = [entry.evaluated_data.graph.percentil,
                    entry.evaluated_data.graph.downData, entry.evaluated_data.graph.upData
                ];
                entry.criteria = false;entry.speed = true;entry.volume = false;break;

            }
        }
    },
    actions: {
        expand: function(){
          if (this.expanded===true) {
              this.set('expanded',false);
          }
          else{
              this.set('expanded',true);
          }

        }.on('expand'),
        toggleForm: function(){
            this.send('closeAllMessages');
        },
        show_hide_report_data: function(id){
            Ember.set(this.get('reports').findBy('id',id)._data, '_showed', !this.get('reports').findBy('id',id)._data._showed );
        },
        show_hide_remove_dialog: function(id){
            Ember.set(this.get('reports').findBy('id',id)._data, '_removeDialog', !this.get('reports').findBy('id',id)._data._removeDialog );
        },
        download_invoice: function(id){
            var self = this;
            var report = AccPlanReport.find(id);
            this.set('sending_started', true);
            var url_and_postData = this.prepare_data_for_invoice(report);
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
                    self.send('showMessage', error.message +' or unavailable Celery workers', 'error');
                    throw error;
                }).then(function (data) {
                    window.saveAs(new Blob([data], {type: "application/pdf"}), "invoice.pdf");
                }
            );
            this.set('sending_started', false);
        },
        delete_report: function(id){
                var self = this;
                AccPlanReport.deleteRecord(AccPlanReport.find(id)).finally(function () {
                }).catch(function (error) {
                    error = error || {};
                    error.message = error.message || 'Unspecified error while saving data to server';
                    self.send('showMessage', error.message, 'warning');
                    throw error;
                }).then(function (data) {
                    self.send('showMessage', "Bill report was deleted !", 'info');
                });
        }
    },
    prepare_data_for_invoice: function(report){
        var in_data = report._data.evaluated_data;
        var inv_data = {};
        var type = in_data.type;
        var url = buildApiUrl('/apps/accounting/createInvoice/');
        inv_data['userId'] = in_data.userId;
        inv_data['intervalTimeFrom'] =  in_data.intervalTimeFrom;
        inv_data['intervalTimeTo'] = in_data.intervalTimeTo;
        inv_data['total_sum'] = String(in_data.total_sum);
        inv_data['type'] = type;
        switch (type) {
            case "criteria":{
                if (in_data.billing_data.two_tariff)
                    {
                        inv_data['hour_to'] = in_data.hour_to;
                        inv_data['hour_from'] = in_data.hour_from;
                    }
                inv_data['billing_data'] = in_data.billing_data.data;
                break;
            }
            case "volume":{
                inv_data['tariff_costs'] = in_data.tariff_costs;
                inv_data['calc_type'] = in_data.calc_type;
                inv_data['billing_data'] = in_data.billing_data;
                if (in_data.calc_type.label === 'UPLOAD & DOWNLOAD')
                    inv_data['total_data'] = in_data.octet_total_count_download + in_data.octet_total_count_upload;
                else
                    if ( in_data.calc_type.label=== 'DOWNLOAD')
                        inv_data['total_data'] = in_data.octet_total_count_download;
                    else
                        inv_data['total_data'] = in_data.octet_total_count_upload;
                    break;
            }
            default:{
                inv_data['tariff_costs'] = in_data.tariff_costs;
                inv_data['billing_data'] = in_data.billing_data;
                inv_data['result_data'] = in_data.result_data;
                inv_data['calc_type'] = in_data.calc_type;
                break;
            }
        }
        return {'postData':inv_data, 'url': url};
    }

});


export default BillReportsController;
