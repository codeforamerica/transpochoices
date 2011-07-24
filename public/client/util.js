var TranspoChoices = TranspoChoices || {};

(function(tc){
  tc.util = {
    //Limit function, thanks to _!
    limit: function(func, wait, debounce) {
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
    },

    //Safely log to the console
    log: function(toLog) {
      if (window.console && window.console.log) {
        window.console.log(toLog);
      }
    },

    //Safely track and event to Google Analytics
    trackEvent: function(category, action, opt_label, opt_value) {
      var args = Array.prototype.slice.call(arguments);
      if (_gaq) {
        args.unshift('_trackEvent');
        _gaq.push(args);
      } else {
        log(category, action, opt_label, opt_value);
      }
    },

    //Left pad a number with zeros
    zeroPad: function (number, width) {
      width -= number.toString().length;
      if ( width > 0 ) {
        return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
      }
      return number;
    }
  };
})(TranspoChoices);