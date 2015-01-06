'use strict';

var QueryController = function($scope, $rootScope, services) {

  $scope.queryText = null;

  $rootScope.crimeTypes = [
    '',
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
    'Violent crime',
    'Violence and sexual offences'
  ];

  $scope.$on('$typeahead.select',
    function(value, index) {
      $scope.applyQuery();
    }
  );

  $scope.applyQuery = function() {

    if ($scope.queryText && $scope.queryText.length != 0) {
      $scope.query = {
        query: {
          terms: {
            crime_type: [ $scope.queryText ]
          }
        }
      };

      if (window._gaq) {
        _gaq.push(['_trackEvent', 'police-uk', 'search', $scope.queryText.toLowerCase()]);
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