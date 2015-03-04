'use strict';

var MapController = function($scope, $rootScope, $timeout, $window, $compile, services, leafletData, leafletEvents) {
  $scope.drawnItems = new L.FeatureGroup();
  $scope.clusterHull = new L.FeatureGroup();

  $scope.geom = null;
  $scope.newGeom = null;

  $scope.mainGeoAggTotalCount = 0;

  $rootScope.selectedLayer = 'marker'; // cluster or marker

  var drawOptions = {
    draw: {
      draw: {
        polyline: false,
        polygon: false,
        circle: false, // Turns off this drawing tool
        marker: false,
        rectangle: {
          showArea: true
        }
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

            var options = {
              className: 'cluster-popup'
            };

            $scope.popup = L.popup(options)
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

    if (clusterData.count > 3 && polygon) {
      $scope.geojson = polygon.toGeoJSON();

      var boolQuery = $scope.getBoolQuery();

      services.clusterGeoAggregation($scope.geojson.geometry, boolQuery,
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

  $scope.$on('leafletDirectiveMap.click',
    function(event, leafletEvent) {
      if ($scope.selectedLayer === 'marker' && $scope.drawnItems.getLayers().length == 0) {
        leafletData.getMap().then(
          function(map) {
            $scope.onMapClick(map, leafletEvent.leafletEvent);
          }
        );
      }
    }
  );

  // Handle the click event
  $scope.onMapClick = function(map, event) {
    services.geosearch(event.latlng, map.getZoom(), $scope.query,
      function(data) {
        $scope.openMarkerPopup(data, event.latlng, map);
      }
    );
  };

  $scope.openMarkerPopup = function(data, latlng, map) {
    if (data.length > 0) {
      $scope.markerData = data[0];
      var pathname = window.location.pathname.trim();

      if (pathname.lastIndexOf('/') !== (pathname.length - 1)) {
        pathname = pathname + '/';
      }

      var path = '\'' + pathname + 'assets/javascript/views/crime-template.html\'';
      var content = '<div " ng-include="' + path + '"></div>';

      $timeout(
        function() {
          $scope.$apply(
            function() {
              var options = {
                className: 'marker-popup',
                offset: new L.Point(4, -50)
              };

              $scope.markerPopup = L.popup(options)
                .setLatLng(latlng)
                .setContent(content)
                .openOn(map);
            }
          );
        },
        0
      );
    }
  };

  $scope.removeCurrentHull = function(event, leafletEvent) {
    if ($scope.clusterHull.hasLayer($scope.currentHull)) {
      $scope.clusterHull.removeLayer($scope.currentHull);
    }
  };

  $scope.$on('leafletDirectiveMap.popupclose', $scope.removeCurrentHull);

  $scope.closePopup = function() {
    if ($scope.clusterChartPopup) {
      leafletData.getMap().then(
        function(map) {
          map.closePopup($scope.clusterChartPopup);
        }
      );
    }

    if ($scope.markerPopup) {
      leafletData.getMap().then(
        function(map) {
          map.closePopup($scope.markerPopup);
        }
      );
    }
  };

  // Select which layer will show
  $scope.createLayer = function(geom, query, timeQuery) {
    if ($rootScope.selectedLayer === 'marker') {
      return $scope.createMarkerLayer(geom, query, timeQuery);
    } else {
      return $scope.createClusterLayer(geom, query, timeQuery);
    }
  };

  // Create a cluster layer
  $scope.createClusterLayer = function(geom, query, timeQuery) {
    var options = {
      subdomains: services.config().subdomains,
      useJsonP: false,
      clickCallback: $scope.clickClusterCallback,
      clusterTooltip: 'Click here to view a chart\nby age ranges in this area.',
      updateCountCallback: function(totalCount) {
        $rootScope.$emit('event:updateClusterCount', totalCount);
      },
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

  // Create a marker layer
  $scope.createMarkerLayer = function(geom, query, timeQuery) {
    var options = {
      subdomains: services.config().subdomains
    };

    return  {
      name: 'goGeo Tile Layer',
      url: services.pngUrl(geom, query),
      type: 'xyz',
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
      cluster: $scope.createLayer()
    }
  };

  L.drawLocal.draw.toolbar.buttons.rectangle = 'Draw an area.';
  L.drawLocal.edit.toolbar.buttons.edit = 'Edit area.'
  L.drawLocal.edit.toolbar.buttons.editDisabled = 'No area to edit.'
  L.drawLocal.edit.toolbar.buttons.remove = 'Delete area.'
  L.drawLocal.edit.toolbar.buttons.removeDisabled = 'No area to delete.'

  L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Click and drag to draw an area';
  L.drawLocal.edit.handlers.edit.tooltip.text = 'Drag handles to edit area.';
  L.drawLocal.edit.handlers.remove.tooltip.text = 'Click on an area and then save to remove.';

  angular.extend($scope, {
    london: {
      lat: 51.505,
      lng: -0.12,
      zoom: 6
    },
    defaults: {
      maxZoom: 15
    },
    controls: drawOptions,
    layers: $scope.gogeoLayers
  });

  $scope.$watch('london.zoom',
    function(zoom) {
      $scope.handlerLayers(zoom);
      $scope.closePopup();

      $rootScope.$emit('event:updateZoom', zoom);
    }
  );

  $scope.getNeSwPoints = function(bounds) {
    var ne = [bounds._northEast.lng, bounds._northEast.lat];
    var sw = [bounds._southWest.lng, bounds._southWest.lat];

    return [ne, sw];
  };

  $scope.$on('leafletDirectiveMap.moveend',
    function() {
      var layersDrawn = $scope.drawnItems.getLayers();

      if (layersDrawn.length == 0) {
        var boolQuery = $scope.getBoolQuery();

        leafletData.getMap().then(
          function(map) {
            $scope.points = $scope.getNeSwPoints(map.getBounds());
            $rootScope.$emit('event:updateGeoAggregation', $scope.geom, $scope.points, boolQuery);
          }
        );
      }
    }
  );

  $scope.getBoolQuery = function() {
    var boolQuery = null;

    if ($scope.query && $scope.timeQuery) {
      boolQuery = {
        query: {
          bool: {
            must: [ $scope.timeQuery.query, $scope.query.query ]
          }
        }
      };
    } else if ($scope.query) {
      boolQuery = $scope.query;
    } else if ($scope.timeQuery) {
      boolQuery = $scope.timeQuery;
    }

    return boolQuery;
  };

  $scope.handlerLayers = function(zoom) {
    if (zoom) {
      $scope.zoom = zoom;
    }

    var toUpdate = false;

    if ($scope.geom !== $scope.newGeom) {
      $scope.geom = $scope.newGeom;
      toUpdate = true;
    }

    if (JSON.stringify($scope.query) !== JSON.stringify($scope.newQuery)) {
      $scope.query = $scope.newQuery;
      toUpdate = true;
    }

    if (JSON.stringify($scope.timeQuery) !== JSON.stringify($scope.newTimeQuery)) {
      $scope.timeQuery = $scope.newTimeQuery;
      toUpdate = true;
    }

    if (toUpdate) {
      $scope.updateLayer();
    }
  };

  $scope.updateLayer = function() {
    var overlays = $scope.gogeoLayers.overlays;
    var boolQuery = $scope.getBoolQuery();

    $timeout(
      function() {
        delete overlays.cluster;
      },
      10
    );

    $timeout(
      function() {
        overlays.cluster = $scope.createLayer($scope.geom, boolQuery);
        $rootScope.$emit('event:updateGeoAggregation', $scope.geom, $scope.points, boolQuery);
      },
      100
    );
  };

  $scope.drawHandler = function(event, leafletEvent) {

    var layer = leafletEvent.leafletEvent.layer || $scope.drawnItems.getLayers()[0];
    $scope.closePopup();

    if (layer) {
      $scope.drawnItems.clearLayers();
      $scope.drawnItems.addLayer(layer);
      $scope.canOpenPopup = true;

      layer.on('click',
        function(clickEvent) {
          if ($scope.selectedLayer === 'marker' && $scope.canOpenPopup) {
            $scope.onMapClick(clickEvent.target._map, clickEvent);
          }
        }
      );
    } else {
      $scope.canOpenPopup = false;
      $scope.closePopup();
      $scope.removeCurrentHull();
    }

    if (layer) {
      var geojson = layer.toGeoJSON();
      $scope.newGeom = JSON.stringify(geojson.geometry);

      if (window._gaq) {
        window._gaq.push(['_trackEvent', services.config().demoName, 'draw:created']);
      }

      var area = (LGeo.area(layer) / 1000000).toFixed(2);
      $rootScope.$emit('event:updateDrawnArea', area);
    } else {
      $scope.newGeom = null;
      $scope.points = null;
      $scope.closePopup();
      $scope.removeCurrentHull();
      $rootScope.$emit('event:updateDrawnArea', null);
    }

    $scope.handlerLayers($scope.zoom);
  };

  $scope.$on('leafletDirectiveMap.draw:created', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:deleted', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:edited', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:deletestart',
    function() {
      $scope.canOpenPopup = false;
    }
  );

  $rootScope.$on('event:queryChanged',
    function(event, newQuery) {
      $scope.newQuery = newQuery;
      $scope.handlerLayers($scope.zoom);
      $scope.closePopup();
    }
  );

  $rootScope.$on('event:dateUpdated',
    function(event, minMonth, maxMonth) {
      $scope.newTimeQuery = {
        query: {
          range: {
            month: {
              gte: minMonth,
              lte: maxMonth
            }
          }
        }
      };

      $scope.handlerLayers($scope.zoom);
      $scope.closePopup();
    }
  );

  $rootScope.$on('event:changeLayer',
    function(event, selectedLayer) {
      $rootScope.selectedLayer = selectedLayer;
      $scope.updateLayer();
    }
  );
};