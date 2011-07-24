var TranspoChoices = TranspoChoices || {};

(function(tc){
  var self = {},
    geocoder = new google.maps.Geocoder(),
    curLatLng,
    bounds,
    region = 'US',
    currentLocationStr = 'Current Location';
  
  var initCurrentPosition = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( function(position) {
        curLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        bounds = new google.maps.Circle({center:curLatLng, radius:8000}).getBounds();
      }, null,
      { enableHighAccuracy: true, maximumAge: 90000 });
    } 
  };

  self.geocode = tc.util.limit(function(addr, callback) {
    if (curLatLng && typeof addr === 'string' && addr && currentLocationStr.toLowerCase().indexOf(addr.trim().toLowerCase()) > -1) {
      callback([
        {
          formatted_address: currentLocationStr,
          geometry: {
            location: curLatLng
          }
        }
      ]);
    } else {
      geocoder.geocode({'address':addr, 'bounds':bounds, 'region': region }, function(results, status) {
        callback(results);
      });
    }
  }, 750, true);
  
  initCurrentPosition();
  tc.geocoder = self;
})(TranspoChoices);