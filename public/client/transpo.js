(function(){
  var $searchButton,
      $originInput,
      $destinationInput,
      $metricsContent,
      options = {
          modes: ['walking', 'biking', 'transit', 'driving'],
          metrics: ['cost', 'duration', 'calories', 'emissions']
      },
      metricsEjs = new EJS({url: 'views/metrics.ejs'}),
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
  
  var clearInputs = function() {
    $originInput.val('');
    $destinationInput.val('');
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

        $('#metrics-table tbody th, #metrics-table tbody td').bind('tap', function(evt) {
          $('#plan h1').text(this.parentNode.id);
          $.mobile.changePage('plan');
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
  
  var bindEvents = function() {
    $searchButton.tap(function() {
      calculate($originInput.val(), $destinationInput.val());
    });
  };

  $('#search').live('pagecreate',function(evt) {
    //Cache vars
    $searchButton = $('#search-button');
    $originInput = $('#origin');
    $destinationInput = $('#destination');
    $metricsContent = $('#metrics-content');
    
    bindEvents();
  });

  $(document).bind("mobileinit", function() {
    //Disabling this b/c it could be bad for bookmarking
    $.mobile.hashListeningEnabled = false;
  });
})();