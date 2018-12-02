/*!
 * @overview  BrickLayout jQuery plugin
 * @copyright Copyright 2014 Ján Juhár
 * @license   Licensed under MIT license
 * @version   0.1.3
 */


(function( window, $) {
    'use strict';

    function empty() {}

    /**
     * Represents brick layout - a layout that contains `bricks` that
     * can overlap each other like brick in masonry
     */
    var BrickLayout = ( function() {

        /**
         * BrickLayout constructor
         *
         * @class BrickLayout
         * @param $container - jQuery element containing 'bricks'
         * @param options - options for BrickLayout
         */
        function BrickLayout( $container, options ) {
            this.$container = $container;
            this.bricks = [];
            this.columns = [];
            this.activeLayout = null;
            this.activeLayoutName = null;
            this.staticLayoutName = '';
            this.init(options);

        }

        /**
         * Default settings for brickLayout
         * @type {object}
         */
        BrickLayout.defaultSettings = {
            brickSelector: '.brick',
            layoutWidthElement: 'document',
            jQueryAnimationsDuration: 250,
            layouts: {
                wide: {
                    maxWidth: 1500,
                    minWidth: 1001,
                    columnCount: 2,
                    defaultBrickColSpan: 1
                },
                narrow: {
                    maxWidth: 1000,
                    minWidth: 600,
                    columnCount: 1,
                    defaultBrickColSpan: 1
                }
            },
            callbacks: {
                onInit: function() {},
                onLayoutChange: function(layoutName, layoutConfig) {

                }
            }
        };

        BrickLayout.prototype = {

            /**
             * Init function run at the end of BrickLayout constructor.
             *
             * @param [options] - options passed in on plugin call
             */
            init: function(options) {
                var self = this;
                this.options = $.extend({}, BrickLayout.defaultSettings, options);
                this.origin = {
                    left: parseInt( ( this.$container.css('padding-left') || 0 ), 10 ),
                    top: parseInt( ( this.$container.css('padding-top') || 0 ), 10 )
                };

                // create bricks
                $.each(this.$container.find(this.options.brickSelector), function(){
                    self.addBrick($(this));
                });

                this.width = this.$container.width();

                // automatically determine layout
                this.setLayoutsBoundaries();
                this.autoSetLayout();

                this.disableTransitions();

                // make layout
                // disable transitions by passing `true`
                this.makeLayout(true);

                // check if container width hasn't changed after placing the bricks, if it has, realign layout
                this.containerWidthChange(true);

                // start watching container element for width changes
                this.watchForContainerWidthChanges();

                // call onInitialization callback
                if (typeof this.options.callbacks.onInit === 'function') {
                    this.options.callbacks.onInit.apply(this);
                }

            },

            /**
             * Gets width of element, which is configured to represent layout width by layoutWidthElement option:
             *  - container - width of brickLayout container
             *  - document - width of document
             *
             * @returns {Number} - layout width based on watched element.
             */
            getWatchedWidth: function() {
                if (this.options.layoutWidthElement === 'container') {
                    return this.$container.width();
                } else if (this.options.layoutWidthElement === 'document') {
                    return $(document).width();
                } else {
                    throw new Error('Brick Layout: wrong value for layoutWidthElement');
                }
            },

            /**
             * Creates new brick and inserts it to the layout's brick list.
             *
             * @param {jQuery} $brickElement - jQuery element representing the new brick on page
             * @returns {Brick} - newly created brick
             */
            addBrick: function($brickElement) {
                var brick = new Brick($brickElement, this);
                this.bricks.push(brick);
                return brick;
            },

            /**
             * Creates new column and inserts it to the layout's column list.
             * @returns {Column} - newly created column
             */
            createColumn: function() {
                var column = new Column(this, this.columns.length);
                this.columns.push(column);
                return column;
            },

            /**
             * Get shortest column (based on column height) from column array.
             * @param {Array} colArray - column array to select shortest column from.
             *     If not provided, column is selected from layout's column list.
             * @returns {Column} - shortest column
             */
            getShortestColumn: function(colArray) {
                var cols = colArray || this.columns;
                return cols.slice(0).sort(function(col1, col2) {
                    return col1.height - col2.height;
                })[0];
            },

            /**
             * Get longest column (based on column height) from column array.
             * @param {Array} [colArray] - column array to select longest column from.
             *     If not provided, column is selected from layout's column list.
             * @returns {Column} - longest column
             */
            getLongestColumn: function(colArray) {
                var cols = colArray || this.columns;
                return cols.slice(0).sort(function(col1, col2) {
                    return col2.height - col1.height;
                })[0];
            },

            /**
             * Gets shortest (based on column height) sucessive column set of size specified by colSpan parameter.
             * @param {Number} colSpan - size of column set
             * @returns {Object} - object containing shortest column set of specified size
             *     and height of this column set (that is, height of longest column in the column set).
             */
            getShortestColGroup: function(colSpan) {
                var colIndex, colSpanHeight, columns = this.columns, res = [];
                for ( colIndex = 0; colIndex <= columns.length-colSpan; colIndex++ ) {
                    colSpanHeight = columns.slice(colIndex, colIndex+colSpan).sort(function(col1, col2) {
                        return col2.height - col1.height;
                    })[0].height;
                    res.push({
                        columns: columns.slice(colIndex, colIndex+colSpan),
                        height: colSpanHeight
                    });
                }
                return res.sort(function(res1, res2) {
                    return res1.height - res2.height;
                })[0];
            },

            /**
             * Finds minimal and maximal widths among configured layouts and sets them on layout container element.
             */
            setLayoutsBoundaries: function() {
                var layouts = this.options.layouts,
                    cssSettings = {};

                var arrayMins = $.map(layouts, function(layout) {
                    return layout.minWidth || Number.MAX_VALUE;
                });

                var arrayMaxs = $.map(layouts, function(layout) {
                    return layout.maxWidth || 0;
                });

                var minWidth = arrayMins.reduce(function(min, width){
                    return width < min ? width : min;
                }, Number.MAX_VALUE);

                var maxWidth = arrayMaxs.reduce(function(max, width){
                    return width > max ? width : max;
                }, Number.MAX_VALUE);

                if (minWidth !== Number.MAX_VALUE) {
                    cssSettings.minWidth = minWidth;
                }

                if (maxWidth !== 0) {
                    cssSettings.maxWidth = maxWidth;
                }

                this.$container.css(cssSettings);
            },

            /**
             * Sets layout automatically based on layout options and current dimensions
             *
             * @returns {boolean} - true if layout changed, false otherwise
             */
            autoSetLayout: function() {
                var self = this,
                    layouts = this.options.layouts,
                    oldLayoutName = this.activeLayoutName,
                    layoutAlreadySet = false,
                    width, minWidth, maxWidth,
                    layoutChanged;
                if (this.staticLayoutName && this.staticLayoutName !== '') {
                    this.activeLayoutName = this.staticLayoutName;
                    this.activeLayout = layouts[this.staticLayoutName];
                } else {
                    width = this.getWatchedWidth();
                    $.each(layouts, function(layoutName, layout) {
                        minWidth = layout.minWidth || 0;
                        maxWidth = layout.maxWidth || Number.MAX_VALUE;
                        if ( !layoutAlreadySet && width >= minWidth && width <= maxWidth ) {
                            self.activeLayoutName = layoutName;
                            self.activeLayout = layout;
                            layoutAlreadySet = true;
                        }
                    });
                }

                layoutChanged = !!(oldLayoutName && oldLayoutName !== this.activeLayoutName);

                return layoutChanged;
            },

            /**
             * Statically set layout (doesn't change at window resize).
             *
             * @param layoutName - layout name from options to use. If '', null or undefined,
             *                     layout will be again determined automatically
             */
            fixLayout: function(layoutName) {
                this.staticLayoutName = layoutName;
                if (this.autoSetLayout()) {
                    this.makeLayout();
                }
            },
            putBricksInColumns: function() {
                var self = this;
                $.each(this.bricks, function(index, brick){
                    var colSpan = brick.getColSpan(),
                        colGroup = self.getShortestColGroup(colSpan);

                    brick.setFirstColumn(colGroup.columns[0]);
                    brick.position.top = colGroup.height;

                    $.each(colGroup.columns, function(ci, column){
                        column.addBrick(brick, colGroup.height);
                    });
                });
            },
            alignBricksVertically: function() {
                var self = this;
                $.each(this.columns, function(index, column) {
                    column.height = 0;
                });
                $.each(this.bricks, function(index, brick) {
                    var colSpan = brick.getColSpan(),
                        firstColIndex = self.columns.indexOf(brick.firstColumn),
                        colGroup = self.columns.slice(firstColIndex, firstColIndex + colSpan),
                        colHeight = self.getLongestColumn(colGroup).height;

                    brick.position.top = colHeight;

                    $.each(colGroup, function(index, column) {
                        column.height = colHeight + brick.height;
                    });

                    brick.translateToPlace();
                });
                this.$container.height(this.getLongestColumn().height);
            },

            /**
             * Makes layout by placing bricks to right columns and positions.
             *
             * @param {Boolean} [transitionsDisabled] - disables transitions during layout changes if set to `true`
             */
            makeLayout: function(transitionsDisabled) {
                var i, colCount, brickIndex, self = this;

                if (!transitionsDisabled) {
                    // enable transitions for layout change
                    this.enableTransitions();
                    this.$container.add(this.$container.find(this.options.brickSelector))
                        .one('transitionend webkitTransitionEnd otransitionend', function() {
                            setTimeout(function() {
                                self.disableTransitions();
                            },25);
                        });
                }

                //remove bricks from columns
                for ( brickIndex in this.bricks ) {
                    if ( Object.prototype.hasOwnProperty.call(this.bricks, brickIndex) ) {
                        this.bricks[brickIndex].removeFromColumn();
                    }
                }

                // create new columns
                this.columns = [];
                for ( i=0, colCount = this.activeLayout.columnCount; i < colCount; i++ ) {
                    this.createColumn();
                }

                // place brick
                this.putBricksInColumns();
                $.each(this.columns, function(index, column) {
                    column.alignBricksHorizontally();
                });
                $.each(this.bricks, function(index, brick) {
                    brick.setWidth();
                    brick.translateToPlace();
                });

                this.$container.height(this.getLongestColumn().height);

                this.options.callbacks.onLayoutChange(this.activeLayoutName, this.activeLayout);

            },

            /**
             * Triggered when container width is changed
             * @param {Boolean} [transitionsDisabled] - passed to `makeLayout`
             */
            containerWidthChange: function(transitionsDisabled) {
                var newWidth = this.$container.width();
                if (this.width !== newWidth) {
                    this.width = newWidth;
                    var changeLayout = this.autoSetLayout();
                    if (changeLayout) {
                        this.makeLayout(transitionsDisabled);
                    } else {
                        $.each(this.columns, function(index, column) {
                            column.alignBricksHorizontally(true);
                        });
                    }
                }

            },

            /**
             * Watches for width changes on layout container.
             */
            watchForContainerWidthChanges: function() {
                var self = this;
                function loop(){
                    self.containerWidthChange();
                    self._stop? empty() : throttledRAF(loop);
                }
                throttledRAF(loop);
            },

            /**
             * Enables css transitions by removing `no-transitions` class
             * from layout container and all bricks.
             *
             * It is in responsibility of css styles to provide animations
             * and to disable them with `no-transition` class.
             */
            enableTransitions: function() {
                this.$container.add(this.$container.find(this.options.brickSelector)).removeClass('no-transitions');
            },

            /**
             * Disables css transitions by adding `no-transitions` class
             * from layout container and all bricks.
             *
             * It is in responsibility of css styles to provide animations
             * and to disable them with `no-transition` class.
             */
            disableTransitions: function() {
                this.$container.add(this.$container.find(this.options.brickSelector)).addClass('no-transitions');
            },

            setColSpanToBrick: function($brickElement, newColSpan) {
                var brickIndex, brick = null;

                for ( brickIndex in this.bricks ) {
                    if ( Object.prototype.hasOwnProperty.call(this.bricks, brickIndex) ) {
                        if (this.bricks[brickIndex].$element[0] === $brickElement[0]) {
                            brick = this.bricks[brickIndex];
                            break;
                        }
                    }
                }

                if (brick === null) {
                    return;
                }

                if (newColSpan) {
                    brick.setColSpan(newColSpan);
                } else {
                    brick.resetColSpan();
                }
                this.makeLayout();
            },

            /**
             * Stops all watchers in preparation to destroying brickLayout.
             */
            destroy: function() {
                this._stop = true;
                $.each(this.bricks, function(i,brick) {
                    brick._stop = true;
                })
            }
        };

        return BrickLayout;
    }() );

    var Column = ( function() {

        /**
         * Virtual column in layout. When brick is placed inside column,
         * it fills one position in that column an some (or none) positions
         * in columns right from that one.
         *
         * @class Column
         *
         * @param {BrickLayout} layout - reference to brick layout this column belongs to
         * @param {number} position - position, or column index from the left
         */
        function Column( layout, position ) {
            this.bricks = [];
            this.height = 0;
            this.layout = layout;
            this.colIndex = position;
        }

        Column.prototype = {

            /**
             * Adds brick to column.
             *
             * @param {Brick} brick - brick to add to column
             * @param {number} [newHeight] -
             */
            addBrick: function( brick, newHeight ) {
                this.bricks.push( brick );
                if (newHeight) {
                    this.height = newHeight;
                }
                this.height += brick.$element.outerHeight(true);
            },

            /**
             * Aligns bricks in column horizontally.
             *
             * @param {boolean} [translateBricks] - if true, bricks are positioned with css translate,
             *                                      if false or undefined, position is only calculated
             */
            alignBricksHorizontally: function(translateBricks) {
                var self = this;
                var bricks = this.bricks;
                var colPosition = this.colIndex * (this.layout.width / this.layout.activeLayout.columnCount);

                $.each(bricks, function(index, brick) {
                    if (brick.firstColumn.colIndex === self.colIndex) {
                        brick.position.left = colPosition;
                    }
                    if (translateBricks) {
                        brick.translateToPlace();
                    }

                });
            }
        };

        return Column;
    }() );

    var Brick = ( function() {

        /**
         * Regexp used to get brick layout sizes from classes.
         * For example, brick with class='bcs-wide-1 bcs-narrow-2' would span 1 column
         * in `wide` layout and 2 columns in `narrow` layout.
         *
         * @type {RegExp}
         */
        var sizeRegex = /^bcs-(\w+)-(\d+)$/,

            /**
             * Reads layout settings from brick's classes.
             *
             * @param {Brick} instance - instance of Brick
             * @returns {object} - hash containing layout names and corresponding column spans
             */
            setupColSpans = function( instance ) {
                var classes = instance.$element.attr('class').split(' '),
                    index, regexMatch, layoutName, colSpan, colSpans = {};
                for ( index in classes ) {
                    if ( Object.prototype.hasOwnProperty.call(classes, index) ) {
                        regexMatch = classes[index].match(sizeRegex);
                        if ( regexMatch ) {
                            layoutName = regexMatch[1];
                            colSpan = parseInt(regexMatch[2], 10);
                            if ( colSpan >= 1 && colSpan <= instance.layout.options.layouts[layoutName].columnCount ) {
                                // set colSpan only if its value is acceptable for given layout
                                colSpans[regexMatch[1]] = parseInt(regexMatch[2], 10);
                            }
                        }
                    }
                }
                return colSpans;
            };

        /**
         *
         * @class Brick
         *
         * @param {jQuery} $element - jQuery element representing brick
         * @param {BrickLayout} layout - reference to brick layout this brick belongs to
         */
        function Brick( $element, layout ) {
            this.$element = $element;
            this.layout = layout;
            this.position = { left: 0, top: 0 };
            this.height = $element.outerHeight(true);
            this.firstColumn = null;
            this.colSpans = setupColSpans(this);
            this.placeAbsolute();
            this.watchForHeightChanges();

            this.defaultColSpans = $.extend({}, this.colSpans);

            $element.data('brick', this);
        }

        Brick.prototype = {

            /**
             * Add class `is-absolute-placed` to brick.
             * This class must set absolute position to top left corner of layout.
             */
            placeAbsolute: function() {
                this.$element.addClass('is-absolute-placed');
            },

            /**
             * Gets col span of brick for active layout
             *
             * @returns {number} number ob columns that brick spans
             */
            getColSpan: function() {
                return this.colSpans[this.layout.activeLayoutName] || this.layout.activeLayout.defaultBrickColSpan || 1;
            },

            /**
             * Sets col span to active layout
             *
             * @param {number} colSpan new col span for active layout
             */
            setColSpan: function(colSpan) {
                var activeLayoutName = this.layout.activeLayoutName,
                    columnCount = this.layout.options.layouts[activeLayoutName].columnCount;

                if (colSpan === 'max' || colSpan > columnCount) {
                    this.colSpans[activeLayoutName] = columnCount;
                    return;
                }

                if ( colSpan >= 1 && colSpan <= columnCount ) {
                    this.colSpans[activeLayoutName] = colSpan;
                }
            },

            resetColSpan: function() {
                var activeLayoutName = this.layout.activeLayoutName;

                this.colSpans[activeLayoutName] = this.defaultColSpans[activeLayoutName];
            },

            /**
             * Automatically sets brick width given active layout and it's column span.
             */
            setWidth: function() {
                var colSpan = this.getColSpan(),
                    width = (colSpan / this.layout.activeLayout.columnCount);

                this.$element.css('width', width*100 + '%');
            },

            /**
             * Sets css transform property on brick, that will make brick appear on
             * correct place in layout although DOM element order is left unchanged.
             */
            translateToPlace: function() {
                var left = Math.round(this.layout.origin.left + this.position.left),
                    top =  Math.round(this.layout.origin.top + this.position.top);
                if ( window.Modernizr.csstransforms3d ) {
                    this.$element.css('transform', 'translate3d(' + left + 'px, ' + top + 'px, 0)');
                } else if ( window.Modernizr.csstransforms ) {
                    this.$element.css('transform', 'translate(' + left + 'px, ' + top + 'px)');
                } else {
                    this.$element.animate({
                        left: left,
                        top: top
                    }, {
                        duration: this.layout.options.jQueryAnimationsDuration || 250,
                        queue: false
                    });
                }

            },

            /**
             * Sets firstColumn property on brick instance
             *
             * @param {Column} column - column instance this brick is assigned to
             */
            setFirstColumn: function(column) {
                this.firstColumn = column;
            },

            /**
             * Removes brick from assigned column.
             */
            removeFromColumn: function() {
                this.firstColumn = null;
            },

            /**
             * Watches brick element for width changes.
             */
            watchForHeightChanges: function() {
                var self = this;
                function loop(force) {
                    var newHeight = self.$element.outerHeight(true);
                    if ( force || self.height != newHeight ) {
                        self.height = newHeight;
                        self.layout.alignBricksVertically();
                    }
                    self._stop? empty() : throttledRAF(loop);
                }

                throttledRAF(function(){
                    loop(true);
                });
            }
        };

        return Brick;
    }() );

    /**
     * Make some method public for API.
     * @type {object}
     */
    var api = {
        containerWidthChange: BrickLayout.prototype.containerWidthChange,
        alignBricksVertically: BrickLayout.prototype.alignBricksVertically,
        fixLayout: BrickLayout.prototype.fixLayout,
        setColSpanToBrick: BrickLayout.prototype.setColSpanToBrick,
        destroy: BrickLayout.prototype.destroy
    };


    /**
     * Register jQuery plugin
     * @param {object} options - options to pass into BrickLayout constructor
     * @returns {$.fn}
     */
    $.fn.brickLayout = function(options){
        var instance = this.data('brickLayout');

        if ( typeof options === 'string' ) {
            if ( instance ){
                if ( api[options] ) {
                    api[options].apply(instance, Array.prototype.slice.call(arguments, 1));

                    if (options === 'destroy') {
                        this.removeData('brickLayout');
                    }
                } else {
                    throw new Error('no brickLayout method named "' + options + '"');
                }
            } else {
                throw new Error('cannot call brickLayout method prior to initialization');
            }
        } else if (!instance) {
            // BrickLayout initialization
            var layout = new BrickLayout(this, options);
            this.data('brickLayout', layout);
        }

        return this;
    };

    // requestAnimationFrame polyfill
    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = ( function() {
            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( callback ) {
                    window.setTimeout( callback, 250 );
                };
        })();
    }

    var throttledRAF = function(callback){
        window.setTimeout(function() {
            window.requestAnimationFrame(callback);
        }, 25);
    }

}( window, jQuery ));