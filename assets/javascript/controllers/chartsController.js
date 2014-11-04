'use strict';

var ChartsController = function($scope, $rootScope) {
  $scope.drawChart = function() {
    $scope.total = 0;

    $scope.geoAggData.forEach(
      function(item) {
        $scope.total += item.value;
      }
    );

    $scope.format = function(number, valueString, d3Object, item) {
      var percent = $.number((number / $scope.total) * 100, 2);
      return percent + ' %';
    };

    if ($scope.geoAggData && $scope.geoAggData.length > 0) {
      var length = $scope.geoAggData.length;
      var height = 320;
      var width = 370;
      var margin = '-20px 10px 0px 0px';

      if (length == 1) {
        height = 300;
        width = 350;
        margin = '40px 0px 0px 30px';
      }

      // instantiate d3plus
      d3plus.viz()
        .container('#viz')              // container DIV to hold the visualization
        .data($scope.geoAggData)        // data to use with the visualization
        .type('bubbles')                // visualization type
        .id(['group', 'name'])          // nesting keys
        .depth(1)                       // 0-based depth
        .size('value')                  // key name to size bubbles
        .color('name')                  // color by each group
        .legend({value: false})
        .margin(margin)
        .width({value: width})
        .height({value: height})
        .title(false)
        .format({'number': $scope.format})
        .draw()                         // finally, draw the visualization!

      if (window._gaq) {
        _gaq.push(['_trackEvent', 'police-uk', 'chart']);
      }
    }
  }
};