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

  $scope.updateDashboard = function(geoAggregation, polygon, latlng) {
    var pathname = window.location.pathname.trim();

    if (pathname.lastIndexOf('/') !== (pathname.length - 1)) {
      pathname = pathname + '/';
    }

    var path = '\'' + pathname + 'assets/javascript/views/bubble-chart.html\'';
    var content = '<div class="graph-div" ng-controller="ChartsController" ng-include="' + path + '"></div>';

    $scope.geoAggData = [];
    if (geoAggregation) {
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
    }

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

            if (polygon) {
              $scope.currentHull = polygon;
              $scope.clusterHull.addLayer(polygon);
            }

            $scope.popup = L.popup()
            .setLatLng(latlng)
            .setContent(content)
            .openOn(map);
          }
        );
      }
    );
  };

  $scope.clickClusterCallback = function(event, clusterData) {
    var polygon = clusterData.polygon;
    var latlng = L.latLng(clusterData.coords[0], clusterData.coords[1]);

    if (typeof polygon === 'array' || polygon.length == 0) {
      polygon = null;
    }

    if (clusterData.count > 2 && polygon) {
      $scope.geojson = polygon.toGeoJSON();

      services.clusterGeoAggregation($scope.geojson.geometry, $scope.query,
        function(result) {
          $scope.updateDashboard(result, polygon, latlng);
        }
      );
    } else {
      $scope.updateDashboard(null, polygon, latlng);
    }
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
      subdomains: services.config().subdomains,
      useJsonP: false,
      clickCallback: $scope.clickClusterCallback,
      formatCount: function(count) {
        return $.number(count, 0, '.', '.');
      }
    };

    var clusterUrl = services.clusterUrl(geom, query);
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
      zoom: 6
    },
    defaults: {
      maxZoom: 18
    },
    controls: drawOptions,
    layers: $scope.gogeoLayers
  });

  $scope.$watch('london.zoom',
    function(zoom) {
      $scope.handlerLayers(zoom);
      $rootScope.$emit('event:updateGeoAggregation', $scope.geom, $scope.query);
      $scope.closePopup();
    }
  );

  $scope.handlerLayers = function(zoom) {
    if (zoom) {
      $scope.zoom = zoom;
    }
    var overlays = $scope.gogeoLayers.overlays;

    var toUpdate = false;

    if ($scope.geom !== $scope.newGeom) {
      $scope.geom = $scope.newGeom;
      toUpdate = true;
    }

    if ($scope.query !== $scope.newQuery) {
      $scope.query = $scope.newQuery;
      toUpdate = true;
    }

    if (toUpdate) {
      delete overlays.cluster;
      $timeout(
        function() {
          overlays.cluster = $scope.createClusterLayer($scope.geom, $scope.query);
          $rootScope.$emit('event:updateGeoAggregation', $scope.geom, $scope.query);
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

  $rootScope.$on('event:queryChanged',
    function(event, newQuery) {
      $scope.newQuery = newQuery;
      $scope.handlerLayers($scope.zoom);
      $scope.closePopup();
    }
  );
};