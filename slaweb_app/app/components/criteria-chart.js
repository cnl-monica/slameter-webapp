import BaseChartComponent from './base-chart';
import {bytesTo} from 'slameter/lib/data-units';

var LineChartComponent = BaseChartComponent.extend({
    zoom: false ,
    xAxisMode: 'categories',
    xAxisTicks: undefined,
    yAxisTicks: 'flotExtensions.dataTicks',
    yAxisTickFormatter: 'flotExtensions.tickFormatters.dataVolume',

    bars: {
        align: "center",
        barWidth: 0.35,
        show: true,
        points: {
            show: false
        }
    },
    tooltipFormatter: 'flotExtensions.tooltipFormatters.criteria',
    lines: {
        show: false
    },
    sideBySideBars: { show: true }

});

export default LineChartComponent;