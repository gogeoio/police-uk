'use strict';

var MarkerPopupController = function($scope, $rootScope, $timeout, $window, $compile, services, leafletData, leafletEvents) {
  if (window._gaq) {
    window._gaq.push(['_trackEvent', services.config().demoName, 'marker:click']);
  }
};