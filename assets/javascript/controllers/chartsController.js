'use strict';

var ChartsController = function($scope, $rootScope) {
  $scope.drawChart = function() {
    if ($scope.geoAggData && $scope.geoAggData.length > 0) {
      console.log('$scope.geoAggData', $scope.geoAggData, 'length', $scope.geoAggData);
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
        .margin('-40px 10px 0px 0px')
        .width({value: 370})
        .height({value: 320})
        .draw()                         // finally, draw the visualization!

      if (window._gaq) {
        _gaq.push(['_trackEvent', 'police-uk', 'chart']);
      }
    }
  }
};