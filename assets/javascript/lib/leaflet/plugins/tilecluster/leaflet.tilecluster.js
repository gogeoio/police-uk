/**

This is a plugin made based on:
- [1] Leaflet.utfgrid and
- [2] Leaflet.markercluster plugins;

[1] - https://github.com/danzel/Leaflet.utfgrid
[2] - https://github.com/Leaflet/Leaflet.markercluster

*/

'use strict';

L.Util.ajax = function(url, zoom, callback) {
  // the following is from JavaScript: The Definitive Guide
  // and https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Using_XMLHttpRequest_in_IE6
  if (window.XMLHttpRequest === undefined) {
    window.XMLHttpRequest = function() {
      /*global ActiveXObject:true */
      try {
        return new ActiveXObject("Microsoft.XMLHTTP");
      }
      catch  (e) {
        throw new Error("XMLHttpRequest is not supported");
      }
    };
  }

  var response, request = new XMLHttpRequest();
  request.open("GET", url);
  request.onreadystatechange = function() {
    /*jshint evil: true */
    if (request.readyState === 4 && request.status === 200) {
      if (window.JSON) {
        response = JSON.parse(request.responseText);
      } else {
        response = eval("(" + request.responseText + ")");
      }

      callback(response, zoom)
    }
  };
  request.send();
};

L.TileCluster = L.Class.extend({
  options: {
    subdomains: 'abc',

    minZoom: 1,
    maxZoom: 18,
    tileSize: 256,

    useJsonP: false,
    pointerCursor: true
  },

  initialize: function(url, options) {
    L.Util.setOptions(this, options);

    this._url = url;
    this._cache = {};
    this._group = L.featureGroup();
    this._jsonp_prefix = 'cl_us_ter_';

    if (url.match(/callback={cb}/) && !this.options.useJsonP) {
      console.error('Must set useJsonP options if you want use a callback function!');
      return null;
    }
    
    if (!url.match(/callback={cb}/) && this.options.useJsonP) {
      console.error('Must add callback={cb} url param to use with JsonP mode!');
      return null;
    }

    if (!this.options.createIcon) {
      this.options.createIcon = this._defaultIconCreateFunction;
    }

    if (!this.options.calculateClusterQtd) {
      this.options.calculateClusterQtd = this._calculateClusterQtd;
    }

    if (!this.options.formatCount) {
      this.options.formatCount = this._formatCount;
    }

    if (this.options.useJsonP) {
      //Find a unique id in window we can use for our callbacks
      //Required for jsonP
      var i = 0;
      while (window[this._jsonp_prefix + i]) {
        i++;
      }
      this._windowKey = this._jsonp_prefix + i;
      window[this._windowKey] = {};
    }

    var subdomains = this.options.subdomains;
    if (typeof this.options.subdomains === 'string') {
      this.options.subdomains = subdomains.split('');
    }
  },

  _calculateClusterQtd: function(zoom) {
    return 1;
  },

  _formatCount: function(count) {
    return count;
  },

  onAdd: function(map) {
    this._map = map;
    this._container = this._map._container;

    this._group.addTo(this._map);

    this._update();

    var zoom = this._map.getZoom();

    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
      return;
    }

    this._group.on('mouseover', this._drawConvexHull, this);
    this._group.on('mouseout', this._removeConvexHull, this);
    if (this.options.clickCallback && typeof this.options.clickCallback === 'function') {
      this._group.on('click', this._clickCluster, this);
    }
    map.on('moveend', this._update, this);
    map.on('zoomend', this._update, this);
  },

  _update: function() {

    this.clearClusters();

    var bounds = this._map.getPixelBounds(),
        zoom = this._map.getZoom(),
        tileSize = this.options.tileSize;

    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
      return;
    }

    var nwTilePoint = new L.Point(
        Math.floor(bounds.min.x / tileSize),
        Math.floor(bounds.min.y / tileSize)),
      seTilePoint = new L.Point(
        Math.floor(bounds.max.x / tileSize),
        Math.floor(bounds.max.y / tileSize)),
        max = this._map.options.crs.scale(zoom) / tileSize;

    // Load all required ones
    for (var x = nwTilePoint.x; x <= seTilePoint.x; x++) {
      for (var y = nwTilePoint.y; y <= seTilePoint.y; y++) {

        var xw = (x + max) % max, yw = (y + max) % max;
        if (xw < 0 || yw < 0) {
          return;
        }

        var key = zoom + '_' + xw + '_' + yw;

        if (!this._cache.hasOwnProperty(key)) {
          this._cache[key] = null;

          if (this.options.useJsonP) {
            this._loadTileP(zoom, xw, yw);
          } else {
            this._loadTile(zoom, xw, yw);
          }
        } else {
          this._drawCluster(this._cache[key], this, key, zoom);
        }
      }
    }
  },

  _loadTileP: function(zoom, x, y) {
    var head = document.getElementsByTagName('head')[0],
        key = zoom + '_' + x + '_' + y,
        functionName = this._jsonp_prefix + key,
        wk = this._windowKey,
        self = this;

    var url = L.Util.template(this._url, L.Util.extend({
      s: L.TileLayer.prototype._getSubdomain.call(this, { x: x, y: y }),
      z: zoom,
      x: x,
      y: y,
      cb: wk + '.' + functionName,
      cq: this.options.calculateClusterQtd(zoom)
    }, this.options));

    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', url);

    window[wk][functionName] = function(data, zoom) {
      self._cache[key] = data;
      delete window[wk][functionName];
      head.removeChild(script);

      if (!zoom) {
        zoom = self._map.getZoom();
      }

      self._drawCluster(data, self, key, zoom);
    };

    head.appendChild(script);
  },

  _loadTile: function(zoom, x, y) {
    var url = L.Util.template(this._url, L.Util.extend({
      s: L.TileLayer.prototype._getSubdomain.call(this, { x: x, y: y }),
      z: zoom,
      x: x,
      y: y,
      cq: this.options.calculateClusterQtd(zoom)
    }, this.options));

    var key = zoom + '_' + x + '_' + y;
    var self = this;
    L.Util.ajax(url, zoom,
      function(data, zoom) {
        self._cache[key] = data;
        self._drawCluster(data, self, key, zoom);
      }
    );
  },

  onRemove: function() {
    var map = this._map;

    this._group.off('mouseover', this._drawConvexHull, this);
    this._group.off('mouseout', this._removeConvexHull, this);
    if (this.options.clickCallback && typeof this.options.clickCallback === 'function') {
      this._group.off('click', this._clickCluster, this);
    }
    map.off('moveend', this._update, this);
    map.off('zoomend', this._update, this);

    this.clearClusters();

    if (this.options.pointerCursor) {
      this._container.style.cursor = '';
    }
    
    this._map.removeLayer(this._group);
  },

  _removeConvexHull: function() {
    var ch = this._convexHull;

    if (ch && this._map.hasLayer(ch)) {
      this._map.removeLayer(ch);
    }
    
    this._convexHull = null;
  },

  clearClusters: function() {
    this._removeConvexHull();
    this._group.clearLayers();
  },

  _drawCluster: function(data, self, key, zoom) {
    // Check if the zoom of cluster is the same of map
    if (data && data[0] && zoom == this._map.getZoom()) {
      for (var i in data) {
        var cluster = data[i];
        var coords = cluster.coords;
        var latlng = L.latLng(coords[0], coords[1]);

        if (cluster.count >= 2) {
          var clusterIcon = this.options.createIcon(cluster);
          var clusterMarker = L.marker(latlng,
            {
              icon: clusterIcon
            }
          );

          clusterMarker.key = key;
          clusterMarker.id = i;
          this._group.addLayer(clusterMarker);
        } else if (cluster.count == 1) {
          var marker = L.marker(latlng);
          this._group.addLayer(marker);
        }
      }
    }
  },

  _clickCluster: function(event) {
    var key = event.layer.key;
    var id = event.layer.id;

    var data = this._cache[key];

    if (!data || !data[id]) {
      return;
    }

    data = data[id];

    data.polygon = this._wktToPolygon(data.stats.hull);

    this.options.clickCallback(event, data);
  },

  _drawConvexHull: function(event) {
    // If already had a convex hull drawed
    if (this._convexHull) {
      return;
    }

    var key = event.layer.key;
    var id = event.layer.id;

    var data = this._cache[key];

    if (!data || !data[id]) {
      return;
    }

    data = data[id];

    if (data && data.stats.hull) {
      if (data.count >= 2) {
        var wkt = data.stats.hull;
        this._convexHull = this._wktToPolygon(wkt);
        this._map.addLayer(this._convexHull);
      }
    }
  },

  _wktToPolygon: function(wkt) {

    // Check if is a point
    if (wkt.match('POINT (.*)')) {
      return [];
    }

    // Convert a wkt POLYGON/LINESTRING to a Array of LatLng objects
    var string = wkt.replace('POLYGON', '');
    string = string.replace('LINESTRING', '');
    string = string.replace('(', '');
    string = string.replace('(', '');
    string = string.replace(')', '');
    string = string.replace(')', '');
    string = string.trim();

    var points = string.split(',');
    var lls = [];

    for (var i = 0; i < points.length; i++) {
      var point = points[i].trim();
      point = point.split(' ');

      var lat = parseFloat(point[0].trim());
      var lon = parseFloat(point[1].trim());

      lls.push(L.latLng(lat, lon));
    }

    return L.polygon(lls);
  },

  _defaultIconCreateFunction: function(cluster) {
    var childCount = cluster.count;

    var c = ' marker-cluster-';
    if (childCount < 100) {
      c += 'small';
    } else if (childCount < 10000) {
      c += 'medium';
    } else if (childCount < 100000) {
      c += 'large';
    } else {
      c += 'extra-large';
    }

    var iconPoint = new L.Point(40, 40);
    var klass = 'small';

    if (childCount >= 100000) {
      iconPoint = new L.Point(55, 55);
      klass = 'large';
    } else if (childCount >= 10000) {
      iconPoint = new L.Point(45, 45);
      klass = 'medium';
    }

    var formattedChildCount = childCount;

    if (this.formatCount && typeof this.formatCount === 'function') {
      formattedChildCount = this.formatCount(formattedChildCount);
    } else {
      formattedChildCount = this._formatCount(childCount);
    }

    return new L.DivIcon({ html: '<div class="' + klass + '"><span>' + formattedChildCount + '</span></div>', className: 'marker-cluster' + c, iconSize: iconPoint });
  }
});

L.tileCluster = function(url, options) {
  return new L.TileCluster(url, options);
};