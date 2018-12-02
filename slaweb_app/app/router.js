import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
    location: config.locationType,
    rootURL: config.baseRouterURL,

    /**
     * When retrieving route handler (instance of Route based on current url),
     * if route belongs to one of the routes of the app, and it is not found,
     * fallback to base Route objects `base-app` and `base-section`.
     *
     * Note: this works only for routes that are generated when
     * app list is loaded from server - see first `if` in returned function
     *
     * Example: looking for `route:myApp.mySection`
     *  - if it is found, it is returned,
     *  - if it is not found, name is translated to `route:myApp.baseSection`
     *  - if this is not found, name is translated to `route:baseApp.baseSection`
     *
     * @returns {Function}
     * @private
     */
    _getHandlerFunction: function() {
        var origHandler = this._super(),
            router = this,
            initRouteNames = Ember.copy(this.router.recognizer.names);

        return function(name) {
            var nameChanged = false;

            // only works for generated routes - those that are not in router on application init
            if (!(name in initRouteNames)) {
                var segments = name.split('.'),
                    segmentCount = segments.length,
                    baseNames = ['base-app', 'base-section'],
                    notReplaceableNames = ['index', 'loading', 'error'],
                    substates = segments[segmentCount-1].split('_'),
                    substate = substates[1],
                    i, baseNameParts = [], selectedName,
                    lookupName, routeName, BaseRoute,
                    processSegmentCount, processedSegments, segmentsLeft;

                // remove substate from last segment
                segments[segmentCount-1] = substates[0];

                // if route with given name does not exists ...
                if (!router.container.has('route:' + name)) {
                    for (processSegmentCount = 1; processSegmentCount <= segmentCount; processSegmentCount++) {

                        baseNameParts = [];

                        for (i = segmentCount - 1; i > baseNames.length - 1; i--) {
                            baseNameParts.push(segments[i]);
                        }

                        segmentsLeft = segmentCount - baseNameParts.length;

                        processedSegments = 0;
                        for (i = segmentsLeft - 1; i >= 0; i--) {
                            if (processedSegments < processSegmentCount) {
                                selectedName = $.inArray(segments[i], notReplaceableNames) > -1 ? segments[i] : baseNames[i];
                                baseNameParts.push(selectedName);
                                processedSegments++;
                            } else {
                                baseNameParts.push(segments[i]);
                            }
                        }

                        nameChanged = true;
                        lookupName = baseNameParts.compact().reverse().join('.') + (substate ? '_' + substate : '');
                        routeName = 'route:' + name;

                        // lookup factory for base route
                        BaseRoute = router.container.lookupFactory('route:' + lookupName);

                        if (BaseRoute) {
                            // register it on container with originally searched route name
                            // so that it is find later when ember looks for it
                            router.container.register(routeName, BaseRoute.extend({}));

                            if (Ember.get(router, 'namespace.LOG_ACTIVE_GENERATION')) {
                                // log info of generated route
                                Ember.Logger.info("generated -> " + routeName + ' from route:' + lookupName, { fullName: routeName });
                            }
                            break;
                        }
                    }
                }
            }

            var returnedHandler = origHandler(name);
            if (returnedHandler && nameChanged) {
                // TODO is this really necessary? :D
                returnedHandler.routeName = name;
            }
            return returnedHandler;
        };
    }
});

Router.reopenClass({
    buildInitRoutes: function() {
        this.map(function(){
            this.route('login');

            this.resource('apps', {path: '/'}, function() {
                // Content here will be generated when apps are loaded from server.
                // Generation is handled by `buildAppRoutes` method of the router.
            });

            this.resource('about', function() {
                this.route('monica');
                this.route('architecture');
            });

            this.route('notfound', {path: '*path'});
        });

    },

    buildAppRoutes: function(appsModel) {
        this.map(function(){

            this.resource('apps', {path: '/'}, function() {

                // This builds following routes for each loaded app and its section
                //   this.resource('<appName>', {path: ':<appName>'}, function(){
                //     this.route('<sectionName>', {path: '<sectionPath>' || '<sectionName>'});
                //   });
                //
                // sectionPath can be specified in config file and will be used in path definition.
                // If it is not set, sectionName will be used as sectionPath.

                var appsRouter = this;

                Ember.EnumerableUtils.forEach(appsModel, function(appModel){
                    var appName = Ember.get(appModel, 'name'),
                        sections = Ember.get(appModel, 'config.sections');

                    appsRouter.resource(appName, function() {
                        var sectionRouter = this;

                        Ember.EnumerableUtils.forEach(sections, function(section) {
                            var sectionName = Ember.get(section, 'name'),
                                sectionPath = Ember.get(section, 'path') || sectionName;

                            sectionRouter.route(sectionName, {path: sectionPath});
                        }, this);
                    });
                }, this);
            });
        });

        this.routesAreBuilt = true;
    }
});


Router.buildInitRoutes();

export default Router;
