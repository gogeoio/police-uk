'use strict';

var NotifyController = function($scope, $rootScope) {
  $scope.notify_opts = {
    styling: 'bootstrap3',
    title: 'goGeo Performance',
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
      'Processed records: ' + $.number($scope.geoAggCount + $scope.clusterCount, 0, '.', '.'),
      'Processing time: ' + $scope.geoAggTime + ' ms'
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