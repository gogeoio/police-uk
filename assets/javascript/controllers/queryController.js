'use strict';

var QueryController = function($scope, $rootScope, services) {

  $scope.queryText = null;

  $scope.applyQuery = function() {
    if ($scope.queryText) {
      $scope.query = {
        query: {
          query_string: {
            query: $scope.queryText
          }
        }
      };

      if (window._gaq) {
        _gaq.push(['_trackEvent', 'police-uk', 'search', $scope.queryText]);
      }
    } else {
      $scope.query = null;
    }

    $rootScope.$emit('event:queryChanged', $scope.query);
  };

  $scope.clearQuery = function() {
    if ($scope.queryText) {
      $scope.queryText = null;
      $scope.applyQuery();
    }
  }
};