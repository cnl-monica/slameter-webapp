/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp({
    compassOptions: {
        config: 'config.rb'
    },
    vendorFiles: {
        'handlebars.js': {
            production: 'bower_components/handlebars/handlebars.js'
        }
    }
});

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.

app.import('bower_components/modernizr/modernizr.js');
app.import('bower_components/ic-ajax/main.js');
app.import('bower_components/jquery-ui/ui/jquery.ui.core.js');
app.import('bower_components/jquery-ui/ui/jquery.ui.widget.js');
app.import('bower_components/jquery-ui/ui/jquery.ui.datepicker.js');
app.import('bower_components/jquery-ui/ui/jquery.ui.mouse.js');
app.import('bower_components/jquery-ui/ui/jquery.ui.slider.js');
app.import('bower_components/jQuery-Timepicker-Addon/dist/jquery-ui-sliderAccess.js');
app.import('bower_components/jQuery-Timepicker-Addon/dist/jquery-ui-timepicker-addon.js');
app.import('bower_components/jquery.cookie/jquery.cookie.js');
app.import('bower_components/moment/moment.js');
app.import('bower_components/tooltipster/js/jquery.tooltipster.js');
app.import('bower_components/jquery-mousewheel/jquery.mousewheel.js');
app.import('bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js');
app.import('bower_components/ic-ajax/main.js');
app.import('bower_components/js-base64/base64.js');
app.import('bower_components/socket.io-client/dist/socket.io.js');
app.import('bower_components/FileSaver/FileSaver.js');
app.import('bower_components/Blob/Blob.js');
app.import('bower_components/flot/jquery.flot.js');
app.import('bower_components/flot/jquery.flot.time.js');
app.import('bower_components/flot/jquery.flot.resize.js');
app.import('bower_components/flot/jquery.flot.selection.js');
app.import('bower_components/flot/jquery.flot.crosshair.js');
app.import('bower_components/flot/jquery.flot.categories.js');
app.import('bower_components/flot/jquery.flot.pie.js');

app.import('vendor/bricklayout/bricklayout.js');
app.import('vendor/flot-extensions/jquery.flot.iLegend.js');
app.import('vendor/flot-extensions/jquery.flot.sideBySideBars.js');
app.import('vendor/flot-extensions/jquery.flot.simplifyLine.js');
app.import('vendor/tooltipster-wrapper/tooltipster-wrapper.js');


module.exports = app.toTree();
