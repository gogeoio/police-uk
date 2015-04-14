'use strict';

(function() {
  var app = angular.module('policeUK.services', ['leaflet-directive']);

  app.factory('services',
    function($rootScope, $http, $timeout) {
      return {
        config: function() {
          return {
            demoName: 'police-uk',
            protocol: 'http://',
            url: 'demos.gogeo.io/1.0',
            subdomains: ['m01', 'm02', 'm03', 'm04'],
            database: 'demos',
            collection: 'police_uk',
            clusterGeoAgg: 'crime_type',
            dashboardGeoAgg: 'falls_within',
            stylename: 'gogeo_many_points',
            mapkey: '5db514e30b9f340eda00671230d5136855ae14d7',
            prefix: 'maps.'
          }
        },
        canUseSubdomains: function(serviceName) {
          if ((serviceName === 'cluster.json' || serviceName === 'tile.png') && this.config().subdomains && this.config().subdomains.length > 0) {
            return true;
          }

          return false;
        },
        configureUrl: function(serviceName) {
          var prefix = this.config().prefix;
          if (this.canUseSubdomains(serviceName)) {
            prefix = '{s}.';
          }

          var url = this.config().protocol;

          if (prefix) {
            url = url + prefix;
          }

          url = url + this.config().url;
          return url;
        },
        pngUrl: function(geom, query) {
          var serviceName = 'tile.png';

          var prefix = this.config().prefix;
          if (this.canUseSubdomains(serviceName)) {
            prefix = '{s}.';
          }

          var url = this.configureUrl(prefix);

          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          url = url + '/map/' + database + '/' + collection;
          url = url + '/{z}/{x}/{y}/' + serviceName;
          url = url + '?mapkey=' + mapkey;

          var stylename = this.config().stylename;
          var buffer = 8;

          if (stylename === 'gogeo_heatmap') {
            // Avoid cut tile in heatmap view
            buffer = 32;
          }

          url = url + '&buffer=' + buffer;

          // Add style to URL
          url = url + '&stylename=' + stylename;

          // Prevent angular cache
          url = url + '&_=' + Math.random();

          // Add geom to URL
          if (geom) {
            url = url + '&geom=' + geom;
          }

          if (query) {
            if (typeof query === 'object') {
              query = JSON.stringify(query);
            }
            url = url + '&q=' + query;
          }

          return url;
        },
        clusterUrl: function(geom, query) {
          var serviceName = 'cluster.json';

          var url = this.configureUrl(serviceName);

          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          url = url + '/map/' + database + '/' + collection;
          url = url + '/{z}/{x}/{y}/' + serviceName;
          url = url + '?mapkey=' + mapkey;

          // Prevent angular cache
          url = url + '&_=1';

          // Add geom to URL
          if (geom) {
            url = url + '&geom=' + geom;
          }

          if (query) {
            if (typeof query === 'object') {
              query = JSON.stringify(query);
            }
            url = url + '&q=' + query;
          }

          return url;
        },
        geoAggUrl: function() {
          var serviceName = 'geoagg';
          var url = this.configureUrl(serviceName);
          var geoAggUrl = [url, serviceName, this.config().database, this.config().collection].join('/');
          return geoAggUrl;
        },
        clusterGeoAggregation: function(geometry, query, callback) {
          var url = this.geoAggUrl();

          var params = {
            mapkey: this.config().mapkey,
            geom: geometry,
            agg_size: 50,
            field: this.config().clusterGeoAgg // 'crime_type.raw'
          };

          if (query) {
            if (typeof query === 'string') {
              query = JSON.parse(query);
            }

            params['q'] = query;
          }

          $http.post(url, params).success(
            function(result) {
              $timeout(
                function() {
                  callback.call(null, result);
                }
              );
            }
          );
        },
        dashboardGeoAggregation: function(points, geometry, query, callback) {
          var url = this.geoAggUrl();

          var params = {
            mapkey: this.config().mapkey,
            agg_size: 100,
            field: this.config().dashboardGeoAgg
          };

          if (geometry) {
            params['geom'] = JSON.parse(geometry);
          } else {
            params['points'] = {
              top_right: points[0],
              bottom_left: points[1]
            };
          }

          if (query) {
            params['q'] = query;
          }

          $http.post(url, params).success(
            function(result) {
              $timeout(
                function() {
                  callback.call(null, result);
                }
              );
            }
          );
        },
        geosearch: function(latlng, zoom, query, callback) {
          var point = {
            type: 'Point',
            coordinates: [latlng.lng, latlng.lat]
          };

          // Determine the pixel distance in kilometers to a given latitude and zoom level
          // See "http://wiki.openstreetmap.org/wiki/Zoom_levels" for details
          var pixelDist = 40075 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2,(zoom + 8));

          var host = this.configureUrl('geosearch');
          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          var geoSearchUrl = host + '/geosearch/' + database + '/' + collection + '?mapkey=' + mapkey;

          var options = {
            limit: 1, // How many items to return
            buffer: pixelDist * 16, // Define a buffer with half marker size
            buffer_measure: 'kilometer',
            geom: point,
            fields: [
              'lsoa_name',
              'crime_type',
              'street',
              'month',
              'reported_by',
              'falls_within'
            ]
          };

          if (query) {
            options.q = JSON.stringify(query);
          }

          $http.post(geoSearchUrl, options).success(callback);
        }
      }
    }
  )
})();
