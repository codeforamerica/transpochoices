(function(){
  var $searchButton,
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
      metricsEjs = new EJS({url: 'views/metrics.ejs'}),
      geocoder = new google.maps.Geocoder(),
      curLatLng,
      curPlan,
      log = function(toLog) {
        if (window.console && window.console.log) {
          window.console.log(toLog);
        }
      };
  
  var zeroPad = function (number, width) {
    width -= number.toString().length;
    if ( width > 0 ) {
      return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
    }
    return number;
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
  
  var makeGoogleUrl = function(origin, destination, mode) {
    var modes = {
      'walking': 'w', 
      'biking': 'b', 
      'transit': 't', 
      'taxi': 'd', 
      'driving': 'd'
    };
    
    if (modes[mode]) {
      return 'http://www.google.com/maps?saddr=' + encodeURIComponent(origin) + '&daddr=' + 
        encodeURIComponent(destination) + '&dirflg=' + modes[mode];
    }

    return null;
  };
  
  var makeBingUrl = function(origin, destination, mode) {
    var now = new Date(),
      //201106061257
      nowStr = '' + now.getFullYear() + zeroPad(now.getMonth()+1, 2) + zeroPad(now.getDate(), 2) + 
        zeroPad(now.getHours(), 2) + zeroPad(now.getMinutes(), 2),
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
          curPlan = { origin: origin, destination: destination, mode:this.parentNode.id };
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
        e.preventDefault();
      });
    };
  };
  
  //Thanks _!
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };
  
  var toggleSearch = function() {
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
  };
  
  var bindEvents = function() {
    var bounds,
      delayedGeocode = limit(function(addr, bounds, listId) {
        geocoder.geocode({'address':addr, 'bounds':bounds }, listAddresses(listId));
      }, 1000, true);
    
    $originInput.keyup(function() {
      if ($originInput.val()) {
        bounds = bounds || new google.maps.Circle({center:curLatLng, radius:8000}).getBounds();
        delayedGeocode($originInput.val(), bounds, 'origin');
      }
      toggleSearch();
    })
    .change(function(){
      toggleSearch();
    });

    $destinationInput.keyup(function() {
      if ($destinationInput.val()) {
        bounds = bounds || new google.maps.Circle({center:curLatLng, radius:8000}).getBounds();
        delayedGeocode($destinationInput.val(), bounds, 'destination');
      }    
      toggleSearch();
    })
    .change(function(){
      toggleSearch();
    });
    
    toggleSearch();
    
    $('#plan').live('pagebeforeshow', function() {
      var googleUrl = makeGoogleUrl(curPlan.origin, curPlan.destination, curPlan.mode), 
        bingUrl = makeBingUrl(curPlan.origin, curPlan.destination, curPlan.mode);

      $googleLink = $googleLink || $('#google-link');
      $bingLink = $bingLink || $('#bing-link');
      $planTitle = $planTitle || $('#plan-title');

      $planTitle.text(curPlan.mode);

      if (googleUrl) {
        $googleLink.show().attr('href', googleUrl);
      } else {
        $googleLink.hide();
      }
      
      if (bingUrl) {
        $bingLink.show().attr('href', bingUrl);
      } else {
        $bingLink.hide();
      }    
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