var TranspoChoices = TranspoChoices || {};

(function(tc) {
  tc.geocoder = function(){
    var self = {},
      geocoder = new google.maps.Geocoder(),
      //Default to the continental US
      bounds = new google.maps.LatLngBounds(new google.maps.LatLng(-124.4, 32.5), new google.maps.LatLng(-66.7, 47.4)),
      region = 'US';

    self.currentLocationStr = 'Current Location';

    self.setCurrentLocation = function() {
      if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition(function(position) {
          self.currentLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          bounds = new google.maps.Circle({center:self.currentLatLng, radius:8000}).getBounds();

          $(tc).trigger('current-location', [self.currentLocationStr, self.currentLatLng]);
        }, function() {
          tc.util.log('error getting location');
        },
        {enableHighAccuracy:true});
      }
    };

    self.geocode = tc.util.limit(function(addr, callback) {
      geocoder.geocode({'address':addr, 'bounds':bounds, 'region': region }, function(results, status) {
        //If this could be "Current Location", then put on the top of the list
        if (self.currentLatLng && typeof addr === 'string' && addr && self.currentLocationStr.toLowerCase().indexOf(addr.trim().toLowerCase()) > -1) {
          results.unshift({
            currentLocation: true,
            formatted_address: self.currentLocationStr,
            geometry: {
              location: self.currentLatLng
            }
          });
        }

        callback(results);
      });
    }, 750, true);

    //Init and monitor the current location if available
    //Using getCurrentPosition with setInterval b/c Safari on iPhone wasn't
    //respecting the maximumAge
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      self.setCurrentLocation();

      setInterval(function(){
        self.setCurrentLocation();
      }, 30000);
    }

    return self;
  };
})(TranspoChoices);