import BaseChartComponent from './base-chart';

var PieChartComponent =  BaseChartComponent.extend({
        container: window.$('.flot-pie-legend').first(),
        interactive: false,
        pie: {
            show: true,
            label: {
                show: false
            }
        },
        zoom: false,
        lines: {
            show: false
        },
        tooltipFormatter: 'flotExtensions.tooltipFormatters.pie'

});


export default PieChartComponent;
