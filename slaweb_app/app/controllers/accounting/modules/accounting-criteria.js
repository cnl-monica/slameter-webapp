import Ember from 'ember';

import AccountingBaseModuleController from '../base-module';
import AccCriteria from 'slameter/models/accounting/acccriteria';
import Client from 'slameter/models/client';
import {criteria_form, volume_basic_constraints} from 'slameter/lib/select-constraints';

var AccountingCriteriaController = AccountingBaseModuleController.extend({
    expanded: true,
    id_for_delete: 0,
    id_for_edit: 0,
    deleteMessageIsActive: false,
    deleteButtonSwitched: false,
    formIsActive: false,
    editButtonIsVisible: false,
    model: Ember.Object.create({
        title: 'Accounting Criteria'
    }),
    base_volume_select: volume_basic_constraints['unit'],
    sh_unit: 1,
    wh_unit: 1,

    init: function () {

        this._super();
        var self = this;
        var reloadVal = false;
        this.trigger('dataLoadingStarted');
        var criteria = AccCriteria.find();
        this.set('criteria', criteria);
        this.set('isProvider', this.get('session.user.is_staff'));
        if (criteria.isLoaded) {
            this.trigger('dataLoadingFinished');
        } else {
            criteria.on('didLoad', function () {
                self.trigger('dataLoadingFinished');
            });
        }
    },
    contentData: function () {
        this.check_user_criteria();
        var inputQuery = this.get('inputQuery');
        //if(inputQuery.action!=='edit'&&inputQuery.action!=='remove'){
        this.setProperties({
            'formIsActive': false,
            'deleteMessageIsActive': false,
            'editButtonIsVisible': false
        });
        this.clearFormData();
        //}

        var criteria = this.get('criteria');
        if (this.get('isProvider')) {
            criteria = criteria.filterBy('user_id', inputQuery.accuser);
        }

        try {
            if (criteria.length === 0) {
                this.send('closeAllMessages');
                if (inputQuery.accuser === 0 && this.get('isProvider')) {
                    this.send('showMessage', "No chosen User !", 'info');
                }
                else {
                    this.send('showMessage', "User criteria are empty !", 'info');
                }
            }
            else {
                //this.send('closeAllMessages');
            }
        } catch (reason) {
            // something went wrong
        }
        return criteria;
    }.property('inputQuery.accuser', 'criteria.@each', 'deleteButtonSwitched'),

    check_user_criteria: function () {
        if (this.get('isProvider') === undefined && this.get('criteria.length') === 0) {
            this.send('showMessage', "User criteria are empty !", 'info');
        }
    },

    message: function () {
        var userID = this.get('inputQuery.accuser');
        try {
            if (userID === 0 && this.get('isLoading') === false) {
                this.send('showMessage', "No chosen User !", 'info');
            }
            else {
                this.send('closeAllMessages');
            }
        } catch (reason) {
            // something went wrong
        }
    }.observes('inputQuery.accuser'),

    linkActions: function () {
        var inputQuery = this.get('inputQuery');
        //if(this.deleteMessageIsActive==false && action=='remove'){
        //this.set('deleteMessageIsActive', true);
        //this.set('deleteButtonIsSwitched',false);
        //this.set('userIsSame',true);
        if (inputQuery.action === 'remove' && inputQuery.criteria !== 0) {
            if (this.deleteMessageIsActive === false) {
                this.set('deleteMessageIsActive', true);
                this.set('deleteButtonIsSwitched', false);
            }
        }
        else if (inputQuery.action === 'edit' && inputQuery.criteria !== 0) {
            if (this.formIsActive === false) {
                this.insertDataInFormElements();
                this.set('formIsActive', true);
            }
        }
        else {
            this.set('formIsActive', false);
            this.set('deleteMessageIsActive', false);
        }

    }.observes('inputQuery.action'),
    actions: {
        show_edit: function (id) {
            this.set('id_for_edit', id);
            this.insertDataInFormElements(id);
            this.setProperties({
                'criteria_edit_id': id,
                'formIsActive': true,
                'sh_unit': 1,
                'wh_unit': 1
            });
        }.on('show_edit'),
        show_remove: function (id) {
            this.set('id_for_delete', id);
            this.set('deleteMessageIsActive', true);
        }.on('show_remove'),
        reload: function () {
            this.set('reloadVal', true);
            //Ember.run.throttle(this, self.contentData, 'last', 500);
        }.on('reload'),
        expand: function () {
            if (this.expanded === true) {
                this.set('expanded', false);
            }
            else {
                this.set('expanded', true);
            }

        }.on('expand'),
        deleteButtonIsSwitched: function () {
            this.set('deleteButtonSwitched', true);
            //this.set('deleteButtonSwitched',true);
        },
        cancel: function () {
            var inputQuery = this.get('inputQuery');
            var user_id = inputQuery.accuser;
            this.set('deleteMessageIsActive', false);
            this.setProperties({
                'sourceIpAddress': '',
                'destinationIpAddress': '',
                'sourcePorts': '',
                'destinationPorts': '',
                'dscp': '',
                'ratesh': '',
                'ratewh': '',
                'rateshdata': '',
                'ratewhdata': '',
                'priority': ''
            });
            this.set('formIsActive', false);
            this.set('inputQuery.criteria', 0);
            this.set('inputQuery.action', "list");
            this.set('editButtonIsVisible', false);
            this.clearFormData();
        },
        createCriteria: function () {
            this.clearValidationMessages();
            if (this.validateForm()) {

                //var sortedCriteria = this.get('criteria').content.sortBy('id');
                //var sortedCriteriaLength = sortedCriteria.length;
                //var newID = sortedCriteria[sortedCriteriaLength-1]._data.id + 1;

                var newRecord = new AccCriteria();
                var inputQuery = this.get('inputQuery');
                var userID = inputQuery.accuser;
                newRecord.set_user_id(userID);
                //newRecord.set_id(newID);
                newRecord = this.setRecordForCreateOrEdit(newRecord);
                AccCriteria.createRecord(newRecord);
                this.send('showMessage', "Criteria was created !", 'info');
                this.set('formIsActive', false);
                this.clearFormData();
            }
            var sourceIP = this.get('sourceIpAddress');
        },
        editCriteria: function () {
            var id = this.get('id_for_edit');
            if (this.validateForm()) {
                var selectedCriteriaRecord = AccCriteria.find(id);
                selectedCriteriaRecord = this.setRecordForCreateOrEdit(selectedCriteriaRecord);
                AccCriteria.saveRecord(selectedCriteriaRecord);
                this.send('showMessage', "Criteria with ID " + id + " was modified !", 'info');
                this.set('formIsActive', false);
                this.set('editButtonIsVisible', false);
                this.clearFormData();
            }
        },
        toggleForm: function () {
            var inputQuery = this.get('inputQuery');
            if (inputQuery.accuser !== 0) {
                this.send('closeAllMessages');
                this.setProperties(
                    {
                        'formIsActive': true, 'deleteMessageIsActive': false,
                        'sh_unit': 1, 'wh_unit': 1
                    }
                );
            }
        }
    },
    setRecordForCreateOrEdit: function (record) {
        var sh_volume, wh_volume;
        sh_volume = parseInt(this.get('rateshdata')) * this.get('sh_unit');
        wh_volume = parseInt(this.get('ratewhdata')) * this.get('wh_unit') || '';
        sh_volume = sh_volume.toString();
        wh_volume = wh_volume.toString();

        record.set_sourceIpAddresses(this.get('sourceIpAddress'));
        record.set_destinationIpAddresses(this.get('destinationIpAddress'));
        record.set_sourcePorts(this.get('sourcePorts'));
        record.set_destinationPorts(this.get('destinationPorts'));
        record.set_dscp(this.get('dscp'));
        record.set_rate_sh(this.get('ratesh'));
        record.set_rate_wh(this.get('ratewh'));
        record.set_rate_sh_data(sh_volume);
        record.set_rate_wh_data(wh_volume);
        record.set_priority(this.get('priority'));
        record.set_globalCriterium('false');
        var protocol = this.get('currentProtocol');
        record.set_protocol(protocol);
        var multicast = this.get('currentMulticast');
        record.set_multicast(multicast.toString());

        return record;
    },
    removeCriterium: function () {
        var id = this.get('id_for_delete');
        if (id !== 0)
            if (this.deleteButtonSwitched === true) {
                var criteria = AccCriteria.find(id);
                if (criteria !== null) {
                    AccCriteria.deleteRecord(criteria);
                    this.send('showMessage', "Criterium was deleted !", 'info');
                }
                this.setProperties(
                    {
                        'inputQuery.action': "list",
                        'deleteButtonSwitched': false,
                        'deleteMessageIsActive': false,
                        'inputQuery.criteria': 0
                    }
                );
            }
    }.observes('this.deleteButtonSwitched'),

    multicastSelect: criteria_form['multicastSelect'],
    protocolSelect: criteria_form['protocolSelect'],
    currentProtocol: 'any',
    currentMulticast: null,
    insertDataInFormElements: function (criteriaID) {
        try {
            var criteriaArray = this.get('criteria').filterBy('id', criteriaID);
            var record = criteriaArray[0]._data;
            this.setProperties({
                'sourceIpAddress': record.sourceIpAddresses,
                'destinationIpAddress': record.destinationIpAddresses,
                'sourcePorts': record.sourcePorts,
                'destinationPorts': record.destinationPorts,
                'dscp': record.dscp,
                'ratesh': record.rate_sh,
                'ratewh': record.rate_wh,
                'rateshdata': record.rate_sh_data,
                'ratewhdata': record.rate_wh_data,
                'priority': record.priority,
                'currentProtocol': record.protocol,
                'currentMulticast': record.multicast
            });
            this.editButtonIsVisible = true;

        }
        catch (reason) {
            // something went wrong
        }
    },
    clearFormData: function () {
        this.setProperties({
                'sourceIpAddress': '', 'destinationIpAddress': '',
                'sourcePorts': '', 'destinationPorts': '',
                'dscp': '', 'ratesh': '', 'ratewh': '', rateshdata: '', ratewhdata: '',
                'priority': '', 'currentProtocol': 'any', 'currentMulticast': null
            }
        );
        this.clearValidationMessages();
    },
    clearValidationMessages: function () {
        this.setProperties({
                'ipAddressError': false,
                'sourceIpAddressError': false,
                'destinationIpAddressError': false,
                'sourcePortsError': false,
                'destinationPortsError': false,
                'dscpError': false,
                'rateshError': false,
                'ratewhError': false,
                'rateshdataError': false,
                'ratewhdataError': false,
                'priorityError': false
            }
        );

    },
    validateForm: function () {
        var ipv4AddressesPattern = new RegExp('^ *\\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(/[8,9]|/1[0-9]|/2[0-9]|/3[0-2])?(;(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(/[8,9]|/1[0-9]|/2[0-9]|/3[0-2])?)*\\b$');
        var portPattern = new RegExp('^ *(\\d{1,5})(;\\d{1,5})*$');
        var dscpPattern = new RegExp('^ *(0|[1-9]|[1-5][0-9]|6[0-3])(;(0|[1-9]|[1-5][0-9]|6[0-3]))*$');
        var ratePattern = new RegExp('^ *(\\d)+(.\\d|.\\d\\d|.\\d\\d\\d)?$');
        var ratedataPattern = new RegExp('^ *(\\d)+(.\\d|.\\d\\d|.\\d\\d\\d|.\\d\\d\\d\\d|.\\d\\d\\d\\d\\d|.\\d\\d\\d\\d\\d\\d)?$');
        var priorityPattern = new RegExp('^ *\\d*$');

        if (this.get('sourceIpAddress').trim().length === 0 && (this.get('destinationIpAddress')).trim().length === 0) this.set('ipAddressError', true);
        else {
            if (this.get('sourceIpAddress').trim().length !== 0 && !ipv4AddressesPattern.test(this.get('sourceIpAddress'))) {
                this.set('sourceIpAddressError', true);
            }
            if (this.get('destinationIpAddress').trim().length !== 0 && !ipv4AddressesPattern.test(this.get('destinationIpAddress'))) {
                this.set('destinationIpAddressError', true);
            }
        }
        if (this.get('sourcePorts').trim().length !== 0 && !portPattern.test(this.get('sourcePorts'))) {
            this.set('sourcePortsError', true);
        }
        var dst_ports = this.get('destinationPorts');
        if (dst_ports.trim().length !== 0 && !portPattern.test(dst_ports)) {
            this.set('destinationPortsError', true);
        }

        if (this.get('dscp').trim().length !== 0 && !dscpPattern.test(this.get('dscp'))) {
            this.set('dscpError', true);
        }

        if (!this.get('ratesh') || !ratePattern.test(this.get('ratesh'))) {
            this.set('rateshError', true);
        }

        if (!this.get('ratewh') || !ratePattern.test(this.get('ratewh'))) {
            this.set('ratewhError', true);
        }

        if (!this.get('rateshdata') || !ratedataPattern.test(this.get('rateshdata'))) {
            this.set('rateshdataError', true);
        }

        if (!this.get('ratewhdata') || !ratedataPattern.test(this.get('ratewhdata'))) {
            this.set('ratewhdataError', true);
        }

        if (!this.get('priority') || !priorityPattern.test(this.get('priority'))) {
            this.set('priorityError', true);
        }

        if (!this.get('ipAddressError') && !this.get('sourceIpAddressError') && !this.get('destinationIpAddressError') && !this.get('sourcePortsError') && !this.get('destinationPortsError') && !this.get('dscpError') && !this.get('rateshError') && !this.get('ratewhError') && !this.get('priorityError')
        ) {
            return true;
        }
        else {
            return false;
        }
    }

});


export default AccountingCriteriaController;
