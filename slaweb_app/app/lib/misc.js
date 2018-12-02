import Ember from 'ember';

/**
 * Concatenate passed arguments -- url segments -- to single url
 * @returns {string} concatenated url
 */
function concatUrl() {
    var args = Array.prototype.slice.call(arguments, 0);
    return '' + args.reduce(function(concat, current) {
        var left = concat.replace(/\/$/g, ''),
            right = current.replace(/^\//g, '');
        return left + '/' + right;
    });
}

function merge(original, updates) {
    if (!updates || typeof updates !== 'object') {
        return original;
    }

    var props = Ember.keys(updates);
    var prop;
    var length = props.length;

    for (var i = 0; i < length; i++) {
        prop = props[i];
        Ember.set(original, prop, updates[prop]);
    }

    return original;
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

var colors = {
    darkgreen: '#6c854e',
    midgreen: '#9bbf71',
    lightgreen: '#bfe591',

    darkblue: '#33486e',
    midblue: '#5780b8',
    lightblue: '#729fe3',

    darkyellow: '#8f842b',
    midyellow: '#c9ba3d',
    lightyellow: '#f0de49',

    darkred: '#8a271c',
    midred: '#c43828',
    lightred: '#f04431',

    grey0: '#000000',
    grey1: '#252525',
    grey2: '#404040',
    grey3: '#757575',
    grey4: '#a0a0a0',
    grey5: '#d0d0d0',
    grey6: '#e2e2e2',
    grey7: '#f0f0f0',
    grey8: '#ffffff',

    black: '#000000',
    white: '#ffffff'
};

export {concatUrl, colors, merge, sleep};
