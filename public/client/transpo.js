var TranspoChoices = TranspoChoices || {};

(function(tc){
  var $searchButton,
    $cancelButton,
    $originInput,
    $destinationInput,
    $metricsContent,
    $googleLink,
    $bingLink,
    $planTitle,
    options = {
        modes: ['walking', 'biking', 'transit', 'taxi', 'driving'],
        metrics: ['cost', 'duration', 'calories', 'emissions']
    },
    curPlan,
    curLocationStr,
    curLatLng;

  //Renderers for the metrics returned by the server,
  //keyed by the type.
  var renderers = {
    //Not Available
    'na': function(val) {
      if (val || val === 0) {
        return null;
      } else {
        return {
          value: 'N/A',
          label: ''
        };
      }
    },
    //Km to miles
    'km': function(val) {
      return renderers.na(val) || {
        value: (val * 0.62137).toFixed(1),
        label: 'miles'
      };
    },
    //Seconds to minutes
    'sec': function(val) {
      return renderers.na(val) || {
        value: (val / 60).toFixed(0),
        label: 'minutes'
      };
    },
    //Kg of CO2
    'kg_co2': function(val) {
      return renderers.na(val) || {
        value: (val || 0).toFixed(1),
        label: 'lbs CO<sub>2</sub>'
      };
    },
    //US Dollars
    'usd': function(val) {
      return renderers.na(val) || {
        value: '$' + (val || 0).toFixed(2),
        label: '&nbsp;'
      };
    },
    //Calaries
    'cal': function(val) {
      return {
        value: (val || 0).toFixed(),
        label: 'calories'
      };
    }
  };

  //Helper function to get the Google maps link based on the mode
  var makeGoogleUrl = function(origin, destination, mode) {
    var modes = {
      'walking': 'w',
      'biking': 'b',
      'transit': 'r',
      'taxi': 'd',
      'driving': 'd'
    };

    if (modes[mode]) {
      return 'http://www.google.com/maps?saddr=' + encodeURIComponent(origin) + '&daddr=' +
        encodeURIComponent(destination) + '&dirflg=' + modes[mode];
    }

    return null;
  };

  //Helper function to get the Bing maps link based on the mode
  var makeBingUrl = function(origin, destination, mode) {
    var now = new Date(),
      //201106061257
      nowStr = '' + now.getFullYear() + tc.util.zeroPad(now.getMonth()+1, 2) + tc.util.zeroPad(now.getDate(), 2) +
        tc.util.zeroPad(now.getHours(), 2) + tc.util.zeroPad(now.getMinutes(), 2),
      modes = {
        'walking': 'W',
        'transit': 'T',
        'taxi': 'D',
        'driving': 'D'
      };

    if (modes[mode]) {
      return 'http://m.bing.com/directions#/Maps?w=a.' + encodeURIComponent(origin) + '~a.' +
        encodeURIComponent(destination) + '&mode=' + modes[mode] + '&limit=D&time=' + nowStr;
    }

      return null;
  };

  //Format the raw results into the human readable object literal
  var formatResults = function(data) {
    var val, i, j, metric, mode, total = 0, results = {};

    // For every mode as defined in options
    for(j=0; j<options.modes.length; j++) {
      mode = options.modes[j];

      // Do we have results for this mode
      if (data.results[mode]) {
        total++;
        results[mode] = {};

        // For every metric as defined in options
        for (i=0; i<options.metrics.length; i++) {
          metric = options.metrics[i];

          // Store the pretty metrics if they are available
          if (metric) {
            results[mode][metric] = renderers[data.units[metric]](data.results[mode][metric]);
          }
        }
      }
    }

    return {
      total: total,
      results: results
    };
  };

  // Construct the HTML to display the the metrics table
  var makeMetricsTable = function(metrics, results) {
    var i,
      mode,
      html = '<table id="metrics-table">' +
        '<thead><tr><th>';

      // Add the metrics header icons
      for(i=0; i<metrics.length; i++) {
        html += '<th class="' +  metrics[i] + '">';
      }

      html += '<th></thead><tbody>';

      // Add the mode rows
      for(mode in results) {
        if (results.hasOwnProperty(mode)) {
          html += '<tr id="' + mode + '"><th>';

          // Add the metric values for each mode
          for(i=0; i<metrics.length; i++) {
            html += '<td><div class="metric-value">' + results[mode][metrics[i]].value + '</div>' +
              '<div class="metric-label">' + results[mode][metrics[i]].label + '</div>';
          }
          html += '<td class="metric-more"><div class="ui-icon ui-icon-arrow-r"></div>';
        }
      }
      html += '</tbody></table>';

      return html;
  };

  // Calculate the results from the origin to the destination,
  // display the results, and bind events.
  var calculate = function(origin, destination) {
    $.mobile.pageLoading();

    $.ajax({
      url: 'info_for_route_bing',
      dataType: 'json',
      data: {
        origin: origin,
        destination: destination
      },
      success: function(data, textStatus, jqXHR) {
        var obj = formatResults(data),
          total = obj.total,
          results = obj.results,
          html = makeMetricsTable(options.metrics, results);

        if (total > 0) {
          // Set the display table
          $metricsContent.html(html);

          // Tap to show the directions for the given mode
          $('#metrics-table tbody th, #metrics-table tbody td').bind('tap', function(e) {
            tc.util.trackEvent('mode', 'click', this.parentNode.id);

            curPlan = { origin: origin, destination: destination, mode:this.parentNode.id };
            $.mobile.changePage('#plan');
            e.preventDefault();
          });

          // Go the home page to display the results
          $.mobile.changePage('#home', {
            transition: 'flip'
          });

          // Show the cancel button now, otherwise we could go to a blank home page
          $cancelButton.show();
        } else {
          $cancelButton.hide();
          alert('No routes found');
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        tc.util.log(errorThrown);
        alert('Unable to calculate directions');
        $.mobile.pageLoading(true);
      },
      complete: function() {
        $.mobile.pageLoading(true);
      }
    });
  };

  // Creates an autocomplete list of geocoded address matches
  // The searchId binds this either the origin or destination
  // input field. 
  var listAddresses = function(searchId) {
    var $list = $('#' + searchId + '-list'),
      $input = $('#' + searchId);

    return function (results, status) {
      $list.empty();

      $.each(results, function(i, val) {
        if (val.currentLocation) {
          $list.append('<li data-icon="false" class="current-location" data-latlon="'+val.geometry.location.lat()+','+val.geometry.location.lng()+'">' + val.formatted_address + '</li>');
        } else {
          $list.append('<li data-icon="false" data-latlon="'+val.geometry.location.lat()+','+val.geometry.location.lng()+'">' + val.formatted_address + '</li>');
        }
      });

      // This is needed for jQuery Mobile to make it pretty
      $list.listview('refresh');

      // Bind the tap event to select the address and populate the input
      $('li', $list).tap(function(e) {
        var $this = $(this);

        $input
          .val($this.text())
          .change();

        $list.empty();
        e.preventDefault();
      });
    };
  };

  // Toggle whether the search button is active based on the
  // input of the origin and destingation input fields.
  var handleInputChange = function() {    
    if ($originInput.val() || $destinationInput.val()) {
      $searchButton
        .removeAttr('disabled')
        .parent()
        .removeClass('disabled-btn');
    } else {
      $searchButton
        .attr('disabled', 'disabled')
        .parent()
        .addClass('disabled-btn');
    }

    handleCurrentLocation($originInput);
    handleCurrentLocation($destinationInput);

    if (!$originInput.val()) {
      $('#origin-list').empty();
    }
    if (!$destinationInput.val()) {
      $('#destination-list').empty();
    }
  };
  
  // If the input is current location, set the class
  // and data-latlon attr
  var handleCurrentLocation = function($input) {
    if (curLatLng && curLocationStr) {
      if ($input.val() === curLocationStr) {
        $input.addClass('current-location')
          .attr('data-latlon', curLatLng.lat()+','+curLatLng.lng());
      
      } else {
        $input.removeClass('current-location')
          .removeAttr('data-latlon');
      }
    }
  };

  // Bind common events here
  var bindEvents = function() {
    // Geocode on keyup
    $originInput
      .keyup(function() {
        if ($originInput.val()) {
          tc.geocoder.geocode($originInput.val(), listAddresses('origin'));
        }
        handleInputChange();
      })
      .change(handleInputChange);

    // Geocode on keyup
    $destinationInput
      .keyup(function() {
        if ($destinationInput.val()) {
          tc.geocoder.geocode($destinationInput.val(), listAddresses('destination'));
        }
        handleInputChange();
      })
      .change(handleInputChange);

    // Build the plan page - buttons with links to Bing and Google directions
    $('#plan').live('pagebeforeshow', function() {
      var googleUrl = makeGoogleUrl(curPlan.origin, curPlan.destination, curPlan.mode),
        bingUrl = makeBingUrl(curPlan.origin, curPlan.destination, curPlan.mode);

      $googleLink = $googleLink || $('#google-link');
      $bingLink = $bingLink || $('#bing-link');
      $planTitle = $planTitle || $('#plan-title');

      $planTitle.text(curPlan.mode);

      // Setup Google
      if (googleUrl) {
        $googleLink.show().attr('href', googleUrl);
      } else {
        $googleLink.hide();
      }

      // Setup Bing
      if (bingUrl) {
        $bingLink.show().attr('href', bingUrl);
      } else {
        $bingLink.hide();
      }

      // Bind button tap
      $googleLink.tap(function(){
        tc.util.trackEvent('directions', 'get', 'google');
      });

      // Bind button tap event
      $bingLink.tap(function(){
        tc.util.trackEvent('directions', 'get', 'bing');
      });
    });

    // Bind search button tap event
    $searchButton.tap(function(e) {
      if (!$searchButton.is(':disabled')) {
        tc.util.trackEvent('directions', 'search');
        calculate(($originInput.attr('data-latlon') || $originInput.val()), ($destinationInput.attr('data-latlon') || $destinationInput.val()));
        e.preventDefault();
      }
    });
    
    (function customBackButtonOnAboutPage() {
      var pageId;
      
      $('.tc-btn-back').live('tap',function(e, ui) {
        $.mobile.changePage('#'+pageId, {
          transition: 'slide',
          reverse: true
        });
      });

      $('div[data-role="page"]').live('pageshow',function(event, ui){
        pageId = ui.prevPage.attr('id');
      });
    })();
        
    $(tc).bind('current-location', function(event, currentLocationStr, currentLatLng) {
      curLocationStr = currentLocationStr;
      curLatLng = currentLatLng;
      
      // Init origin to current location if available
      $originInput.val(curLocationStr);
      handleCurrentLocation($originInput);
    });
  };

  // Onready for mobile - start here
  $('#search').live('pagecreate',function(evt) {
    //Cache vars
    $searchButton = $('#search-button');
    $cancelButton = $('#cancel-button');
    $originInput = $('#origin');
    $destinationInput = $('#destination');
    $metricsContent = $('#metrics-content');

    // Setup the search button state
    handleInputChange();

    // Bind events
    bindEvents();
  });

  // Setup jQuery Mobile options
  $(document).bind("mobileinit", function() {
    //Disabling this b/c it could be bad for bookmarking
    $.mobile.hashListeningEnabled = false;
  });
})(TranspoChoices);
