import Ember from 'ember';

import IdsBaseModuleWithChartController from '../base-module-with-chart';
import idsData from 'slameter/lib/ids-data';

var IdsPortScanAttackController = IdsBaseModuleWithChartController.extend({

    name: 'IdsPortScanAttack',

    expanded: true,

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
//        if (adat3[2] === true){
//            this.send('showMessage', 'Port scan attack detected with count: ' + adat3[1] + '!', 'error');
//        }
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


    toolboxTemplate: 'ids/modules/ids-port-scan-attack--toolbox'



});

export default IdsPortScanAttackController;
