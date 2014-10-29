'use strict';

var app = angular.module('policeUK', ['leaflet-directive', 'policeUK.services', 'angularUtils.directives.dirPagination', 'mgcrea.ngStrap']);

app.filter('capitalize',
  function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    }
  }
);

app.filter('formatPercent',
  function() {
    return function(input, size) {
      if (size === 'undefined') {
        size = 2;
      }

      if (size > 0) {
        return $.number(input, size);
      } else {
        return $.number(input, 0, '.', '.')
      }

    }
  }
);