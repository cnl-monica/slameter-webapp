/*
 * Flot plugin to display bars side by side.
 *
 * Released under the MIT licence by Ján JUHÁR, 22-Aug-2013.
 *
 * Inspired by and based upon orderBars plugin, released under the MIT license by Benjamin BUFFET, 20-Sep-2010.
 *     ( http://en.benjaminbuffet.com/labs/flot/ )
 *
 * USAGE:
 * To activate the plugin you must set the parameter "options.series.sideBySideBars.show" to "true":
 *     $.plot($("#placeholder"), [... plot data ...], { series: { sideBySideBars: { show: true } } });
 * Other supported options of sideBySideBars object:
 *     combinedWidth - if set to a number, it specifies combined width of all displayed bars
 *         in units of the axis against which they are plotted. If set to falsy value, each bar gets its width
 *         from its own series settings.
 *     gutterPx - gutter between bars, in pixels
 * It is also possible to set "order" attribute to specific series bar object,
 *     in which case it is used to change bar order:
 *         $.plot($("#placeholder"), [{ data: [ ... ], bars :{ order = null or integer }])
 * If 2 series have the same order param, they are ordered by the position in the array;
 *
 *
 */

(function($){
    "use strict";

    function init(plot){
        var plotOptions,
            barSeries,
            nbOfBarSeries,
            borderWidth,
            gutterWidth,
            borderWidthInXabsWidth,
            gutterWidthInXabsWidth,
            pixelInXWidthEquivalent = 1,
            plotUsesPlugin = false,
            isHorizontal = false;


        function checkOptions(plot, options) {
            if (options.series.sideBySideBars && options.series.sideBySideBars.show) {
                plotOptions = options;
                plotUsesPlugin = true;
            }
        }

        function sideBySideBars(plot, serie, datapoints){
            var shiftedPoints = null;
            var position;

            if ( !plotUsesPlugin ) {
                return;
            }
            
            if(serieIsShowingBars(serie)){
                checkIfGraphIsHorizontal(serie);
                calculPixel2XWidthConvert(plot, serie);
                retrieveBarSeries(plot);
                calculBorderAndGutterWidth(serie);

                position = findPosition(serie);

                if (position === 0 ) {
                    for (var i = 0; i < nbOfBarSeries; i++) {
                        correctBarWidth(barSeries[i]);
                    }
                }

                if(nbOfBarSeries >= 2){
                    var shift = sumWidth(barSeries, 0, position);

                    shiftedPoints = shiftPoints(datapoints,serie,shift);
                    datapoints.points = shiftedPoints;
               }
           }
        }

        function correctBarWidth(serie) {
            var combinedWidth = plotOptions.series.sideBySideBars.combinedWidth;

            if (combinedWidth) {
                serie.bars.barWidth = (combinedWidth / nbOfBarSeries) - borderWidthInXabsWidth*2 - gutterWidthInXabsWidth;
            } else {
                serie.bars.barWidth -= borderWidthInXabsWidth*2 + gutterWidthInXabsWidth;
            }
        }

        function getFullSerieWidth(serie) {
            return serie.bars.barWidth + borderWidthInXabsWidth*2 + gutterWidthInXabsWidth;
        }

        function serieIsShowingBars(serie){
            return serie.show && serie.bars != null && serie.bars.show;
        }

        function calculPixel2XWidthConvert(plot, serie){
            var gridDimSize = isHorizontal ? plot.getPlaceholder().innerHeight() : plot.getPlaceholder().innerWidth();
            var minMaxValues = isHorizontal ? getAxeMinMaxValues(serie,1) : getAxeMinMaxValues(serie,0);
            var AxeSize = minMaxValues[1] - minMaxValues[0];
            pixelInXWidthEquivalent = AxeSize / gridDimSize;
        }

        function getAxeMinMaxValues(serie,AxeIdx){
            var minMaxValues = [];
            minMaxValues[0] = serie.datapoints.points[AxeIdx];
            minMaxValues[1] = serie.datapoints.points[((serie.datapoints.points.length/serie.datapoints.pointsize) - 1)*serie.datapoints.pointsize + AxeIdx];
            return minMaxValues;
        }

        function retrieveBarSeries(plot){
            barSeries = findBarSeries(plot.getData());
            nbOfBarSeries = barSeries.length;
        }

        function findBarSeries(series){
            var retSeries = [];

            for(var i = 0; i < series.length; i++){
                if( serieIsShowingBars(series[i]) ){
                    retSeries.push(series[i]);
                }
            }

            return retSeries.sort(sortByOrder);
        }

        function sortByOrder(serie1,serie2){
            var x = serie1.bars.order;
            var y = serie2.bars.order;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }

        function  calculBorderAndGutterWidth(serie){
            borderWidth = serie.bars.lineWidth ? serie.bars.lineWidth  : 2;
            gutterWidth = plotOptions.series.sideBySideBars.gutterPx;
            borderWidthInXabsWidth = borderWidth * pixelInXWidthEquivalent;
            gutterWidthInXabsWidth = gutterWidth * pixelInXWidthEquivalent;
        }
        
        function checkIfGraphIsHorizontal(serie){
            if(serie.bars.horizontal){
                isHorizontal = true;
            }
        }

        function findPosition(serie){
            var pos;
            for (pos = 0; pos < barSeries.length; pos++) {
                if (serie == barSeries[pos]){
                    break;
                }
            }

            return pos;
        }

        function sumWidth(series,start,end){
            var totalWidth = 0;

            for(var i = start; i < end; i++){
                totalWidth += getFullSerieWidth(series[i]);
            }

            return totalWidth;
        }

        function shiftPoints(datapoints,serie,dx){
            var ps = datapoints.pointsize;
            var points = datapoints.points;
            // If align is set to center, move points half of the full width to left.
            // Then move it half of current serie width back to the right, because flot internally will make counter movement.
            var alignShift = serie.bars.align === "center" ? sumWidth(barSeries, 0, nbOfBarSeries) / 2 - getFullSerieWidth(serie) / 2 : 0;
            var j = 0;           
            for(var i = isHorizontal ? 1 : 0;i < points.length; i += ps){
                points[i] += dx - alignShift;
                //Adding the new x value in the serie to be able to display the right tooltip value,
                //using the index 3 to not override the third index.
                serie.data[j][3] = points[i];
                j++;
            }

            return points;
        }

        plot.hooks.processOptions.push(checkOptions);
        plot.hooks.processDatapoints.push(sideBySideBars);

    }

    var options = {
        series : {
            bars: {order: null},
            sideBySideBars: {
                show: false,
                combinedWidth: 1,
                gutterPx: 0
            }
        }
    };

    $.plot.plugins.push({
        init: init,
        options: options,
        name: "sideBySideBars",
        version: "0.1"
    });

})(jQuery);

