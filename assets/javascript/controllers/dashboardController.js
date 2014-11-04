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

  $scope.requestGeoAggregation = function(geom, points, query) {
    leafletData.getMap().then(
      function(map) {
        if (!points && !geom) {
          var bounds = map.getBounds();
          points = $scope.getNeSwPoints(bounds);
        }

        var timeStart = new Date();
        services.dashboardGeoAggregation(points, geom, query,
          function(result) {
            var timeEnd = new Date();

            $scope.geoAggList = [];
            $scope.totalCount = result.doc_total;

            var timeElapsed = timeEnd.getTime() - timeStart.getTime();
            $rootScope.$emit('event:updateGeoAggCount', timeElapsed, $scope.totalCount);

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
    function(event, geom, points, query) {
      $scope.requestGeoAggregation(geom, points, query);
    }
  );
};
