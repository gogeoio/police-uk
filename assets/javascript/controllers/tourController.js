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
        title: 'Zoom in/out to change the detail level (use this buttons or your mouse wheel).'
      },
      {
        element: '.leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top',
        title: 'Click here to draw an area for analysis.'
      },
      {
        element: '.leaflet-draw-edit-edit.leaflet-disabled',
        title: 'Click here to change an existing area boundaries.'
      },
      {
        element: '.leaflet-draw-edit-remove.leaflet-disabled',
        title: 'Click here to remove an area restriction'
      },
      {
        element: '#geoagg-result-div',
        title: 'Dashboard business metrics updated in real time as you interact with the map.',
        placement: 'left'
      },
      {
        orphan: true,
        title: 'Click on the cluster to view charts by crime type within its coverage area.'
      },
      {
        element: '#searchInput',
        title: 'Search by crime types',
        content: $rootScope.crimeTypes.join('\n'),
        placement: 'bottom'
      },
      {
        element: '.timeline-slider',
        title: 'Change time range to filter the data. (Dec/10 - Aug/14)'
      },
      {
        element: '#help-button',
        title: 'Click the help button to see this tour again.'
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