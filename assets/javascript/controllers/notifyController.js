'use strict';

var NotifyController = function($scope, $rootScope) {
  $scope.notify_opts = {
    styling: 'bootstrap3',
    title: 'Metadata',
    type: 'info',
    history: false,
    addclass: 'stack-bottomleft custom',
    hide: false,
    buttons: {
      sticker: false
    }
  };

  $scope.pnotify = new PNotify($scope.notify_opts);

  $scope.updateText = function() {
    var text = [
      'Zoom level: ' + $scope.zoom,
      'Processed objects on dashboard: ' + $.number($scope.geoAggCount, 0, '.', '.'),
      'Dashboard processing time: ' + $scope.geoAggTime + ' ms',
      'Processed objects in the clusters : ' + $.number($scope.clusterCount, 0, '.', '.')
    ];

    $scope.pnotify.update({text: text.join('\n')});

    if ($scope.pnotify.state === 'closed') {
      $scope.pnotify.open();
    }
  }

  $rootScope.$on('event:updateGeoAggCount',
    function(event, time, count) {
      $scope.geoAggCount = count;
      $scope.geoAggTime = time;

      $scope.updateText();
    }
  );

  $rootScope.$on('event:updateClusterCount',
    function(event, count) {
      $scope.clusterCount = count;
      $scope.updateText();
    }
  );

  $rootScope.$on('event:updateZoom',
    function(event, zoom) {
      $scope.zoom = zoom;
      $scope.updateText();
    }
  );
};