(function(){
  var $searchButton,
      $originInput,
      $destinationInput,
      $metricsContent,
      options = {
          modes: ['walking', 'biking', 'transit', 'taxi', 'driving'],
          metrics: ['cost', 'duration', 'calories', 'emissions']
      },
      metricsEjs = new EJS({url: 'views/metrics.ejs'}),
      geocoder = new google.maps.Geocoder(),
      curLatLng,
      geocodeDelay = 2000, //ms
      log = function(toLog) {
        if (window.console && window.console.log) {
          window.console.log(toLog);
        }
      };
  
  var renderers = {
    'km': function(val) {
      return {
        value: (val * 0.62137).toFixed(1),
        label: 'miles'
      };
    },
    'sec': function(val) {
      return {
        value: (val / 60).toFixed(0),
        label: 'minutes'
      };
    },
    'kg_co2': function(val) {
      return {
        value: (val || 0).toFixed(2),
        label: 'kg of CO2'
      };
    },
    'usd': function(val) {
      return {
        value: '$' + (val || 0).toFixed(2),
        label: '&nbsp;'
      };
    },
    'cal': function(val) {
      return {
        value: (val || 0).toFixed(),
        label: 'calories'
      };
    }
  };
  
  var locateMe = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( function(position) {
        curLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      }, 
      function(msg){
        alert('We couldn\'t locate your position.');
      },
      { enableHighAccuracy: true, maximumAge: 90000 });
    } 
  };  

  
  var formatResults = function(data) {
    var val, i, j, metric, mode, results = {};
    
    for(j=0; j<options.modes.length; j++) {
      mode = options.modes[j];
      
      if (data.results[mode]) {
        results[mode] = {};

        for (i=0; i<options.metrics.length; i++) {
          metric = options.metrics[i];
        
          if (metric) {
            results[mode][metric] = renderers[data.units[metric]](data.results[mode][metric]);
          }
        }
      }
    }
    
    return results;
  };
  
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
        var results = formatResults(data),
          html = metricsEjs.render({
            metrics: options.metrics,
            results: results
          });
        
        $metricsContent.html(html);

        $('#metrics-table tbody th, #metrics-table tbody td').bind('tap', function(e) {
          $('#plan h1').text(this.parentNode.id);
          $.mobile.changePage('plan');
          e.preventDefault();
        });

        $.mobile.changePage('home', {
          transition: 'flip'
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        log(errorThrown);
        alert('Error calculating directions');
        $.mobile.pageLoading(true);
      },
      complete: function() {
        $.mobile.pageLoading(true);
      }
    });
  };
  
  var listAddresses = function(searchId) {
    var $list = $('#' + searchId + '-list'),
      $input = $('#' + searchId);
    
    return function (results, status) {
      $list.empty();
      
      $.each(results, function(i, val) {
        $list.append('<li data-icon="false">' + val.formatted_address + '</li>');
      });
      
      $list.listview('refresh');
      
      $('li', $list).tap(function(e) {
        $input.val(this.innerHTML);
        $list.empty();
        e.preventDefault();ƒ
      });
    };
  };
  
  var delay = function(func, timeout) {
    var timeoutId;
    return function() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(func, timeout);
    };
  };
  
  var bindEvents = function() {
    var bounds;
    
    $originInput.keyup(function() {
      bounds = bounds || new google.maps.Circle({center:curLatLng, radius:8000}).getBounds();
      var geocode = delay(function() {
        geocoder.geocode({'address':$originInput.val(), 'bounds':bounds }, listAddresses('origin'));
      }, geocodeDelay);
      
      geocode();
    });

    $destinationInput.keyup(function() {
      bounds = bounds || new google.maps.Circle({center:curLatLng, radius:8000}).getBounds();
      var geocode = delay(function() {
        geocoder.geocode({'address':$destinationInput.val(), 'bounds':bounds }, listAddresses('destination'));
      }, geocodeDelay);

      geocode();
    });

    $searchButton.tap(function(e) {
      calculate($originInput.val(), $destinationInput.val());
      e.preventDefault();
    });
  };

  $('#search').live('pagecreate',function(evt) {
    //Cache vars
    $searchButton = $('#search-button');
    $originInput = $('#origin');
    $destinationInput = $('#destination');
    $metricsContent = $('#metrics-content');
    
    locateMe();
    
    bindEvents();
  });

  $(document).bind("mobileinit", function() {
    //Disabling this b/c it could be bad for bookmarking
    $.mobile.hashListeningEnabled = false;
  });
})();