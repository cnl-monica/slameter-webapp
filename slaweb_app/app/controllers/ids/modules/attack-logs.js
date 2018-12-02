import Ember from 'ember';

import IdsBaseModuleController from '../base-module';
import {apiCall} from 'slameter/lib/api-connector';
import idsData from 'slameter/lib/ids-data';


var AttackLogsController = IdsBaseModuleController.extend({

    showPage: true,

    showDetailTable: false,

    model: Ember.Object.create({
        title: 'AttackLogs'
    }),

    currentType: 'all',
    attacktype_select: [
        {val:'all', label: 'All'},
        {val:'SynFlood', label: 'SYN flood'},
        {val:'UdpFlood', label: 'UDP flood'},
        {val:'PortScan', label: 'Port Scan'},
        {val:'RstFlood', label: 'RST flood'},
        {val:'TtlFlood', label: 'TTL Expiry flood'},
        {val:'FinFlood', label: 'FIN flood'}
    ],

    currentProb: '60',
    attack_prob: [
        {val:'60', label: '60%'},
        {val:'70', label: '70%'},
        {val:'80', label: '80%'},
        {val:'90', label: '90%'},
        {val:'100', label: '100%'}
    ],

    /**
     *
     * Metoda ktora pri nacitani stranky posle poziadavku na server pre nacitanie zoznamu utokov
     * Posiela iba startTime a endTime, a takto server vracia vsetky ulozene utoky od 01.01.2015 po aktuany cas
     * Je to osetrene v ids/views.py
     *
     * @variables
     * timeNow - ziska sa aktualny cas
     * startTime - cas v milisekundach 1420066800000 = 01.01.2015
     * query - poziadavka na server
     *
     */
    _loadData: function() {

        this.set('showDetailTable',false);
        var self = this;
        var timeNow = new Date();
            //poslednych 24 hodin, timeNow minus 1 den
        var startTime = timeNow.getTime() - 86400000;
        var endTime = timeNow.getTime();
            //startTime = "1420066800000", //from 01.01.2015

        var query = {
           'startTime': startTime, 'endTime': endTime
        };

        self.getDataWithoutFillTypeAndProb('/apps/ids/AttackLogs/', query).finally(function() {
            self.trigger('dataLoadingFinished');
        }).catch(function(error) {
            error = error || {};
            error.message = error.message || 'Unspecified error while loading data from server';
            self.send('showMessage', error.message, 'warning');
            throw error;
        }).then(function(data) {
            self.afterLoadData(data);
        });
        //pre resetovanie filtra
        this.cancelData();
    },//.on('init'),


   /**
    * Filter pre nastavenie poziadavky na server
    * Udaje pre poziadavku ziskava z formularov
    *
    */
    filterData: function() {
        var self = this;
        var startTime= this.get("startTime"),
            endTime = this.get("endTime"),
            attacktype = this.get("currentType"),
            probability = this.get("currentProb");

        if ((startTime !== undefined) && (endTime !== undefined) && (attacktype === 'all') && (probability !== undefined)) {
            var query1 = {
                'startTime': startTime, 'endTime': endTime, 'probability': probability
            };
            self.getDataWithoutFillType('/apps/ids/AttackLogs/', query1).finally(function () {
                self.trigger('dataLoadingFinished');
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                throw error;
            }).then(function (data) {
                self.afterLoadData(data);
            });

        } else if ((startTime !== undefined) && (endTime !== undefined) && (attacktype !== undefined) && (probability !== undefined)){
            var  query2 = {
                'startTime': startTime, 'endTime': endTime, 'attacktype': attacktype, 'probability': probability
            };
            self.getData('/apps/ids/AttackLogs/', query2).finally(function() {
                self.trigger('dataLoadingFinished');
            }).catch(function(error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                throw error;
            }).then(function(data) {
                self.afterLoadData(data);
            });

        } else if ((startTime === undefined) && (endTime === undefined)){
            self.send('showMessage', "Please select date and time for Records since and Records till.", 'warning');
        } else if (startTime === undefined){
            self.send('showMessage', "Please select date and time for Records since.", 'warning');
        } else if (endTime === undefined){
            self.send('showMessage', "Please select date for Records till.", 'warning');
        }
    },

    /**
     * Metoda pre poslanie poziadavky with startTime, endTime, type a probability
     * Server vracia zaznamy o utoku podla poziadavky
     *
     * @param dataUrl - url poziadavka
     * @param query - poziadavka na server v tvare: "GET /api/apps/ids/AttackLogs/?startTime=1420066800000&endTime=1427489495027&&null
     * @returns {*} - vracia objekt kde su pozadovane data
     */
    getData: function(dataUrl,query) {
        var self = this,
            requestData = null;
        if(query!==null) {
            dataUrl += '?startTime=' + query.startTime + '&';
            dataUrl += 'endTime=' + query.endTime + '&';
            dataUrl += 'attacktype=' + query.attacktype + '&';
            dataUrl += 'probability=' + query.probability + '&';
        }
        return apiCall(dataUrl, requestData, 'GET').then(function(data) {
            return data;
        });
    },

    /**
     * Metoda pre poslanie poziadavky bez type
     * Server vracia zaznamy o utoku iba podla casu
     *
     * @param dataUrl - url poziadavka
     * @param query - poziadavka na server v tvare: "GET /api/apps/ids/AttackLogs/?startTime=1420066800000&endTime=1427489495027&&null
     * @returns {*} - vracia objekt kde su pozadovane data
     */
    getDataWithoutFillType: function(dataUrl,query) {
        var self = this,
            requestData = null;
        if(query!==null) {
            dataUrl += '?startTime=' + query.startTime + '&';
            dataUrl += 'endTime=' + query.endTime + '&';
            dataUrl += 'probability=' + query.probability + '&';
        }
        return apiCall(dataUrl, requestData, 'GET').then(function(data) {
            return data;
        });
    },

    /**
     * Metoda pre poslanie poziadavky bez type a probability
     * Server vracia zaznamy o utoku iba podla casu
     *
     * @param dataUrl - url poziadavka
     * @param query - poziadavka na server v tvare: "GET /api/apps/ids/AttackLogs/?startTime=1420066800000&endTime=1427489495027&&null
     * @returns {*} - vracia objekt kde su pozadovane data
     */
    getDataWithoutFillTypeAndProb: function(dataUrl,query) {
        var self = this,
            requestData = null;
        if(query!==null) {
            dataUrl += '?startTime=' + query.startTime + '&';
            dataUrl += 'endTime=' + query.endTime + '&';
        }
        return apiCall(dataUrl, requestData, 'GET').then(function(data) {
            return data;
        });
    },



    /**
     * Metoda ktora sa zavola po nacitani dat zo servera
     * data ulozi do logs z ktore potom citame v hbs
     * obsahuje chybove spravy
     *
     * @param data
     */
    afterLoadData: function(data) {
        var status = data.status,
            response = data.data;
        if (status === 'error') {
            this.send('showMessage', response.message || 'Module data source returned unspecified error.', 'warning');
        } else if (status === 'unavailable') {
            this.set('isUnavailable', true);
        }

        else {
            if (data.length === 0){
                this.send('showMessage', 'No data records to display', 'warning');
            }

            if (response && response.length === 0) {
                this.send('showMessage', 'No data to display', 'info');
            }

            var number;
            var receivedJSONlength = data.length;
            for (var i = 0; i < receivedJSONlength; i++) {

                var date = moment(data[i].starttime).format("dddd, DD-MM-YYYY");
                var time = moment(data[i].starttime).format("HH:mm:ss");

                var type1 = data[i].attacktype;
                switch (type1) {
                    case "SynFlood":
                        data[i].attacktype = "SYN flood";
                        break;
                    case "UdpFlood":
                        data[i].attacktype = "UDP flood";
                        break;
                    case "PortScan":
                        data[i].attacktype = "Port scan";
                        break;
                    case "RstFlood":
                        data[i].attacktype = "RST flood";
                        break;
                    case "TtlFlood":
                        data[i].attacktype = "TTL expiry flood";
                        break;
                    case "FinFlood":
                        data[i].attacktype = "FIN flood";
                        break;
                }

                // json object rozsirime o dasli element "date"
                // ktory bude obsahovat datum utoku (ziskany zo "startime")
                // time bude formatovany cas
                data[i].date = date;
                data[i].time = time;

                number = i;
                data[i].number = (number+1);

//                data[0].starttime = "12:15";
//                console.log(data[0].starttime);
//                console.log(data[i]);
//                console.log(data);
//                console.log(data.length);
            }
            this.set('logs', data);
        }
    },

    /*** Load attack Details ***/
    /**
     * Metoda pre poslanie poziadavky so startTime, endTime, type a probability
     * Server vracia zaznamy o utoku podla poziadavky
     *
     * @param dataUrl - url poziadavka
     * @param query - poziadavka na server v tvare: "GET /api/apps/ids/AttackLogs/?startTime=1420066800000&endTime=1427489495027&&null
     * @returns {*} - vracia objekt kde su pozadovane data
     */
    getDataDetails: function(dataUrl,query) {
        //debugger;
        var self = this,
            requestData = null;
        if(query!==null) {
            dataUrl += '?id=' + query.id + '&';
        }
        return apiCall(dataUrl, requestData, 'GET').then(function(data) {
            return data;
        });
    },

    afterLoadDataDetails: function(data) {
        var status = data.status,
            response = data.data;
        if (status === 'error') {
            this.send('showMessage', response.message || 'Module data source returned unspecified error.', 'warning');
        } else if (status === 'unavailable') {
            this.set('isUnavailable', true);
        }

        else {
            if (response && response.length === 0) {
                this.send('showMessage', 'No data to display', 'info');
            }

            var receivedJSONlength = data.length;
            for (var i = 0; i < receivedJSONlength; i++) {

                var date = moment(data[i].starttime).format("DD-MM-YYYY, dddd");
                var timeStart = moment(data[i].starttime).format("HH:mm:ss");
                var timeEnd = moment(data[i].endtime).format("HH:mm:ss");

                var type1 = data[i].attacktype;
                switch (type1) {
                    case "SynFlood":
                        data[i].attacktype = "SYN flood";
                        data[i].shortattacktype = "SYN";
                        break;
                    case "UdpFlood":
                        data[i].attacktype = "UDP flood";
                        data[i].shortattacktype = "UDP";
                        break;
                    case "PortScan":
                        data[i].attacktype = "Port scan";
                        data[i].shortattacktype = "Port";
                        break;
                    case "RstFlood":
                        data[i].attacktype = "RST flood";
                        data[i].shortattacktype = "RST";
                        break;
                    case "TtlFlood":
                        data[i].attacktype = "TTL expiry flood";
                        data[i].shortattacktype = "TTL expiry";
                        break;
                    case "FinFlood":
                        data[i].attacktype = "FIN flood";
                        data[i].shortattacktype = "FIN";
                        break;
                }

                var count;
                if (data[i].sf_syncount !== null){
                    count = data[i].sf_syncount;
                }else if (data[i].uf_packetcount !== null){
                    count = data[i].uf_packetcount;
                }else if (data[i].ps_flowcount !== null){
                    count = data[i].ps_flowcount;
                }else if (data[i].rf_rstcount !== null){
                    count = data[i].rf_rstcount;
                }else if (data[i].tf_ttlcount !== null){
                    count = data[i].tf_ttlcount;
                }else if (data[i].ff_fincount !== null){
                    count = data[i].ff_fincount;
                }else count = 0; //toto este preverit

                // json object rozsirime o dasli element "date" ktory bude obsahovat datum utoku (ziskany zo "startime")
                data[i].date = date;
                data[i].starttime = timeStart;
                data[i].endtime = timeEnd;

                // count obsahuje pocitadlo pre jednotlive priznaky utokov, je to kvoli hbs, kde nemozme dat
                // vsetky: sf_syncount, ps_flovcount, atd, >vid predchadzajuci if else
                data[i].count = count;

                var prob = data[i].probability;
                data[i].probability = prob + "%";

//                console.log(data[i]);
//                console.log(data);
//                console.log(data.length);
            }
            this.set('details', data);
        }
    },


    getDataDetailsFromDetailTable: function(dataUrl,query) {
        var self = this,
            requestData = null;
        if(query!==null) {
            dataUrl += '?attack_id=' + query.id + '&';
        }
        return apiCall(dataUrl, requestData, 'GET').then(function(data) {
            return data;
        });
    },


    afterLoadDataDetailsFromDetailTable: function(data) {
        var status = data.status,
            response = data.data;
        if (status === 'error') {
            this.send('showMessage', response.message || 'Module data source returned unspecified error.', 'warning');
        } else if (status === 'unavailable') {
            this.set('isUnavailable', true);
        }

        else {
            if (response && response.length === 0) {
                this.send('showMessage', 'No data to display', 'info');
            }

            var receivedJSONlength = data.length;
            for (var i = 0; i < receivedJSONlength; i++) {

                var date = moment(data[i].since).format("DD-MM-YYYY");
                var timeSince = moment(data[i].since).format("HH:mm:ss.SS");
                var timeTill = moment(data[i].till).format("HH:mm:ss.SS");

                var count;
                if (data[i].sf_syncount !== null){
                    count = data[i].sf_syncount;
                }else if (data[i].uf_packetcount !== null){
                    count = data[i].uf_packetcount;
                }else if (data[i].rf_rstcount !== null){
                    count = data[i].rf_rstcount;
                }else if (data[i].tf_ttlcount !== null){
                    count = data[i].tf_ttlcount;
                }else if (data[i].ff_fincount !== null){
                    count = data[i].ff_fincount;
                }else count = 0; //toto este preverit


                // json object rozsirime o dasli element "date" ktory bude obsahovat datum utoku (ziskany zo "startime")
                data[i].date = date;

                data[i].since = timeSince;
                data[i].till = timeTill;
                data[i].count = count;

                var prob = data[i].probability;
                data[i].probability = prob + "%";

                //data[0].starttime = "12:15";
                //console.log(data[0].starttime);
                //console.log(data[i]);
                //console.log(data);
                //console.log(data.length);
            }
            this.set('fromdetailtables', data);
        }
    },


   /**
    * Filter pre nastavenie poziadavky na server
    * Udaje pre poziadavku ziskava z formularov
    *
    */
    loadDataDetails: function(id_from_table) {
        this.set('showDetailTable',true);
        var self = this;
        var id= id_from_table;
        //debugger;
        if ((id !== undefined)) {
            //debugger;
            var query = {
                'id': id
            };
            self.getDataDetails('/apps/ids/AttackLogs/', query).finally(function () {
                self.trigger('dataLoadingFinished');
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                throw error;
            }).then(function (data) {
                self.afterLoadDataDetails(data);
            });

            self.getDataDetailsFromDetailTable('/apps/ids/AttackDetails/', query).finally(function () {
                self.trigger('dataLoadingFinished');
            }).catch(function (error) {
                error = error || {};
                error.message = error.message || 'Unspecified error while loading data from server';
                self.send('showMessage', error.message, 'warning');
                throw error;
            }).then(function (data) {
                self.afterLoadDataDetailsFromDetailTable(data);
            });
        }
    },
    /*** END ***/


    cancelData: function() {
        var self = this;
        this.set("startTime", undefined),
        this.set("endTime", undefined),
        this.set("currentType", "all"),
        this.set("currentProb", "60");
    },


    actions: {
        recompute: function(){
            this.filterData();
        }.on('init'),

        cancel: function(){
            this.set('showDetailTable',false);
            this.cancelData();
            this._loadData();
        }.on('init'),

        showDetails: function(id_from_table){
            this.loadDataDetails(id_from_table);
            //this.send('showMessage', 'No data to display ' + id_from_table, 'info');
        },

        reloadSection: function(){
            this.set('showDetailTable',false);
            this.cancelData();
            this._loadData();
        }.on('init')
    },

    toolboxTemplate: 'ids/modules/attack-logs--toolbox'
});

export default AttackLogsController;
