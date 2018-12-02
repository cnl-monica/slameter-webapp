import Ember from 'ember';

import IdsBaseModuleWithChartController from '../base-module-with-chart';
import idsData from 'slameter/lib/ids-data';

var IdsTtlFloodAttackProbabilityController = IdsBaseModuleWithChartController.extend({

    name: 'IdsTtlFloodAttackProbability',

    // vyjadruje, ze potrebuje controller sekcie
    needs: ['$app/$section'],

    // ziskame section controller pre tento modul, Monitoring
    sectionController: Ember.computed.alias('controllers.$app/$section'),

    // modul ktoremu chceme poslat info o utoku
    callModule: "IdsTtlNavigation",

    expanded: false,

    chartPointCount: 100,

    _applyFilter: Ember.K,

    array: null,

    init: function() {
        this._super();
        var i = 0, array = [];
        for(i=0; i < this.get('chartPointCount'); i++) {
            array.push(0);
        }
        this.set('array', array);
        this.set('data', [
            {
                data: this.get('array'),
                label: this.get('chartDataLabel')
            }
        ]);
       // console.log(this.get('array'));

    },

    // adat = [time, count, attack] = [1428622353973, 25, true]
    addToArray: function() {
        // pomocna premenna
        var adat3 = this.get('adat');   // adat = [1428622353973, 25, true] = time, count, attack

        // posuvanie pola pre vykreslovanie max 100 zaznamov
        var array = this.get('array');  // prazdne pole = dlzka 100
        array.shift();                  // prazdne pole = dlzka 99
        array.push(this.get('adat'));   //z adat sa naplni array... cas a count = dlzka opat 100

        this.set('data', [
            {
                data: array,
                label: this.get('chartDataLabel')
            }
        ]);

        // podmienka pre zistenie ci nastal utok
        var time = moment(adat3[0]).format('HH:mm:ss, DD-MM-YYYY');

        if (adat3[2] === true){
            this.send('showMessage', 'Time: ' + time + ' - TTL flood attack detected with attack probability: ' + adat3[1] + '%', 'error');

            var sectionController = this.get('sectionController');
            sectionController.send('sendInfoAboutDetectedAttackToNavigation', this.callModule);
        }
    }.observes('adat'),


    _loadData: function() {

    },

    actions: {
        expand: function(){
          if (this.expanded===true) {
              this.set('expanded',false);
          }
          else{
              this.set('expanded',true);
          }

        }.on('expand')
    },


    toolboxTemplate: 'ids/modules/ids-ttl-flood-attack-probability--toolbox'



});

export default IdsTtlFloodAttackProbabilityController;
