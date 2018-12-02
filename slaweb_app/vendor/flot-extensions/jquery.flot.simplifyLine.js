/* globals Uint8Array */

/**
 * Line simplification for flot.
 * Usage:
 *  specify epsilon for simplification on `lines` configuration property as follows:
 *      flotOptions.series.lines.simplify: 0.2
 *  or on data series
 *      $.plot($element, [
 *        data: [...],
 *        lines: {
 *          simplify: 0.2
 *        }
 *      ], options);
 */


(function() {

    /*
     (c) 2013, Vladimir Agafonkin
     Simplify.js, a high-performance JS polyline simplification library
     mourner.github.io/simplify-js
     */

    // square distance between 2 points
    function getSqDist(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1];

        return dx * dx + dy * dy;
    }

    // square distance from a point to a segment
    function getSqSegDist(p, p1, p2) {
        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y;

        if (dx !== 0 || dy !== 0) {

            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2[0];
                y = p2[1];

            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p[0] - x;
        dy = p[1] - y;

        return dx * dx + dy * dy;
    }

    // basic distance-based simplification
    function simplifyRadialDist(points, sqTolerance) {
        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;

        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];

            if (getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) newPoints.push(point);

        return newPoints;
    }

    // simplification using optimized Douglas-Peucker algorithm with recursion elimination
    function simplifyDouglasPeucker(points, sqTolerance) {
        var len = points.length,
            MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
            markers = new MarkerArray(len),
            first = 0,
            last = len - 1,
            stack = [],
            newPoints = [],
            i, maxSqDist, sqDist, index;

        markers[first] = markers[last] = 1;

        while (last) {
            maxSqDist = 0;

            for (i = first + 1; i < last; i++) {
                sqDist = getSqSegDist(points[i], points[first], points[last]);

                if (sqDist > maxSqDist) {
                    index = i;
                    maxSqDist = sqDist;
                }
            }

            if (maxSqDist > sqTolerance) {
                markers[index] = 1;
                stack.push(first, index, index, last);
            }

            last = stack.pop();
            first = stack.pop();
        }

        for (i = 0; i < len; i++) {
            if (markers[i]) newPoints.push(points[i]);
        }

        return newPoints;
    }

    // both algorithms combined for awesome performance
    function simplify(points, tolerance, highestQuality) {
        if (points.length <= 1) return points;

        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

        points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
        points = simplifyDouglasPeucker(points, sqTolerance);

        return points;
    }

    //--------------------------------------------------------

    // TODO add reduce shim

    function init(plot) {

        function findMax(array2d, index) {
            return array2d.reduce(function (val, obj) {
                return obj[index] > val ? obj[index] : val;
            }, Number.MIN_VALUE);
        }

        function findMin(array2d, index) {
            return array2d.reduce(function (val, obj) {
                return obj[index] < val ? obj[index] : val;
            }, Number.MAX_VALUE);
        }

        function ratio(plot, serie, index) {
            var gridDimSize = index === 0 ? plot.getPlaceholder().innerWidth() : plot.getPlaceholder().innerHeight();
            var minValue = findMin(serie.data, index);
            var maxValue = findMax(serie.data, index);
            var axeSize = maxValue - minValue;
            return axeSize / gridDimSize;
        }

        function simplifyLine(plot, series, data, datapoints) {
            var factor,
                epsilon,
                iter = 0;

            if (data.lines && (!data.lines.show || !series.lines.simplify)) {
                return;
            }

            if (!series.lines || !series.lines.show || !series.lines.simplify) {
                return;
            }

            if (data.length < 3000) {
                return;
            }

            epsilon = typeof series.lines.simplify === 'number' ? series.lines.simplify : 0.2;
            factor = Math.sqrt(ratio(plot, series, 0) * ratio(plot, series, 1)) * epsilon;
            series.data = simplify(data, factor);

            // if too simplified, try to make few steps back...
            while (series.data.length < 1200 && iter < 4) {
                factor = factor / 2;
                iter++;
                series.data = simplify(data, factor);
            }

        }

        plot.hooks.processRawData.push(simplifyLine);
    }

    $.plot.plugins.push({
        init: init,
        options: {
            series: {
                lines: {
                    simplify: false
                }
            }
        },
        name: "simplifyLine",
        version: "0.1"
    });

}());
