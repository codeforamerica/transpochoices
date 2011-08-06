var TranspoChoices = TranspoChoices || {};

(function(tc){
  var self = {},
    geocoder = new google.maps.Geocoder(),
    curLatLng,
    bounds,
    region = 'US',
    currentLocationStr = 'Current Location';
  
  // Init the current location
  var initCurrentLocation = function(position) {
    curLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    bounds = new google.maps.Circle({center:curLatLng, radius:8000}).getBounds();
    
    $(tc).trigger('current-location', [currentLocationStr, curLatLng]);
  };
  
  // Does this string match the currentLocationStr var
  self.getCurrentLocation = function(term) {
    if (term === currentLocationStr && curLatLng) {
      return curLatLng;
    }
    
    return null;
  };
  
  // Get access to the current position directly from the geolocation object
  self.getCurrentPosition = function(success, error) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, maximumAge: 90000 });
    } 
  };

  self.geocode = tc.util.limit(function(addr, callback) {
    geocoder.geocode({'address':addr, 'bounds':bounds, 'region': region }, function(results, status) {
      tc.util.log(results);
      
      //If this could be "Current Location", then put on the top of the list
      if (curLatLng && typeof addr === 'string' && addr && currentLocationStr.toLowerCase().indexOf(addr.trim().toLowerCase()) > -1) {
        results.unshift({
          currentLocation: true,
          formatted_address: currentLocationStr,
          geometry: {
            location: curLatLng
          }
        });
      }

      callback(results);
    });
  }, 750, true);
  
  self.getCurrentPosition(initCurrentLocation);

  tc.geocoder = self;
})(TranspoChoices);