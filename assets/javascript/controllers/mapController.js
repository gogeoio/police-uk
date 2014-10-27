'use strict';

var MapController = function($scope, $rootScope, $timeout, $compile, services, leafletData, leafletEvents) {
  $scope.drawnItems = new L.FeatureGroup();
  $scope.clusterHull = new L.FeatureGroup();

  $scope.geom = null;
  $scope.newGeom = null;

  $scope.mainGeoAggTotalCount = 0;

  var drawOptions = {
    draw: {
      draw: {
        polyline: false,
        polygon: false,
        circle: false, // Turns off this drawing tool
        marker: false
      },
      edit: {
        featureGroup: $scope.drawnItems
      },
      trash: true
    }
  };

  $scope.clickClusterCallback = function(event, clusterData) {
    var polygon = clusterData.polygon;

    var latlng = L.latLng(clusterData.coords[0], clusterData.coords[1]);

    $scope.geojson = polygon.toGeoJSON();

    services.clusterGeoAggregation($scope.geojson.geometry,
      function(geoAggregation) {
        var content = '<div class="graph-div" ng-controller="ChartsController" ng-include="\'/assets/javascript/views/custom-geo-aggregation.html\'"></div>';

        $scope.geoAggData = [];
        geoAggregation.buckets.forEach(
          function(bucket, index) {
            var item = {
              value: bucket.doc_count,
              name: bucket.key,
              group: 'Crime types'
            };

            $scope.geoAggData.push(item);
          }
        );

        $scope.$apply(
          function() {
            leafletData.getMap().then(
              function(map) {
                if (!map.hasLayer($scope.clusterHull)) {
                  map.addLayer($scope.clusterHull);
                }

                if ($scope.popup) {
                  $scope.removeCurrentHull();
                  map.closePopup($scope.popup);
                }

                $scope.currentHull = polygon;
                $scope.clusterHull.addLayer(polygon);

                $scope.popup = L.popup()
                .setLatLng(latlng)
                .setContent(content)
                .openOn(map);
              }
            );
          }
        );
      }
    );
  };

  $scope.$on('leafletDirectiveMap.popupopen',
    function(event, leafletEvent) {
      $scope.showCustomGeoAggregation = true;
      var newScope = $scope.$new();

      // Put the GeoAggregation data into newScope (ChartsController)
      newScope.geoAggData = $scope.geoAggData;

      $compile(leafletEvent.leafletEvent.popup._contentNode)(newScope);
    }
  );

  $scope.removeCurrentHull = function(event, leafletEvent) {
    if ($scope.clusterHull.hasLayer($scope.currentHull)) {
      $scope.clusterHull.removeLayer($scope.currentHull);
    }
  };

  $scope.$on('leafletDirectiveMap.popupclose', $scope.removeCurrentHull);

  $scope.closePopup = function() {
    if ($scope.popup) {
      leafletData.getMap().then(
        function(map) {
          map.closePopup($scope.popup);
        }
      );
    }
  };

  // Create a cluster layer
  $scope.createClusterLayer = function(geom, query) {
    var options = {
      maxZoom: 18,
      subdomains: services.config().subdomains,
      useJsonP: false,
      clickCallback: $scope.clickClusterCallback,
      formatCount: function(count) {
        return $.number(count, 0, '.', '.');
      },
      calculateClusterQtd: function(zoom) {
        if (zoom >= 5) {
          return 2;
        } else {
          return 1;
        }
      }
    };

    var clusterUrl = services.clusterUrl(geom);
    var cluster = L.tileCluster(clusterUrl, options);

    return  {
      name: 'goGeo Cluster Layer',
      type: 'custom',
      layer: cluster,
      visible: true
    }
  };

  $scope.gogeoLayers = {
    baselayers: {
      googleRoadmap: {
        name: 'Google Streets',
        layerType: 'ROADMAP',
        type: 'google'
      }
    },
    overlays: {
      cluster: $scope.createClusterLayer()
    }
  };

  angular.extend($scope, {
    london: {
      lat: 51.505,
      lng: -0.12,
      zoom: 5
    },
    controls: drawOptions,
    layers: $scope.gogeoLayers
  });

  $scope.$watch('london.zoom',
    function(zoom) {
      $scope.handlerLayers(zoom);
      $rootScope.$emit('event:updateGeoAggregation', $scope.geom);
      $scope.closePopup();
    }
  );

  $scope.handlerLayers = function(zoom) {
    if (zoom) {
      $scope.zoom = zoom;
    }
    var overlays = $scope.gogeoLayers.overlays;
    if ($scope.geom !== $scope.newGeom) {
      delete overlays.cluster;
      $scope.geom = $scope.newGeom;

      $timeout(
        function() {
          overlays.cluster = $scope.createClusterLayer($scope.geom);
          $rootScope.$emit('event:updateGeoAggregation', $scope.geom);
        }
      );
    }
  };

  $scope.drawHandler = function(event, leafletEvent) {
    var layer = leafletEvent.leafletEvent.layer;

    if (layer) {
      $scope.drawnItems.clearLayers();
      $scope.drawnItems.addLayer(layer);
    } else {
      layer = $scope.drawnItems.getLayers()[0];
      $scope.closePopup();
      $scope.removeCurrentHull();
    }

    if (layer) {
      var geojson = layer.toGeoJSON();
      $scope.newGeom = JSON.stringify(geojson.geometry);
    } else {
      $scope.newGeom = null;
      $scope.closePopup();
      $scope.removeCurrentHull();
    }

    $scope.handlerLayers($scope.zoom);
  };

  $scope.$on('leafletDirectiveMap.draw:created', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:deleted', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:edited', $scope.drawHandler);
};