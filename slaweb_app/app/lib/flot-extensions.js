import Ember from 'ember';

import {bytesTo, bpsTo} from 'slameter/lib/data-units';

/**
 * Tick generator for data axis.
 * Enables correct rounding for axis showing data (amount/speed) values.
 *
 * @param axis flot axis object
 * @returns {Array} array of generated ticks
 */
var dataTicks = function(axis) {
    var preDelta = axis.delta,
        deltaPower = Math.floor(Math.log(preDelta) / Math.log(1024)),
        deltaBase = Math.pow(1024, deltaPower),
        tempBase = preDelta / deltaBase,
        magn10Power = Math.floor(Math.log(tempBase) / Math.log(10)),
        magn10Base = Math.pow(10, magn10Power),
        norm = tempBase / magn10Base,
        tick = magn10Base * Math.ceil(norm) * deltaBase,
        i = 0, ticks = [];

    do {
        ticks.push(axis.min + i*tick);
        i++;
    } while (ticks[ticks.length-1] < axis.datamax);
    return ticks;
};



var makeChartTooltip = function(flotContainerElement) {
var previousPoint = null;
    var tooltipShowing = false;
    var tooltipFadeTimeout;

    $(flotContainerElement).tooltipster({
        position: "top-left",
        trigger: "custom",
        arrow: false,
        updateAnimation: false,
        contentAsHTML: true,
        content: "",
        theme: "flot-tooltip",
        functionReady: function(origin, tooltip) {
            // delay setting of a class that enables position transitions,
            // to prevent some browsers transitioning tooltip from [0,0] to first position
            window.setTimeout(function(){
                tooltip.addClass("animate-position");
            }, 10);
        }
    });

    $(flotContainerElement).bind("plothover", function (event, pos, item) {
        var $self = $(this),
            x, y, options, dataPoint, tooltipContent, tooltipContext,
            xFormatted, yFormatted;
        if (item) {
            dataPoint = item.datapoint;
            if ( !previousPoint || previousPoint[0] !== dataPoint[0] || previousPoint[1] !== dataPoint[1]) {
                previousPoint = item.datapoint;
                window.clearTimeout(tooltipFadeTimeout);
                options = $self.data("tooltipster").options;
                if(!item.series.pie.show) {
                    x = item.datapoint[0];
                    y = item.datapoint[1].toFixed(2);

                    xFormatted = item.series.xaxis.options.tooltipFormatter && typeof item.series.xaxis.options.tooltipFormatter === 'function' ?
                        item.series.xaxis.options.tooltipFormatter(item.datapoint[0], item.series.xaxis) :
                        item.series.xaxis.tickFormatter(item.datapoint[0], item.series.xaxis);
                    yFormatted = item.series.yaxis.options.tooltipFormatter && typeof item.series.yaxis.options.tooltipFormatter === 'function' ?
                        item.series.yaxis.options.tooltipFormatter(item.datapoint[1], item.series.yaxis) :
                        item.series.yaxis.tickFormatter(item.datapoint[1], item.series.yaxis);

                    tooltipContext = {
                        x: xFormatted,
                        y: yFormatted,
                        series: item.series
                    };
                    options.offsetX = item.pageX - $self.offset().left + 16;
                    options.offsetY = -item.pageY + $self.offset().top + 16;
                }
                else{
                    tooltipContext = {series: item.series};
                    options.offsetX = pos.pageX-$self.offset().left;
                    options.offsetY = -pos.pageY+$self.offset().top;
                }

                if (item.series.tooltipFormatter && typeof item.series.tooltipFormatter === 'function') {
                    tooltipContent = item.series.tooltipFormatter(tooltipContext);
                } else {
                    tooltipContent = item.series.label + ": " + xFormatted + ", " + yFormatted;
                }

                $self.tooltipster("content", tooltipContent).tooltipster("show");
                tooltipShowing = true;
            }
        } else {
            if (tooltipShowing) {
                tooltipFadeTimeout = window.setTimeout(function(){$self.tooltipster("hide");}, 330);
                tooltipShowing = false;
            }
            previousPoint = null;
        }
    });
};


//---------- Formatters --------------

var tooltipTemplates = {
    date: Handlebars.compile('{{series.label}}: <b>{{y}}</b><br />Date: {{x}}'),
    criteria: Handlebars.compile('Transferred Data: <b>{{y}}</b><br /> For {{series.label}} Per selected Criterium on X axis'),
    compUsers: Handlebars.compile('{{series.label}}: <b>{{y}}</b><br /> Per selected Accounting Entity on X axis'),
    pie: // Handlebars.compile("{{partial 'applications/partials/pie-tooltip'}}")
    Handlebars.compile(
        '<div class="pie-chart-tooltip">' +
        '<span><b>{{label}}</b></span><br>' +
        '<span>Ingress Bytes: <b>{{download}}</b></span><br>' +
        '<span>Egress Bytes: <b>{{upload}}</b></span><br>' +
        '<span>Sum: <b>{{sum}}</b></span><br>' +
        '<span>Percent: <b>{{procent}}%</b></span><br>' +
        '</div>')

};

var tooltipFormatters = {
    bandwidth: function(item) {
        return tooltipTemplates.date(item);
    },
    criteria: function(item) {
        return tooltipTemplates.criteria(item);
    },
    comparingUsers: function(item){
        return tooltipTemplates.compUsers(item);
    },
    pie: function(item){
        return tooltipTemplates.pie({
            label: item.series.label,
            download: bytesTo.auto(item.series.download) || '0 B',
            upload: bytesTo.auto(item.series.upload) || '0 B',
            sum: bytesTo.auto(item.series.download + item.series.upload) || '0 B',
            //percent: (item.series.percent).toFixed(2)
            procent: item.series.procent
        });
    }
};


var tickFormatters = {
    dataBandwidth: function(value, axis) {
        return bytesTo.auto(value, axis.tickDecimals) + '/s';
    },
    dataVolume: function(value, axis) {
        return bytesTo.auto(value, axis.tickDecimals);
    },

    dataSpeed: function(value, axis) {
        return bpsTo.auto(value, axis.tickDecimals);
    },

    packetBandwidth: function(value, axis) {
        return value.toFixed(2) + ' p/s';
    },

    flowBandwidth: function(value, axis) {
        return value + ' f/s';
    },

    onlyDays: function(value, axis) {
        return moment(value).format('MM/DD/YYYY');
    },

    synCount: function(value, axis) {
        return value.toFixed(0) + ' SYN';
    },

    udpCount: function(value, axis) {
        return value.toFixed(0) + ' UDP';
    },

    portCount: function(value, axis) {
        return value.toFixed(0) + ' PORT';
    },

    rstCount: function(value, axis) {
        return value.toFixed(0) + ' RST';
    },

    ttlCount: function(value, axis) {
        return value.toFixed(0) + ' TTL';
    },

    finCount: function(value, axis) {
        return value.toFixed(0) + ' FIN';
    },

    percentCount: function(value, axis) {
        return value.toFixed(0) + ' %';
    }
};

var flotExtensions = {
    dataTicks: dataTicks,
    makeChartTooltip: makeChartTooltip,
    tooltipFormatters: tooltipFormatters,
    tickFormatters: tickFormatters
};


export default flotExtensions;
