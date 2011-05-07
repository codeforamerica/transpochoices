(function(){
  var $searchButton,
      $originInput,
      $destinationInput,
      $clearButton,
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
      data: {
        origin: origin,
        destination: destination
      },
      success: function(data, textStatus, jqXHR) {
        log(data);
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
    
    bindEvents();
  });
  
})();