'use strict';

var ChartsController = function($scope, $rootScope) {
  $scope.drawChart = function() {
    var sample_data = $scope.geoAggData;

    // instantiate d3plus
    var visualization = d3plus.viz()
      .container('#viz')              // container DIV to hold the visualization
      .data(sample_data)              // data to use with the visualization
      .type('bubbles')                // visualization type
      .id(['group', 'name'])          // nesting keys
      .depth(1)                       // 0-based depth
      .size('value')                  // key name to size bubbles
      .color('name')                  // color by each group
      .legend({value: false})
      .draw()                         // finally, draw the visualization!
  }
};