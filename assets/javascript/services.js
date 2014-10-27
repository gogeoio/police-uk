'use strict';

(function() {
  var app = angular.module('policeUK.services', ['leaflet-directive']);

  app.factory('services',
    function($rootScope, $http, $timeout) {
      return {
        config: function() {
          return {
            protocol: 'http://',
            url: '192.168.88.143:9090',
            subdomains: ['m1', 'm2', 'm3'],
            database: 'db1',
            collection: 'police_uk_500k_2',
            mapkey: '123'
          }
        },
        canUseSubdomains: function(serviceName) {
          if ((serviceName === 'cluster.json' || serviceName === 'tile.png') && this.config().subdomains && this.config().subdomains.length > 0) {
            return true;
          }

          return false;
        },
        configureUrl: function(serviceName) {

          var prefix = 'maps.';
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

          var prefix = 'maps.';
          if (this.canUseSubdomains(serviceName)) {
            prefix = '{s}.';
          }

          var url = this.configureUrl(prefix);

          var database = this.config().database;
          // var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          url = url + '/map/' + database + '/' + collection;
          url = url + '/{z}/{x}/{y}/' + serviceName;
          url = url + '?mapkey=' + mapkey;

          // That is to not cut the marker.
          url = url + '&buffer=16';

          // Add style to URL
          if (style) {
            url = url + '&stylename=' + style;
          }

          // Prevent angular cache
          url = url + '&_=' + Math.random();

          // Add geom to URL
          if (geom) {
            url = url + '&geom=' + geom;
          }

          if (query) {
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
          url = url + '&_=' + Math.random();

          // Add geom to URL
          if (geom) {
            url = url + '&geom=' + geom;
          }

          if (query) {
            url = url + '&q=' + query;
          }

          return url;
        },
        geoAggUrl: function() {
          var serviceName = 'geoagg';
          // console.log('this.config()', this.config());
          var url = this.configureUrl(serviceName);
          var geoAggUrl = [url, serviceName, this.config().database, this.config().collection].join('/');
          return geoAggUrl;
        },
        clusterGeoAggregation: function(geometry, callback) {
          var url = this.geoAggUrl();

          var params = {
            mapkey: this.config().mapkey,
            geom: geometry,
            agg_size: 50,
            field: 'crime_type'
          };

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
        dashboardGeoAggregation: function(points, geometry, callback) {
          var url = this.geoAggUrl();

          var params = {
            mapkey: this.config().mapkey,
            agg_size: 100,
            field: 'falls_within'
          };

          if (geometry) {
            params['geom'] = JSON.parse(geometry);
          } else {
            params['points'] = {
              top_right: points[0],
              bottom_left: points[1]
            };
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
        }
      }
    }
  )
})();