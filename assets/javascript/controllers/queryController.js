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
    } else {
      $scope.query = null;
    }

    $rootScope.$emit('event:queryChanged', $scope.query);
  };
};