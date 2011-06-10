var _kd = document;
var _kdlh = _kd.location.href;
var _ki,_kq,_kv;
var _kwtlForm;
var _kretURL;
var _kwtlOnSubmit;
var _koid;

function __krand() {
    return Math.round(Math.random() * 256).toString(16) + Math.round(Math.random() * 256).toString(16);
}

function __kuuid() {
    return __krand() + "-" + __krand() + "-" + __krand() + "-" + __krand() + new Date().getTime().toString(16);
}

function __kgetCookieDomain() {
    // top level domain suffixes that are usually found immediately after the domain name (e.g. www.google.co.uk)
    var domainSuffixes = "aero;arpa;biz;cat;co;coop;com;edu;gov;info;int;jobs;mil;mobi;museum;name;net;org;pro;travel;";
    var domain = document.domain;
    var temp = domain.split('.');
    if ( (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/).test(domain) ) {
        return domain;
    } else if ( temp.length === 1 ) {
	return null;
    } else {
        var d = "";
        var i = 0;
		while( i < 2 ) {
			i++;
            var suffix = temp[temp.length - i];
            d =  suffix + (i > 1 ? "." : "") + d;
			if ( domainSuffixes.indexOf(suffix + ";") !== -1 ) {
				d = temp[temp.length - i - 1] + "." + d;
				break;
			}
		}
		return d;
	}
}

function __kinit() {
    var q;
    var d = __kgetCookieDomain();
    var hasTrackingInfo = _kdlh.indexOf('&_kt=') !== -1 || _kdlh.indexOf('?_kt=') !== -1 ;
    if( _kd.cookie.indexOf('__kti') === -1 || hasTrackingInfo ) {
        _kv = new Date().getTime() + ',' + encodeURIComponent(_kdlh) + ',' + encodeURIComponent(_kd.referrer);
        _kd.cookie = "__kti=" + _kv + "; path=/; expires=Sun, 18 Jan 2038 00:00:00 GMT;" + (d===null ? "" : " domain="+d);
    }

    if( _kd.cookie.indexOf('__kts') === -1 || hasTrackingInfo ) {
        _kv = new Date().getTime() + ',' + encodeURIComponent(_kdlh) + ',' + encodeURIComponent(_kd.referrer);
        _kd.cookie = "__kts=" + _kv + "; path=/;" + (d===null ? "" : " domain="+d);
        q = "/" + encodeURIComponent(_kd.referrer);
    }

    if( _kd.cookie.indexOf('__ktv') === -1 ) {
        _kd.cookie = "__ktv=" + __kuuid() + "; path=/; expires=Sun, 18 Jan 2038 00:00:00 GMT;" + (d===null ? "" : " domain="+d);
    }

    if( _kd.cookie.indexOf('__ktt') === -1 ) {
        _kd.cookie = "__ktt=" + __kuuid() + "; path=/;" + (d===null ? "" : " domain="+d);
    }
}

/**
 *  splits the cookie into its constituent pieces
 */
function __kvalueOf(name) {
    var cs = _kd.cookie.split(';');
    for( _ki = 0; _ki < cs.length; _ki++ ) {
        var index = cs[_ki].indexOf(name) ;
        if( index !== -1 ) {
            _kv = cs[_ki].substring(index + 6);
            return _kv.split(',');
        }
    }

    return '';
}

function __koid(form, customForm) {
    var fields = form.elements;
    var fieldIndex;
    var field;
    var name;
    for( fieldIndex = 0; fieldIndex < fields.length; fieldIndex++ ) {
        field = fields[fieldIndex];
        name = field.getAttribute('name');

        if( (!customForm && name === 'oid') || (customForm && name === 'sfga') ) {
            return field.value;
        }
    }

    return '';
}

function __kpackValues(customForm) {
    var query  = '';
    var fields = _kwtlForm.elements;
    var regexp = /[0-9]/;
    var fieldIndex;
    var field;
    var name;
    for( fieldIndex = 0; fieldIndex < fields.length; fieldIndex++ ) {
        field = fields[fieldIndex];
        name = field.getAttribute('name');

        // standard salesforce wtl
        if( name === 'debug' && field.value === '1' ) {
            // this is a debug page, leave it alone
            return true;

//        } else if( name && !customForm && (regexp.exec(name) || "description" === name.toLocaleLowerCase()) ) {
            // ignore custom fields from standard

        } else if( name && ((name !== 'retURL' && name !== 'submit' && name !== 'oid') || customForm) ) {
            if( field.value ) {
                var value = encodeURIComponent(field.value);
                query += encodeURIComponent(name) + '=' + value + '&';
            }
        }
    }
    return query;
}

function _kurl() {
    var url = _kdlh;
    var index = url.indexOf('?');
    if( index > 0 ) {
        url = url.substring(0, index);
    }
    return encodeURIComponent(url);
}

function __kgetAction(form) {
    return typeof(form.action) === 'string' ? form.action : form.getAttribute("action");
}

function __kpackInfo(form, customForm) {
    var values = __kvalueOf('__kti=');
    var _ti = values[0] ? values[0] : '';
    var _li = values[1] ? values[1] : '';
    // landing page
    var _ri = values[2] ? values[2] : '';
    // referrer
    values = __kvalueOf('__kts=');
    var _ts = values[0] ? values[0] : '';
    var _ls = values[1] ? values[1] : '';
    // landing page
    var _rs = values[2] ? values[2] : '';

    var info = 't=' + _ti + '&r=' + _ri + '&l=' + _li + '&oid=' + __koid(form, customForm) + "&ts=" + _ts + "&ls=" + _ls + "&rs=" + _rs;
    info += '&url=' + _kurl();
    if( customForm ) {
        var method = typeof(form.method) === 'string' ? form.method : form.getAttribute('method');
        info += '&customForm=true&method='+ encodeURIComponent(method) + '&retURL=' + encodeURIComponent(__kgetAction(form)) ;
    } else if( _kretURL ) {
        info += '&customForm=false&retURL=' + encodeURIComponent(_kretURL.value);
    }

    return info;
}

function __kgetSfgaField(form) {
    var fields = form.elements;
    var fieldIndex;
    var field;
    var name;
    for( fieldIndex = 0; fieldIndex < fields.length; fieldIndex++ ) {
        field = fields[fieldIndex];
        name = field.getAttribute('name');

        if( name === 'sfga' ) {
            return field;
        }
    }

    return undefined;
}

function __kgetSFAction(form) {
    // referrer
    var url = 'http://lct.salesforce.com';
    if( _kdlh.toLowerCase().indexOf("https://") === 0 ) {
        url = 'https://lct.salesforce.com';
    }
    url += '/sfga';
    return url;
}

/**
 * submit form for processing
 */
function __konSubmit(event) {
    try {
        if( _kwtlOnSubmit && _kwtlOnSubmit(event) === false) { // very important that this is == false rather than !
            return false;
        }
    } catch ( error ) {}

    var url = __kgetSFAction(_kwtlForm);
    var customForm = false; // we know we're a standard wtl, so this is always false
    var values = __kpackValues(customForm);
    url += '?q=' + encodeURIComponent(values) + '&' + __kpackInfo(_kwtlForm, customForm);


    // If the retUrl exceeds the IE URL length limit of 2083, a standard form submission will break because
    // W2L does a GET to the retURL.  So, we "rewrite" this submission as a custom form submission.  
    if(encodeURIComponent(url).length > 2083) {
        // even though customers are not instructed to put the "sfga" field on standard forms,
        // we expect that some may do it anyway 
        var sfga = __kgetSfgaField(_kwtlForm);

        //if the sfga field does not exist, put it in the standard form so we can treat it like a custom form
        if(!sfga) {
           sfga = document.createElement("input");
           sfga.type = "hidden";
           sfga.id = "sfga";
           sfga.name = "sfga";
           sfga.value = _koid.value;
           _kwtlForm.appendChild(sfga);
        }

        sfga.value = __kpackInfo(_kwtlForm, true);

        //_kpackInfo requires the current action, so setting the action should happen in the end.
        _kwtlForm.action = __kgetSFAction(_kwtlForm);
    } else {
        _kretURL.value = url;
    }

    return true;
}

function __kSetupForm(form, customForm) {
    var sfga;
    var expr;
    if( customForm ) {
        sfga = __kgetSfgaField(form);
        sfga.value = __kpackInfo(form, customForm);
        form.setAttribute('action', __kgetSFAction(form));

    } else {
        _kwtlForm = form;
        if( form.onsubmit !== undefined ) {
            expr = "_kwtlOnSubmit = " + form.onsubmit.toString().replace(/this\s*([\)\.])/, '_kwtlForm$1');
            // jslint hates this
            //eval(expr);
        }
        form.onsubmit = __konSubmit;
    }
}

function __kfindWTL() {
    var forms = document.forms;
    var index;
    var form;
    var action;
    var eIndex;
    var customForm;
    var i;
    var j;
    var input;
    for( index = 0; index < forms.length; index++ ) {
        form = forms[index];
        action = form.getAttribute('action');
        if( action && action.indexOf && (action.indexOf('http://www.salesforce.com/servlet/servlet.WebToLead') !== -1 || action.indexOf('https://www.salesforce.com/servlet/servlet.WebToLead') !== -1) ) {
            for( eIndex = 0; eIndex < form.length; eIndex++ ) {
                if( form.elements[eIndex].name === 'retURL' ) {
                    _kretURL = form.elements[eIndex];
                }

                if( form.elements[eIndex].name === 'oid' ) {

                    _koid = form.elements[eIndex];

                }

            }

            customForm = false;
            __kSetupForm(form, customForm);
            break;
        }
    }

    if( ! _kwtlForm ) {
        for( i = 0; i < forms.length; i++ ) {
            form = forms[i];
            for( j = 0; j < form.elements.length; j++ ) {
                input = form.elements[j];
                if( input.name === 'sfga' ) {
                    customForm = true;
                    __kSetupForm(form, customForm);
                    break;
                }
            }
        }
    }
}

function __sfga() {
    __kinit();
    __kfindWTL();
}
