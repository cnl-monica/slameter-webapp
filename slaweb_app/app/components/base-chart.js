import Ember from 'ember';

import {bytesTo} from 'slameter/lib/data-units';
import {colors} from 'slameter/lib/misc';
import flotExtensions from 'slameter/lib/flot-extensions';

var BaseChartComponent = Ember.Component.extend({

    /**
     * Name of the layout template
     */
    layoutName: 'components/baseChart',

    /**
     * makes flotExtensions available on the scope of the chart component
     */
    flotExtensions: flotExtensions,

    /**
     * Enables/disables zoom function
     *
     * @property zoom
     */
    zoom: true,

    /**
     * Function for formatting tooltip content
     *
     * @property tooltipFormatter
     */
    tooltipFormatter: null,

    /**
     * Factor by which simplify the line of the chart
     *
     * @property simplifyFactor
     */
    simplifyFactor: 0.2,

    /**
     * Type of the x axis, as defined in Flot API
     *
     * @property xAxisMode
     */
    xAxisMode: 'time',

    /**
     * Settings fro x axis ticks, as defined in Flot API
     *
     * @property xAxisTicks
     */
    xAxisTicks: 5,

    /**
     * Formatter for x axis values
     *
     * @property xAxisTickFormatter
     */
    xAxisTickFormatter: null,

    /**
     * Formatter for x axis tooltip
     *
     * @property xAxisTooltipFormatter
     */
    xAxisTooltipFormatter: null,

    /**
     * Min tick size, as in Flot API
     *
     * @property xAxisMinTickSize
     */
    xAxisMinTickSize: null,

    /**
     * Settings fro y axis ticks, as defined in Flot API
     *
     * @property yAxisTicks
     */
    yAxisTicks: 5,

    /**
     * Formatter for y axis values
     *
     * @property yAxisTickFormatter
     */
    yAxisTickFormatter: null,

    /**
     * Formatter for y axis tooltip
     *
     * @property yAxisTooltipFormatter
     */
    yAxisTooltipFormatter: null,

    /**
     * Draw line chart with steps
     *
     * @property lineSteps
     */
    lineSteps: false,

    /**
     * Color for chart
     */
    colors: [
        colors.midblue,
        colors.darkgreen,
        colors.darkred,
        colors.midyellow,
        colors.darkblue
    ],

    /**
     * Options for main chart
     *
     * @property options
     */
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
                pie: this.get('pie') || {
                    show: false
                },
                sideBySideBars: this.get('sideBySideBars') || null,
                tooltipFormatter: this.lookupFlotExtension(this.get('tooltipFormatter'))
            },
            /*crosshair: {
                mode: 'x',
                color: colors.grey4
            },*/
            grid: {
                hoverable: true,
                autoHighlight: true,
                borderWidth: 1,
                borderColor: colors.grey3,
                gridColor: colors.grey5
            },
            legend: {
                show: 'custom',
                iLegend: {
                    container: this.get('pie') ? this.$('.flot-pie-legend').first() : this.$('.flot-legend').first(),
                    interactive: this.get('pie') ? false : true
                }
            },
            selection: {
                mode: 'x',
                color: colors.lightyellow
            },
            colors: this.get('color') ? [this.get('color')] : this.get('colors')
        };
    }.property(),


    isCategories: function(){
        if (this.xAxisMode === 'categories'){
            return null;
        }
        else {
            return this.get('xAxisTicks');
        }
    },

    /**
     * Options for zoom overview chart
     *
     * @property overviewOptions
     */
    overviewOptions: function() {
        return {
            xaxis: {
                mode: this.get('xAxisMode'),
                ticks: [],
                timezone: 'browser'
            },
            yaxis: {
                ticks: [],
                autoscaleMargin: 0.1
            },
            series: {
                shadowSize: 0,
                lines: {
                    show: true,
                    simplify: this.get('simplifyFactor')
                }
            },
            lines: {
                lineWidth: 1,
                steps: true
            },
            grid: {
                borderWidth: 1,
                borderColor: colors.grey4
            },
            legend: {
                show: false
            },
            selection: {
                mode: 'x',
                color: colors.lightyellow
            },
            colors: this.get('color') ? [this.get('color')] : this.get('colors')
        };
    }.property(),

    lookupFlotExtension: function(value) {
        if (typeof value === 'string' && value.indexOf('flotExtensions') === 0) {
            return Ember.get(this, value);
        }

        return value;
    },

    /**
     * Gets data for chart, if needed for given range if x values
     *
     * @method getData
     */
    getData: (function(){
        function copySeriesWithoutData(series) {
            var newSeries = {}, item;

            for(item in series) {
                if (Object.prototype.hasOwnProperty.call(series, item) && item !== 'data') {
                    newSeries[item] = series[item];
                }
            }
            return newSeries;
        }

        function filterRange(array, from, to) {
            if (!from || !to) {
                return array;
            }

            return Ember.EnumerableUtils.filter(array, function(item) {
                return item[0] >= from && item[0] <= to;
            });
        }

        return function(from, to) {
            var data = this.get('data');

            if(Ember.isArray(data)) {
                data = Ember.EnumerableUtils.map(data, function(series){
                    if (Ember.isArray(series)) {
                        return filterRange(series, from, to);
                    } else {
                        var newSeries = copySeriesWithoutData(series);
                        newSeries.data = filterRange(series.data, from, to);
                        return newSeries;
                    }
                });
            }
            return data;
        };
    }()),

    /**
     * Makes chart
     *
     * @method _makeFlotChart
     * @private
     */
    _makeFlotChart: function() {
        if (this.get('flot')) {
            this.updateFlotChart();
            return;
        }

        var chartElement = this.$('.chart').get(0),
            overviewChartElement = this.$('.chart-overview').get(0),
            data = this.getData(),
            options = this.get('options'),
            flot, overviewFlot;

        if (!this.get('zoom')) {
            options.selection = {};
        }

        flot = $.plot(chartElement, data, options);

        if (this.get('zoom')) {
            overviewFlot = $.plot(overviewChartElement, data, this.get('overviewOptions'));

            $(chartElement).on('plotselected.chartaction', $.proxy(this.plotSelected, this));
            $(overviewChartElement).on('plotselected.chartaction', $.proxy(this.overviewPlotSelected, this));
            $([overviewChartElement, chartElement]).on('dblclick.chartaction', $.proxy(this.cancelZoom, this));
        }

        flotExtensions.makeChartTooltip(chartElement);

        this.set('flot', flot);
        this.set('overviewFlot', overviewFlot);

    },
    /**
     * Public method for making chart, throttles the actual flot creatio method
     *
     * @method makeFlotChart
     */
    makeFlotChart: function() {
        Ember.run.once(Ember.run.bind(this, this._makeFlotChart));
    }.observes('data'),

    /**
     * Updates existing flot chart
     *
     * @method updateFlotChart
     */
    updateFlotChart: function() {
        var flot = this.get('flot'),
            overviewFlot = this.get('overviewFlot'),
            data = this.getData();

        this.clearSelection();

        $(flot.getPlaceholder()).off('plothover');

        if (flot) {
            flot.setData(data);
            flot.setupGrid();
            flot.draw();
        }

        if (overviewFlot && this.get('zoom')) {
            overviewFlot.setData(data);
            overviewFlot.setupGrid();
            overviewFlot.draw();
        }

        flotExtensions.makeChartTooltip(flot.getPlaceholder());

    },

    /**
     * Action to take when plot is selected
     *
     * @param event
     * @param ranges
     */
    plotSelected: function(event, ranges) {
        var flot = this.get('flot'),
            overviewFlot = this.get('overviewFlot');

        flot.clearSelection();
        flot.setData(this.getData(ranges.xaxis.from, ranges.xaxis.to));
        flot.setupGrid();
        flot.draw();

        // set selection without event firing to prevent loop
        if (overviewFlot) {
            overviewFlot.setSelection(ranges, true);
        }
    },

    /**
     * Action to take when overview plot is selected
     *
     * @param event
     * @param ranges
     */
    overviewPlotSelected: function(event, ranges) {
        this.get('flot').setSelection(ranges);
    },

    /**
     * Clears selection on chart
     */
    clearSelection: function() {
        var flot = this.get('flot'),
            overviewFlot = this.get('overviewFlot'),
            options = this.get('options');

        if (flot) {
            flot.clearSelection();
        }

        if (overviewFlot) {
            overviewFlot.clearSelection();
        }
    },

    /**
     * Cancels zoom - draws chart with full data
     */
    cancelZoom: function() {
        var flot = this.get('flot');

        this.clearSelection();

        flot.setData(this.getData());
        flot.setupGrid();
        flot.draw();
    },

    /**
     * Initial chart creation on `didInsertElement` Ember action
     */
    didInsertElement: function() {
        if (this.getData()) {
            this.makeFlotChart();
        }
    },

    /**
     * Destroing chart on element destroy
     */
    willDestroy: function() {
        var flot = this.get('flot'),
            overviewFlot = this.get('overviewFlot'),
            chartElement = this.$('.chart') && this.$('.chart').get(0),
            overviewChartElement = this.$('.chart-overview') && this.$('.chart-overview').get(0);

        if (flot) {
            flot.shutdown();
            this.set('flot', null);
        }
        if (overviewFlot) {
            overviewFlot.shutdown();
            this.set('overviewFlot', null);
        }

        $([chartElement, overviewChartElement]).off('.chartaction');
    }
});

export default BaseChartComponent;
