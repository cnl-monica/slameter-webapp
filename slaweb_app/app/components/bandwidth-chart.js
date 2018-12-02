import Ember from 'ember';

import BaseChartComponent from './base-chart';
import {bytesTo} from 'slameter/lib/data-units';

var LineChartComponent = BaseChartComponent.extend({

    xAxisMode: 'time',
    xAxisTicks: 5,
    xAxisTooltipFormatter: function(value, axis) {
        return moment(value).format('MM/DD/YYYY HH:mm:ss');
    },
    xAxisTickFormatter: function(value, axis) {
        return moment(value).format('MM/DD/YY<br>HH:mm:ss');
    },

    yAxisTicks: 'flotExtensions.dataTicks',
    yAxisTickFormatter: 'flotExtensions.tickFormatters.dataBandwidth',
    tooltipFormatter: 'flotExtensions.tooltipFormatters.bandwidth',

    lineSteps: true
});

export default LineChartComponent;
