/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'slameter',
    environment: environment,
    baseURL: '/',
    baseRouterURL: '/app/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
          'ember-routing-named-substates': true,
          'query-params-new': true
      }
    },

    APP: {
        LOG: {},

        BASE_URLS: {
            base: '/',
            apiRoot: '/api',
            wsLiveData: '/live-data',
            wsACP: '/acp',
            wsIDS: '/ids'
        },

        SOCKETIO_RESOURCE: 'ws',

        BRICKLAYOUTS: {
            'default': {
                wide: {
                    minWidth: 1401,
                    columnCount: 2,
                    defaultBrickColSpan: 1
                },
                narrow: {
                    maxWidth: 1400,
                    minWidth: 600,
                    columnCount: 1,
                    defaultBrickColSpan: 1
                }
            }
        }
    }
  };

  if (environment === 'development') {
    ENV.APP.LOG_RESOLVER = true;
    ENV.APP.LOG_ACTIVE_GENERATION = true;
    ENV.APP.LOG_TRANSITIONS = true;
    ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.LOG_VIEW_LOOKUPS = true;

      ENV.contentSecurityPolicy = {
          'connect-src': "'self' localhost:8000",
          'style-src': "'self' 'unsafe-inline'",
          'object-src': "'self'"
      };

      ENV.APP.BASE_URLS.base = '//localhost:8000/';
      ENV.APP.LOG = {
          LOG_API_REQUESTS: true,
          LOG_WEBSOCKETS: true
      }
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
      ENV.contentSecurityPolicy = {
          'style-src': "'self' 'unsafe-inline'",
          'object-src': "'self'"
      };
  }

  return ENV;
};
