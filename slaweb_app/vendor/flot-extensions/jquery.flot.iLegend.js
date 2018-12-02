(function($) {
    "use strict";

    // TODO odstranovat stare event handlery

    function init(plot) {
        var isActive = false,
            plotOptions,
            container,
            seriesIndex = 0,
            fullData = [],
            inactiveSeriesLabels = [];

        function usingCustomLegend() {
            return isActive || plotOptions.legend.show === "custom";
        }

        function findSeriesIndexByLabel(series, label) {
            var i;
            for (i = 0; i < series.length; i++) {
                if ( series[i].label === label ) {
                    return i;
                }
            }
            return null;
        }

        function processOptionsHook(plot, options) {
            plotOptions = options;
            seriesIndex = 0;
            if ( usingCustomLegend() ) {
                isActive = true;
                options.legend.show = false;
                container = options.legend.iLegend.container;
            }
        }

        function saveFullData(plot, series, data, datapoints) {
            var index;
            if ( usingCustomLegend() ) {
                index = findSeriesIndexByLabel(fullData, series.label);
                if (index !== null) {
                    fullData[index] = series;
                } else {
                    fullData.push(series);
                }
            }
        }

        function hideOrShowSeries(plot, series, data, datapoints) {
            if (inactiveSeriesLabels.indexOf(series.label) >= 0) {
                datapoints.format = { };
                series.show = false;
            } else {
                series.show = true;
            }
        }

        function legendClick(){
            var iOptions = plot.getOptions().legend.iLegend;

            if (fullData.length - inactiveSeriesLabels.length === 1) {
                return;
            }

            var $this = $(this),
                label = $this.data("seriesLabel");
            $this.toggleClass(iOptions.inactiveSeriesStateClass);

            if ( $this.hasClass(iOptions.inactiveSeriesStateClass) ) {
                // Add to list of inactive series
                inactiveSeriesLabels.push(label);
            } else {
                // Remove from list of inactive series
                inactiveSeriesLabels.splice(inactiveSeriesLabels.indexOf(label), 1);
            }

            // Redraw the plot
            plot.setData(fullData);
            plot.setupGrid();
            plot.draw();
        }

        function makeLegend(plot) {
            if (!usingCustomLegend()) {
                return;
            }

            var series = plot.getData(),
                options = plot.getOptions(),
                iOptions = options.legend.iLegend,
                labelFormatter = options.legend.labelFormatter,
                seriesEl, symbolEl, labelEl,
                i, s, label, entries = [], entry;

            if (seriesIndex === 0) {  // process only once

                // Build a list of legend entries, with each having a label, formatted label and a color
                for (i = 0; i < series.length; i++) {
                    s = series[i];
                    if (s.label) {
                        label = labelFormatter ? labelFormatter(s.label, s) : s.label;
                        if (label) {
                            entries.push({
                                label: s.label,
                                formattedLabel: label,
                                color: s.color
                            })
                        }
                    }
                }

                // Sort the legend using either the default or a custom comparator
                if (options.legend.sorted) {
                    if ($.isFunction(options.legend.sorted)) {
                        entries.sort(options.legend.sorted);
                    } else if (options.legend.sorted == "reverse") {
                        entries.reverse();
                    } else {
                        var ascending = options.legend.sorted != "descending";
                        entries.sort(function(a, b) {
                            return a.formattedLabel == b.formattedLabel ? 0 : (
                                (a.formattedLabel < b.formattedLabel) != ascending ? 1 : -1   // Logical XOR
                                );
                        });
                    }
                }

                // Empty container
                container.addClass(options.legend.iLegend.containerClass).html("");

                // Generate legend
                for (i = 0; i < entries.length; i++) {
                    entry = entries[i];

                    symbolEl = $("<"+iOptions.symbolElementName+">").addClass(iOptions.symbolClass).css("backgroundColor", entry.color);
                    labelEl = $("<"+iOptions.labelElementName+">").addClass(iOptions.labelClass).html(entry.formattedLabel);
                    seriesEl = $("<"+iOptions.seriesElementName+">").addClass(iOptions.seriesClass).append(symbolEl).append(labelEl).appendTo(container);
                    // Store series label for referencing in click event handler
                    seriesEl.data("seriesLabel",entry.label);

                    if (inactiveSeriesLabels.indexOf(entry.label)>=0) {
                        seriesEl.addClass(iOptions.inactiveSeriesStateClass);
                    }

                    if ( iOptions.interactive )  {
                        container.addClass(iOptions.interactiveClass);

                        // Bind click event
                        seriesEl.on('click', legendClick);

                        plot.hooks.shutdown.push(function(el) {
                            return function closure() {
                                el.off('click', legendClick);

                            };
                        }(seriesEl));
                    } else {
                        container.removeClass(iOptions.interactiveClass);
                    }



                }

            }
            seriesIndex = seriesIndex < series.length ? seriesIndex + 1 : 0;  // process only once
        }

        plot.hooks.processOptions.push(processOptionsHook);
        plot.hooks.processRawData.push(saveFullData);
        plot.hooks.processRawData.push(hideOrShowSeries);
        plot.hooks.processDatapoints.push(makeLegend);

    }

    var plotOptions = {
        legend: {
            iLegend: {
                interactive: true,
                containerClass: "flot-ilegend",
                seriesClass: "series",
                inactiveSeriesStateClass: "is-inactive",
                seriesElementName: "div",
                symbolClass: "symbol",
                symbolElementName: "span",
                labelClass: "label",
                labelElementName: "span",
                interactiveClass: "is-interactive"
            }
        }, series: {
            show: true
        }

    };

    $.plot.plugins.push({
        init: init,
        options: plotOptions,
        name: "iLegend",
        verstion: "0.1"
    });

}(jQuery));