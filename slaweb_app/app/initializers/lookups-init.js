import Ember from 'ember';

export default {
    name: 'lookups-init',
    initialize: function(container, application) {
        var VALID_FULL_NAME_REGEXP = /^[^:]+.+:[^:]+$/,
            oldHas = container.has,
            oldLookup = container.lookup,
            oldLookupFactory = container.lookupFactory,
            appCtrl;

        /**
         * Validates given name.
         *
         * @param {String} fullName name to validate
         */
        function validateFullName(fullName) {
            if (!VALID_FULL_NAME_REGEXP.test(fullName)) {
                throw new TypeError('Invalid Fullname, expected: `type:name` got: ' + fullName);
            }

            var testName = fullName.replace('$app', '').replace('$section', '');

            if (testName.indexOf('$') > -1) {
                throw new TypeError('Only $app and $section variables are allowed in lookups, but name is: ' + fullName);
            }
        }

        /**
         * Replaces $app and/or $section variable with active app and/or section names.
         * Supports different modes for different states of lookup.
         *
         * @param fullName name to augment
         * @param mode
         * @returns {String} augmented name
         */
        function processNameVariables(fullName, mode) {
            validateFullName(fullName);

            if (!appCtrl) {
                if (container.has('controller:application')) {
                    appCtrl = container.lookup('controller:application');
                } else {
                    return fullName;
                }
            }

            var activeApp = appCtrl.get('activeApp'),
                activeSection = appCtrl.get('activeSection');

            if (fullName.indexOf('$app') > -1) {
                Ember.assert('You cannot use lookup with $app variable outside app route', activeApp);
            }

            if (fullName.indexOf('$section') > -1) {
                Ember.assert('You cannot use lookup with $section variable outside section route', activeSection);
            }


            if (mode === 'full') {
                return fullName.replace('$app', activeApp).replace('$section', activeSection);
            }

            fullName = fullName.replace('$section', 'baseSection');

            if (mode === 'onlyApp') {
                return fullName.replace('$app', activeApp);
            } else if (mode === 'base') {
                return fullName.replace('$app', 'baseApp');
            } else if (mode === 'outside') {
                return fullName.replace(/\$app[.\/]/, '');
            } else {
                throw new TypeError('Bad mode given');
            }

        }

        container.processNameVariables = processNameVariables;

        container.has = function has(fullName) {
            validateFullName(fullName);

            var _has,
                variableCount = fullName.split('$').length - 1,
                processedName = variableCount > 0 ? processNameVariables(fullName, 'full') : fullName;


            _has = oldHas.call(this, processedName);

            if (!_has && variableCount > 0) {

                if (variableCount === 2) {
                    processedName = processNameVariables(fullName, 'onlyApp');
                    _has = oldHas.call(this, processedName);
                }

                if (!_has) {
                    // remove app variable and replace section variable with `section`
                    processedName = processNameVariables(fullName, 'base');
                    _has = oldHas.call(this, processedName);
                }

                if (!_has) {
                    processedName = processNameVariables(fullName, 'outside');
                    if (processedName !== '') {
                        _has = oldHas.call(this, processedName);
                    }
                }
            }

            return _has;

        };

        /**
         * This modifies standard Ember lookup, and utilizes custom resolver.
         * First it looks up given name. If that fails, and fullName has
         * an app specified, it performs another lookup with app name removed.
         *
         * @param {String} fullName
         * @param {Object} options
         * @returns {*}
         */
        container.lookup = function lookup(fullName, options) {
            validateFullName(fullName);

            var module,
                variableCount = fullName.split('$').length - 1,
                processedName = variableCount > 0 ? processNameVariables(fullName, 'full') : fullName,
                fallback = (options && ('fallback' in options)) ? options.fallback : true;

            if (options && 'fallback' in options) {
                delete options.fallback;
            }

            // first lookup with processed fullName
            module = oldLookup.call(this, processedName, options);

            // if module was not found, fallback is enabled and name contains variables,
            // proceed to further lookups
            if (fallback && !module && variableCount > 0) {

                // if both variables were specified, process only one of them
                // and remove remaining $ sign
                if (variableCount === 2) {
                    processedName = processNameVariables(fullName, 'onlyApp');
                    module = oldLookup.call(this, processedName, options);
                }

                // if module is still not found, cancel all variables.
                // This performs lookup for base classes
                if (!module) {
                    processedName = processNameVariables(fullName, 'base');
                    module = oldLookup.call(this, processedName, options);
                }

                // if module is still not found, delete $app part
                // and lookup outside of apps
                if (!module) {
                    processedName = processNameVariables(fullName, 'outside');
                    if (processedName !== '') {
                        module = oldLookup.call(this, processedName, options);
                    }
                }
            }

            return module;
        };

        container.lookupFactory = function lookupFactory(fullName) {
            validateFullName(fullName);

            var module,
                variableCount = fullName.split('$').length - 1,
                processedName = variableCount > 0 ? processNameVariables(fullName, 'full') : fullName;

            module = oldLookupFactory.call(this, processedName);

            if (!module && variableCount > 0) {

                if (variableCount === 2) {
                    processedName = processNameVariables(fullName, 'onlyApp');
                    module = oldLookupFactory.call(this, processedName);
                }

                if (!module) {
                    processedName = processNameVariables(fullName, 'base');
                    module = oldLookupFactory.call(this, processedName);
                }

                if (!module) {
                    processedName = processNameVariables(fullName, 'outside');
                    if (processedName !== '') {
                        module = oldLookupFactory.call(this, processedName);
                    }
                }
            }

            return module;
        };

    }
};
