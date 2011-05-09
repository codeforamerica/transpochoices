(function(){
  var $searchButton,
      $originInput,
      $destinationInput,
      $clearButton,
      $metricsContent,
      log = function(toLog) {
        if (window.console && window.console.log) {
          window.console.log(toLog);
        }
      };
  
  var clearInputs = function() {
    $originInput.val('');
    $destinationInput.val('');
  };
  
  var calculate = function (origin, destination) {
    $.ajax({
      url: 'info_for_route_bing',
      dataType: 'json',
      data: {
        origin: origin,
        destination: destination
      },
      success: function(data, textStatus, jqXHR) {
        var html = '';
                
        $.each(data.results, function(key, val) {
          html += '<div>' + key + '</div>';
        });
        
        log(html);
        
        $metricsContent.html(html);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        log(errorThrown);
      }
    });
  };
  
  var bindEvents = function(){
    $searchButton.tap(function(){
      calculate($originInput.val(), $destinationInput.val());
    });
    
    $clearButton.tap(clearInputs);
  };

  $('#home').live('pagecreate',function(event){
    //Cache vars
    $searchButton = $('#search-button');
    $originInput = $('#origin');
    $destinationInput = $('#destination');    
    $clearButton = $('#clear-button');
    $metricsContent = $('#metrics-content');
    
    bindEvents();
  });
  
})();