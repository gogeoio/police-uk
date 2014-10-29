'use strict';

var QueryController = function($scope, $rootScope, services) {

  $scope.queryText = null;

  /* --------------------------------------------------------------- */

  $scope.states = [
    'Anti-social behaviour',
    'Bicycle theft',
    'Burglary',
    'Criminal damage and arson',
    'Drugs',
    'Other crime',
    'Other theft',
    'Possession of weapons',
    'Public disorder and weapons',
    'Public order',
    'Robbery',
    'Shoplifting',
    'Theft from the person',
    'Vehicle crime',
    'Violence and sexual offences'
  ];

  /* --------------------------------------------------------------- */

  $scope.applyQuery = function() {
    if ($scope.queryText) {
      var terms = $scope.queryText;

      $scope.query = {
        query: {
          terms: {
            crime_type: [ terms ]
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