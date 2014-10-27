'use strict';

var TourController = function($scope, $compile) {
  
  // Instance the tour
  $scope.tour = new Tour({
    template: '<div class="popover tour">' +
        '<div class="arrow"></div>' +
        '<h3 class="popover-title"></h3>' +
        '<div class="popover-navigation">' +
          '<button class="btn small btn-default" data-role="prev">« Prev</button>' +
          '<span data-role="separator"> </span>' +
          '<button class="btn small btn-default" data-role="next">Next »</button>' +
          '<button class="btn btn-default" data-role="end">End tour</button>' +
      '</div>' +
    '</div>',
    steps: [
      {
        element: '.leaflet-control-zoom.leaflet-bar.leaflet-control',
        title: 'Zoom in/out to change the detail level (use this buttons or your mouse wheel).',
        next: 1,
        prev: -1
      },
      {
        element: '.leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top',
        title: 'Click the rectangle to draw a spatial restriction!',
        next: 2,
        prev: 0
      },
      {
        element: '#geoagg-result-div',
        title: 'This dashboard will be updated as you interact with the map!',
        next: 3,
        prev: 1,
        placement: 'left'
      },
      {
        element: '.leaflet-marker-icon.marker-cluster.marker-cluster-extra-large.leaflet-zoom-animated.leaflet-clickable',
        title: 'Click the clusters to view a chart by type of crime.',
        next: -1,
        prev: 2,
        placement: 'bottom'
      }
    ]
  });

  $scope.startTour = function(forceTour) {
    // Initialize the tour
    $scope.tour.init();

    // Start the tour
    $scope.tour.start(forceTour);

    if ($scope.tour.getCurrentStep() != 0) {
      $scope.tour.goTo(0);
    }
  };

  $scope.startTour(false);
};