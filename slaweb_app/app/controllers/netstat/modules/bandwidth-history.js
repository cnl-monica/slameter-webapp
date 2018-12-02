import NetstatBaseModuleWithChartController from '../base-module-with-chart';

var BandwidthHistoryController = NetstatBaseModuleWithChartController.extend({
    chartDataLabel: 'Bandwidth',
    chartDataLabel_sk: 'Šírka pásma'
});

export default BandwidthHistoryController;