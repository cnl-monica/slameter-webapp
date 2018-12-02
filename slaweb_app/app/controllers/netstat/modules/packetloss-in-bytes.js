import NetstatBaseModuleWithChartController from '../base-module-with-chart';
import acpData from 'slameter/lib/acp-data';

var PacketlossInBytesController = NetstatBaseModuleWithChartController.extend({
    chartDataLabel: 'PacketlossInB',
    name: 'packetlossInB',

    chartPointCount: 500,

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

    addToArray: function() {
        var array = this.get('array');
        array.shift();
        array.push(this.get('adat'));

        this.set('data', [
            {
                data: array,
                label: this.get('chartDataLabel')
            }
        ]);
    }.observes('adat'),


    _loadData: function() {

    },

    actions: {
        pause: function() {
            var subscription = this.get('subscription');
            if (subscription.getState() === 'running') {
                subscription.pause();

            } else if(subscription.getState() === 'paused'){
                subscription.resume();
            }
        },
        unsubscribe: function() {
            var subscription = this.get('subscription');
            subscription.unsubscribe();
        },

        play: function() {
            var self = this;{}
            acpData.init(this.get('session._authToken')).then(function() {
                var subscription = acpData.subscribe(self, 'adat', {module: self.get('name')});
                self.set('subscription', subscription);
            });
        }
    },


    toolboxTemplate: 'netstat/modules/packetloss-in-bytes--toolbox'



});

export default PacketlossInBytesController;