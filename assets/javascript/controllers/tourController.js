'use strict';

var TourController = function($scope, $rootScope) {

  var template = [
    '<div class="popover tour">',
      '<div class="arrow"></div>',
      '<h3 class="popover-title"></h3>',
      '<div class="popover-navigation">',
        '<button class="btn small btn-default" data-role="prev">« Prev</button>',
        '<span data-role="separator"> </span>',
        '<button class="btn small btn-default" data-role="next">Next »</button>',
        '<button class="btn btn-default" data-role="end">End tour</button>',
      '</div>',
    '</div>'
  ];

  var contentElement = '<div class="popover-content"></div>';
  $scope.crimeTypesContent = [];

  $scope.selectTemplate = function(index, step) {
    if (step.content.length > 7 && template[3] !== contentElement) {
      template.splice(3, 0, contentElement);

      if ($scope.crimeTypesContent.length == 0) {
        var content = step.content.split('\n');
        content.forEach(
          function(item) {
            if (item && item.length > 0) {
              $scope.crimeTypesContent.push('<li>' + item + '</li>');
            }
          }
        );
      }

      step.content = $scope.crimeTypesContent.join(' ');
    } else if (step.content.length == 7 && template[3] === contentElement) {
      template.splice(3, 1);
    }

    return template.join(' ');
  };

  // Instance the tour
  $scope.tour = new Tour({
    name: 'police-uk-tour',
    template: $scope.selectTemplate,
    steps: [
      {
        element: '.leaflet-control-zoom.leaflet-bar.leaflet-control',
        title: 'Zoom in/out to change the detail level (use this buttons or your mouse wheel).',
        next: 1,
        prev: -1
      },
      {
        element: '.leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top',
        title: 'Click here to draw an area for analysis.',
        next: 2,
        prev: 0
      },
      {
        element: '.leaflet-draw-edit-edit.leaflet-disabled',
        title: 'Click here to change an existing area boundaries.',
        next: 3,
        prev: 1,
      },
      {
        element: '.leaflet-draw-edit-remove.leaflet-disabled',
        title: 'Click here to remove an area restriction',
        next: 4,
        prev: 2,
      },
      {
        element: '#geoagg-result-div',
        title: 'Dashboard business metrics updated in real time as you interact with the map.',
        next: 5,
        prev: 3,
        placement: 'left'
      },
      {
        orphan: true,
        title: 'Click on the cluster to view charts by crime type within its coverage area.',
        next: 6,
        prev: 4
      },
      {
        element: '#searchInput',
        title: 'Search by crime types',
        content: $rootScope.crimeTypes.join('\n'),
        next: 7,
        prev: 5,
        placement: 'bottom'
      },
      {
        element: '#help-button',
        title: 'Click the help button to see this tour again.',
        next: -1,
        prev: 6
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