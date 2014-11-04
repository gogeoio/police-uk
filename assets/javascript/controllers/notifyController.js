'use strict';

var NotifyController = function($scope, $rootScope) {
  $scope.notify_opts = {
    styling: 'bootstrap3',
    title: 'Metadata',
    type: 'info',
    history: false,
    addclass: 'stack-bottomleft',
    hide: false
  };
  $scope.pnotify = new PNotify($scope.notify_opts);

  // console.log($scope.pnotify);

  $scope.updateText = function() {
    var text = [
      'Zoom level: ' + $scope.zoom,
      'Dashboard processed objects: ' + $.number($scope.geoAggCount, 0, '.', '.'),
      'Dashboard process time: ' + $scope.geoAggTime + ' ms',
      'Cluster processed objects: ' + $.number($scope.clusterCount, 0, '.', '.')
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

  // $rootScope.$on('event:hideMetadata',
  //   function(event) {
  //     if ($scope.pnotify.state !== 'closed') {
  //       console.log('hideMetadata');
  //       $scope.pnotify.remove(0);
  //       console.log($scope.pnotify);
  //     }
  //   }
  // );
};