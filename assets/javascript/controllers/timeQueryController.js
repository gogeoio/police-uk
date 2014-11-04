'use strict';

var TimeQueryController = function($scope, $rootScope, $timeout, services) {
  $scope.timelimit = {
    range: {
      min: new Date('2011-01').getTime(),
      // max: new Date('2011-07').getTime()
      max: new Date('2014-09').getTime()
    },
    minMonth: new Date('2011-01').getTime(),
    maxMonth: new Date('2011-07').getTime()
  };

  $scope.updateDate = function() {
    var minMonth = new Date($scope.timelimit.minMonth);
    var maxMonth = new Date($scope.timelimit.maxMonth);

    var fMinMonth = minMonth.getFullYear() + '-' + (minMonth.getMonth() + 1);
    var fMaxMonth = maxMonth.getFullYear() + '-' + (maxMonth.getMonth() + 1);

    $rootScope.$emit('event:dateUpdated', fMinMonth, fMaxMonth);    
  };
};