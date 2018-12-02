import Ember from 'ember';

import AccountingBaseModuleController from '../base-module';
import {
    speed_basic_constraints,
    volume_basic_constraints,
    bill_plans_constraints,
    generationDateSelect,
    criter_eval_form} from 'slameter/lib/select-constraints';
import AccUser from 'slameter/models/accounting/accuser';
import AccPlan from 'slameter/models/accounting/accplan';
import AsPeriodHelper from 'slameter/helpers/as-period';
import {base_speed_field, additional_speed_field, base_speed_cost_field, additional_speed_cost_field, base_volume_field, additional_volume_field, base_volume_cost_field, additional_volume_cost_field} from 'slameter/controllers/accounting/modules/basic-evaluation';
var BillPlansController = AccountingBaseModuleController.extend({
    expanded: true,
    bill_plans: true,
    editFormIsActive: false,
    model: Ember.Object.create({
        title: 'Bill Plans List'
    }),
    init: function() {
        this._super();
        var self = this;
        this.trigger('dataLoadingStarted');
        this.set('isProvider', this.get('session.user.is_staff'));
        var users = AccUser.find();
        this.setProperties('users', users);
        if(this.get('isProvider'))
            if(users.isLoaded){
                    this.setUsersSelect(users);
                    this.loadPlans(users);

            }
            else {
                users.on('didLoad', function () {
                    self.setUsersSelect(users);
                    self.loadPlans(users);
                });
            }
        else {
            this.loadPlans(null);
            this.set('model.title','My Bill Plan');
        }
    },
    base_speed_select: speed_basic_constraints['unit'],
    base_speed_unit: 1,
    additional_speed_unit: 1,

    base_volume_select: volume_basic_constraints['unit'],
    base_volume_unit: 1,
    additional_volume_unit: 1,

    loadPlans: function(users){
        var self = this;
        var plans = AccPlan.find();
        if(plans.isLoaded){
            this.load_additional_fields(null, plans, users);
        }
        else {
            plans.on('didLoad', function () {
                self.load_additional_fields(self, plans, users);
                }
            );
        }
    },
    load_additional_fields: function(self, plans, users) {
        var isAdmin = false;
        var client = this.get('session.user');
        if(this.get('isProvider'))
            isAdmin=true;
        plans.forEach(function (entry) {
            if(isAdmin)
                entry._data.user = users.content.findBy('id', entry._data.user_id);
            else
                entry._data.user = client;
            entry._data._showed = false;
            entry._data._removeDialog = false;
            entry._data._editDialog = false;
            if (self!= null) {
                self.setBillingType(entry._data);
            }
            });
        this.set('plans', plans);
        if(isAdmin)
            this.set('users_', users);
        this.trigger('dataLoadingFinished');
        if (plans.content.length === 0) {
            this.send('showMessage', "No billing plans !", 'info');
        }
    },
    setBillingType: function(entry) {
        switch (entry.billing_type) {
            case "Criteria":{
                entry.criteria = true;entry.speed = false;entry.volume = false;break;
            }
            case "Volume":{
                entry.criteria = false;entry.speed = false;entry.volume = true;break;
            }
            default:{
                entry.criteria = false;entry.speed = true;entry.volume = false;break;
            }
        }
    },
    setUsersSelect: function(users){
        var user_select = [];
        users.forEach(function(entry) {
            user_select.push({
                val: entry._data.id,
                label: entry._data.id + ', ' + entry._data.name + ' (' + entry._data.email + ') , ' + entry._data.organization
            });});
        this.set('user_select', user_select);
    },
    actions: {
        reload: function() {
            this.init();
        }.on('reload'),
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
            this.setFieldToDefaults();
        },
        create: function(){
            var self = this;
            var newRecord = new AccPlan();
            var users = this.get('users_');
            newRecord = this.createBillPlanRecord(newRecord);
            this.check_form_errors();
            if(this.check_form_errors(this.get('currentBillType'))){
            AccPlan.createRecord(newRecord).finally(function () {
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while saving data to server';
                self.send('showMessage', error.message, 'warning');
                throw error;
            }).then(function (data) {
                data[0]._data.user = users.content.findBy('id', data[0]._data.user_id);
                self.setBillingType(data[0]._data);
                self.send('showMessage', "Bill plan was created !", 'info');
                self.set('formIsActive',false);
            });
            }else{
                self.send('showMessage', 'Wrong values in input fields or missing mandatory fields !', 'warning');
                window.scrollTo(0,0);
            }
        },
        remove: function(id){
                var self = this;
                AccPlan.deleteRecord(AccPlan.find(id)).finally(function () {
                }).catch(function (error) {
                    error = error || {};
                    error.message = error.message || 'Unspecified error while saving data to server';
                    self.send('showMessage', error.message, 'warning');
                    throw error;
                }).then(function (data) {
                    self.send('showMessage', "Bill plan was deleted !", 'info');
                });
        },
        edit: function(id){
            var self = this;
            var plan = AccPlan.find(id);
            plan = this.rewriteRecord(plan);
            if(this.check_form_errors(plan._data.billing_type)) {
                AccPlan.saveRecord(plan).finally(function () {
                }).catch(function (error) {
                    error = error || {};
                    error.message = error.message || 'Unspecified error while saving data to server';
                    self.send('showMessage', error.message, 'warning');
                    self.set('editFormIsActive', false);
                    Ember.set(this.get('plans').findBy('id', id)._data, '_editDialog', false);
                    throw error;
                }).then(function (data) {
                    self.send('showMessage', "Bill plan with name " + plan._data.name + " was modified !", 'info');
                    Ember.setProperties(self.get('plans').findBy('id', id)._data, {
                        'user': self.model.get('users_').content.findBy('id', plan._data.user_id),
                        '_editDialog': false,
                        '_showed': true,
                        'calc_type': self.calc_type_description(self.get('plans').findBy('id', id)._data.calculation_type)
                    });
                    self.set('editFormIsActive', false);

                    //newRecord._data.user = self.model.get('users_').content.findBy('id', newRecord._data.user_id);
                    plan._data._removeDialog = false;
                    switch (plan._data.billing_type) {
                        case "Criteria":
                        {
                            Ember.setProperties(self.get('plans').findBy('id', id)._data, {
                                'criteria': true, 'speed': false, 'volume': false
                            });
                            break;
                        }
                        case "Volume":
                        {
                            Ember.setProperties(self.get('plans').findBy('id', id)._data, {
                                'criteria': false, 'speed': false, 'volume': true
                            });
                            break;
                        }
                        default:
                        {
                            Ember.setProperties(self.get('plans').findBy('id', id)._data, {
                                'criteria': false, 'speed': true, 'volume': false
                            });
                            break;
                        }
                    }
                });
            }else{
                self.send('showMessage', 'Wrong values in input fields or missing mandatory fields !', 'warning');
                window.scrollTo(0,0);
            }
        },

        show_hide_plan: function(plan_id){
            Ember.set(this.get('plans').findBy('id',plan_id)._data, '_showed', !this.get('plans').findBy('id',plan_id)._data._showed );
            if(this.get('plans').findBy('id',plan_id)._data.speed || this.get('plans').findBy('id',plan_id)._data.volume)
                Ember.set(this.get('plans').findBy('id',plan_id)._data, 'calc_type', this.calc_type_description(this.get('plans').findBy('id',plan_id)._data.calculation_type) );
        },
        show_hide_remove_dialog: function(plan_id){
            Ember.set(this.get('plans').findBy('id',plan_id)._data, '_removeDialog', !this.get('plans').findBy('id',plan_id)._data._removeDialog );
        },
        show_hide_edit_dialog: function(plan_id){
            if(!this.get('plans').findBy('id',plan_id)._data._editDialog) {
                this.prepare_data_for_edit(plan_id);
                this.set('editFormIsActive', true);
            }
            else
                this.set('editFormIsActive', false);
            Ember.set(this.get('plans').findBy('id',plan_id)._data, '_editDialog', !this.get('plans').findBy('id',plan_id)._data._editDialog );

        },
        cancel: function(){
            this.setProperties(
                    {'formIsActive': false}
            );
        }
    },
    show_criteria_desc: function(){
        if(this.get('currentBillType')==='Criteria')
            this.setProperties({'criteria_desc': true, 'speed_form': false, 'volume_form':false});
        else if(this.get('currentBillType')==='Speed'){
            this.setProperties({'criteria_desc': false, 'speed_form': true, 'volume_form':false});
        }
        else
            this.setProperties({'criteria_desc': false, 'speed_form': false, 'volume_form':true});
    }.observes('currentBillType'),

    change_speed_desc: function(){
        this.set('desc_speed',this.get('calcSpeedTypeSelect').findBy('val',this.get('currentSpeedCalcType')).desc_speed);
    }.observes('currentSpeedCalcType'),

    change_volume_desc: function(){
        this.set('desc_volume',this.get('calcVolumeTypeSelect').findBy('val',this.get('currentVolumeCalcType')).desc_volume);
    }.observes('currentVolumeCalcType'),

    change_period: function(){
        if(this.get('formIsActive')||this.get('editFormIsActive'))
            this.set('quarterly', this.get('currentGenerationPeriod')==='3');
    }.observes('currentGenerationPeriod'),

    check_mandatory_fields: function(type,name){
        if(name==='')
            return true;
        if(type==='Speed')
            if(!(this.get('base_speed') && this.get('base_speed').trim().length && this.get('base_speed_cost') && this.get('base_speed_cost').trim().length))
                return true;
        if(type==='Volume')
            if(!(this.get('base_volume') && this.get('base_volume').trim().length && this.get('base_volume_cost') && this.get('base_volume_cost').trim().length))
                return true;
    },
    check_form_errors: function(type){
        if(! ( this.get('baseSpeedError') || this.get('additionalSpeedError') ||
                this.get('baseSpeedCostError') || this.get('additionalSpeedCostError') ||
                this.get('baseVolumeError') || this.get('additionalVolumeError') ||
                this.get('baseVolumeCostError') || this.get('additionalVolumeCostError') ||
                this.check_mandatory_fields(type, this.get('name'))
                ))
        return true;
    },
    createBillPlanRecord: function(record){
        var calculation_type,base_volume,additional_volume,base_speed, additional_speed, base_amount, additional_amount, base_tariff, additional_tariff = null;
        if(this.get('currentBillType')==='Speed'){
            base_speed = parseInt(this.get('base_speed'))*this.get('base_speed_unit');
            additional_speed = parseInt(this.get('additional_speed'))*this.get('additional_speed_unit')|| '';
            base_amount = base_speed.toString();
            additional_amount = additional_speed.toString();
            calculation_type = this.get('currentSpeedCalcType');
            base_tariff = this.get('base_speed_cost');
            additional_tariff = this.get('additional_speed_cost');
        }
        if(this.get('currentBillType')==='Volume') {
            base_volume = parseInt(this.get('base_volume'))*this.get('base_volume_unit');
            additional_volume = parseInt(this.get('additional_volume'))*this.get('additional_volume_unit')|| '';
            base_amount = base_volume.toString();
            additional_amount = additional_volume.toString();
            calculation_type = this.get('currentVolumeCalcType');
            base_tariff = this.get('base_volume_cost');
            additional_tariff = this.get('additional_volume_cost');
        }
        record.setProperties({
            'name': this.get('name'),
            'description': this.get('description'),
            'user_id': this.get('currentUser'),
            'billing_type': this.get('currentBillType'),
            'calculation_type': calculation_type,
            'base_amount': base_amount,
            'additional_amount': additional_amount,
            'base_tariff': base_tariff,
            'additional_tariff': additional_tariff,
            'generation_date': this.get('currentGenerationDate'),
            'period': this.get('currentGenerationPeriod'),
            'months': this.get('currentGenerationMonths'),
            'mail_address': this.get('email_address'),
            'mail_subject': this.get('email_subject'),
            'user': this.get('users_').content.findBy('id', this.get('currentUser')),
            'double_tt_criteria': this.get('two_tariff'),
            'hour_from_criteria': this.get('currentFromHour'),
            'hour_to_criteria': this.get('currentToHour')
        });
        return record;
    },
    rewriteRecord: function(record, new_record){
        var base_volume,additional_volume,base_speed, additional_speed;
        if(record._data.billing_type==='Criteria'){
            this.setProperties({'criteria_desc': true, 'speed_form': false, 'volume_form':false});
            if(this.get('two_tariff'))
                record.setProperties({'hour_from_criteria': this.get('currentFromHour'), 'hour_to_criteria': this.get('currentToHour'),
                    'double_tt_criteria':this.get('two_tariff')});
            else
                Ember.set(record._data, 'double_tt_criteria', null);
        }
        else if(record._data.billing_type==='Speed'){
            base_speed = parseInt(this.get('base_speed'))*this.get('base_speed_unit');
            additional_speed = parseInt(this.get('additional_speed'))*this.get('additional_speed_unit')|| '';
            base_speed = base_speed.toString();
            additional_speed = additional_speed.toString();
            record.setProperties(
                {'base_amount': base_speed, 'base_tariff': this.get('base_speed_cost'),
                 'additional_amount':additional_speed, additional_tariff: this.get('additional_speed_cost') || '',
                 'calculation_type': this.get('currentSpeedCalcType')}
            );
            if(this.get('additional_speed')===''||this.get('additional_speed')===undefined||this.get('additional_speed_cost')===''||this.get('additional_speed_cost')===undefined)
                Ember.setProperties(record._data, {'additional_amount': '', 'additional_tariff' :''});
                }
        else {
            base_volume = parseInt(this.get('base_volume'))*this.get('base_volume_unit');
            additional_volume = parseInt(this.get('additional_volume'))*this.get('additional_volume_unit')|| '';
            base_volume = base_volume.toString();
            additional_volume = additional_volume.toString();
            record.setProperties(
                {
                    'base_amount': base_volume,
                    'base_tariff': this.get('base_volume_cost'),
                    'additional_amount': additional_volume,
                    'additional_tariff': this.get('additional_volume_cost') || '',
                    'calculation_type': this.get('currentVolumeCalcType')
                }
            );
            if(this.get('additional_volume')===''||this.get('additional_volume')===undefined||this.get('additional_volume_cost')===''||this.get('additional_volume_cost')===undefined)
                Ember.setProperties(record._data, {'additional_amount': '', 'additional_tariff' :''});

        }
        if(this.get('description')!==undefined && this.get('description')!=="" )
            record.set('description', this.get('description'));
        else
            Ember.set(record._data, 'description', '');
        if(this.get('email_subject')!==undefined && this.get('email_subject')!=="")
            record.set('mail_subject', this.get('email_subject'));
        else
            Ember.set(record._data, 'mail_subject', '');
        if(this.get('email_address')!==undefined && this.get('email_address')!=="")
            record.set('mail_address', this.get('email_address'));
        else
            Ember.set(record._data, 'mail_address', '');

      return record;
    },
    prepare_data_for_edit: function(id){
        var plan = AccPlan.find(id);
        this.setProperties({
            'email_address': plan._data.mail_address,
            'email_subject': plan._data.mail_subject,
            'description': plan._data.description,
            'base_speed_unit':1, 'additional_speed_unit': 1,
            'base_volume_unit':1, 'additional_volume_unit': 1
        });
        if(plan._data.billing_type==='Criteria')
            this.setProperties({
                'two_tariff': plan._data.double_tt_criteria,
                'currentFromHour': plan._data.hour_from_criteria,
                'currentToHour': plan._data.hour_to_criteria

            });
        else if(plan._data.billing_type==='Speed'){
            this.setProperties(
                {'base_speed': plan._data.base_amount, 'base_speed_cost': plan._data.base_tariff, 'additional_speed': plan._data.additional_amount || null, additional_speed_cost: plan._data.additional_tariff || null,
                 'currentSpeedCalcType': plan._data.calculation_type}
            );
        }
        else{
            this.setProperties(
                {'base_volume': plan._data.base_amount, 'base_volume_cost': plan._data.base_tariff, 'additional_volume': plan._data.additional_amount || null, additional_volume_cost: plan._data.additional_tariff || null,
                 'currentVolumeCalcType': plan._data.calculation_type}
            );
        }
    },
    calc_type_description: function(calc_type){
        var clc_select;
        var type = 'calcVolumeTypeSelect';
        if(calc_type===undefined||calc_type===null||!calc_type.trim().length||calc_type==="None")
            return {'label': '', 'desc': ''};
        if(calc_type.search("load")===-1){
            type = 'calcSpeedTypeSelect';
        }
        clc_select = this.get(type).findBy('val', calc_type);
            return {
                'label': clc_select.label,
                'desc': type === 'calcSpeedTypeSelect' ? clc_select.desc_speed : clc_select.desc_volume
            };
    },

    desc_speed: speed_basic_constraints['desc_speed'],
    desc_volume: volume_basic_constraints['desc_volume'],
    calcSpeedTypeSelect: speed_basic_constraints['calcTypeSelect'],
    currentSpeedCalcType: 'in_out_merged',
    calcVolumeTypeSelect: volume_basic_constraints['calcTypeSelect'],
    currentVolumeCalcType: 'up_down_load',
    billTypeSelect: bill_plans_constraints['billTypeSelect'],
    currentBillType: 'Speed',
    generationDateSelect: bill_plans_constraints['generationDateSelect'],
    currentGenerationDate: 1,
    generationMonthsSelect: bill_plans_constraints['generationMonthsSelect'],
    currentGenerationMonths: '1,4,7,10',
    generationPeriodSelect: bill_plans_constraints['generationPeriodSelect'],
    currentGenerationPeriod: '1',
    hourSelect: criter_eval_form['hour_select'],
    currentFromHour: '8',
    currentToHour: '16',
    two_tariff: true,
    criteria_desc: false,
    volume_form: false,
    speed_form: true,
    basic_interval: false,

    setFieldToDefaults: function(){
        this.setProperties(
            {
                'formIsActive': true, 'currentSpeedCalcType': 'in_out_merged', 'currentVolumeCalcType': 'up_down_load',
                'currentBillType': 'Speed', 'currentFromHour': '8', 'currentToHour': '16', 'two_tariff': true,
                'email_address': '', 'email_subject': '', 'description': '','base_speed': '', 'base_speed_cost': '',
                'additional_speed': '', additional_speed_cost: '', 'base_volume': '', 'base_volume_cost': '',
                'additional_volume': '', additional_volume_cost:'', name: '',
                'base_speed_unit':1, 'additional_speed_unit': 1,
                'base_volume_unit':1, 'additional_volume_unit': 1
            }
        );
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
        this.set('mandatory_error', ! this.get('base_speed_cost') && this.get('base_speed_cost').trim().length);
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
    }.observes('additional_volume_cost')

});


export default BillPlansController;
