import BaseChartComponent from './base-chart';
import {colors} from 'slameter/lib/misc';
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
    yAxisTickFormatter: 'flotExtensions.tickFormatters.synCount',

    tooltipFormatter: 'flotExtensions.tooltipFormatters.bandwidth',

    lineSteps: false,

    colors: [
        colors.midblue,
        colors.darkgreen,
        colors.darkred,
        colors.midyellow,
        colors.darkblue
    ],

    options: function() {
        return {
            xaxis: {
                mode: this.get('xAxisMode'),
                timeformat: this.getWithDefault('timeformat', '%H:%M:%S'),
                timezone: 'browser',
                ticks: this.isCategories(),
                tooltipFormatter:  this.lookupFlotExtension(this.get('xAxisTooltipFormatter')),
                tickFormatter:  this.lookupFlotExtension(this.get('xAxisTickFormatter')),
                minTickSize: this.lookupFlotExtension(this.get('xAxisMinTickSize'))
            },
            yaxis: {
                min: 0,
                ticks: this.lookupFlotExtension(this.get('yAxisTicks')),
                tooltipFormatter:  this.lookupFlotExtension(this.get('yAxisTooltipFormatter')),
                tickFormatter:  this.lookupFlotExtension(this.get('yAxisTickFormatter'))
            },
            series: {
                shadowSize: 0,
                lines: this.get('lines') || {
                    show: true,
                    align: 'center',
                    lineWidth: 1.5,
                    steps: this.get('lineSteps'),
                    simplify: this.get('simplifyFactor')
                },
                bars: this.get('bars') || {
                    show: false
                },
                sideBySideBars: this.get('sideBySideBars') || null,
                tooltipFormatter: this.lookupFlotExtension(this.get('tooltipFormatter'))
            },

            grid: {
                hoverable: true,
                autoHighlight: true,
                borderWidth: 2,
                borderColor: colors.midgreen,
                gridColor: colors.midgreen
            },
            legend: {
                show: 'custom',
                iLegend: {
                    container: this.$('.flot-legend').first(),
                    interactive: true
                }
            },
            selection: {
                mode: 'x',
                color: colors.lightyellow
            },
            colors: this.get('color') ? [this.get('color')] : this.get('colors')
        };
    }.property()


});

export default LineChartComponent;