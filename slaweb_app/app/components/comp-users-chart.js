import CriteriaChart from './criteria-chart';
import {bytesTo} from 'slameter/lib/data-units';

var LineChartComponent = CriteriaChart.extend({
    tooltipFormatter: 'flotExtensions.tooltipFormatters.comparingUsers'
});

export default LineChartComponent;
