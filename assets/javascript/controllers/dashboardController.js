'use strict';

var DashboardController = function($scope, $rootScope, leafletData, services) {
  $scope.getNeSwPoints = function(bounds) {
    var ne = [bounds._northEast.lng, bounds._northEast.lat];
    var sw = [bounds._southWest.lng, bounds._southWest.lat];

    return [ne, sw];
  };

  $scope.currentPage = 1;
  $scope.pageSize = 11;
  $scope.margin_pagination = -15;

  $scope.requestGeoAggregation = function(geom) {
    leafletData.getMap().then(
      function(map) {
        var bounds = map.getBounds();
        var points = $scope.getNeSwPoints(bounds);

        services.dashboardGeoAggregation(points, geom,
          function(result) {
            $scope.geoAggList = [];
            $scope.totalCount = result.doc_total;

            result.buckets.forEach(
              function(bucket) {
                var percent = (bucket.doc_count / result.doc_total) * 100;
                $scope.geoAggList.push({
                  key: bucket.key,
                  value: bucket.doc_count,
                  percent: percent
                });
              }
            );

            if ($scope.geoAggList.length < $scope.pageSize) {
              $scope.margin_pagination = 0;
            } else {
              $scope.margin_pagination = -15;
            }
          }
        );
      }
    );
  };

  $rootScope.$on('event:updateGeoAggregation',
    function(event, geom) {
      $scope.requestGeoAggregation(geom);
    }
  );
};
