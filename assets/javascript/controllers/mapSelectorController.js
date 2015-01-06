'use strict';

var MapSelectorController = function($scope, $rootScope) {

  if ($rootScope.selectedLayer === 'cluster') {
    $scope.clusterDisabled = 'disabled';
    $scope.markerDisabled = 'enabled';
  } else {
    $scope.clusterDisabled = 'enabled';
    $scope.markerDisabled = 'disabled';
  }

  $scope.showCluster = function() {
    if ($scope.clusterDisabled === 'disabled') {
      return;
    }

    $scope.clusterDisabled = 'disabled';
    $scope.markerDisabled = 'enabled';
    
    $rootScope.$emit('event:changeLayer', 'cluster');
  };

  $scope.showMarker = function() {
    if ($scope.markerDisabled === 'disabled') {
      return;
    }

    $scope.clusterDisabled = 'enabled';
    $scope.markerDisabled = 'disabled';

    $rootScope.$emit('event:changeLayer', 'marker');
  };
};