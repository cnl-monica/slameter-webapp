import NetstatBaseModuleWithChartController from '../base-module-with-chart';

var BandwidthHistoryController = NetstatBaseModuleWithChartController.extend({
    chartDataLabel: 'Packet Bandwidth',
    chartDataLabel_sk: 'Šírka pásma paketov'
});

export default BandwidthHistoryController;