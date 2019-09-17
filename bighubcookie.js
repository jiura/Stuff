/*!
 * JavaScript Cookie v2.2.1
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if (typeof exports === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function decode (s) {
		return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
	}

	function init (converter) {
		function api() {}

		function set (key, value, attributes) {
			if (typeof document === 'undefined') {
				return;
			}

			attributes = extend({
				path: '/'
			}, api.defaults, attributes);

			if (typeof attributes.expires === 'number') {
				attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
			}

			// We're using "expires" because "max-age" is not supported by IE
			attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

			try {
				var result = JSON.stringify(value);
				if (/^[\{\[]/.test(result)) {
					value = result;
				}
			} catch (e) {}

			value = converter.write ?
				converter.write(value, key) :
				encodeURIComponent(String(value))
					.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

			key = encodeURIComponent(String(key))
				.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
				.replace(/[\(\)]/g, escape);

			var stringifiedAttributes = '';
			for (var attributeName in attributes) {
				if (!attributes[attributeName]) {
					continue;
				}
				stringifiedAttributes += '; ' + attributeName;
				if (attributes[attributeName] === true) {
					continue;
				}

				// Considers RFC 6265 section 5.2:
				// ...
				// 3.  If the remaining unparsed-attributes contains a %x3B (";")
				//     character:
				// Consume the characters of the unparsed-attributes up to,
				// not including, the first %x3B (";") character.
				// ...
				stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
			}

			return (document.cookie = key + '=' + value + stringifiedAttributes);
		}

		function get (key, json) {
			if (typeof document === 'undefined') {
				return;
			}

			var jar = {};
			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all.
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (!json && cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = decode(parts[0]);
					cookie = (converter.read || converter)(cookie, name) ||
						decode(cookie);

					if (json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					jar[name] = cookie;

					if (key === name) {
						break;
					}
				} catch (e) {}
			}

			return key ? jar[key] : jar;
		}

		api.set = set;
		api.get = function (key) {
			return get(key, false /* read as raw */);
		};
		api.getJSON = function (key) {
			return get(key, true /* read as json */);
		};
		api.remove = function (key, attributes) {
			set(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.defaults = {};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));

//Defines variables for current date and cookie expiry date
var today = new Date();
var expiry = new Date(today.getTime() + 3600 * 24 * 3600 * 1000);

//Creates unique ID for user
function uniqueID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

//Checks if user has visited the page before
//If not, creates his unique ID
function check_cookie() {
    var user_id = Cookies.get("user_id");
    var user_frequency;
    if(user_id !== undefined) {
        temp_str = Cookies.get("user_frequency");
        user_frequency = parseInt(temp_str, 10);
        user_frequency++;
        temp_str = user_frequency.toString(10);
        Cookies.set("user_frequency", temp_str, 365);
    } else {
        user_id = uniqueID();
        user_frequency = 1;
        Cookies.set("user_frequency", user_frequency.toString(10), 365);
        Cookies.set("user_id", user_id, 365);
    }
}

//Gets specified parameter from the URL
function getParameter(theParameter) {
  var params = window.location.search.substr(1).split('&');
  for (var i = 0; i < params.length; i++) {
    var p = params[i].split('=');
     if (p[0] == theParameter) {
      return decodeURIComponent(p[1]);
    }
  }
  return false;
}

//Sets specified parameter with specified value in cookie
function set_cookie(cookie_name, cookie_value) {
    var cookie_expire = 10;
    var cookie = cookie_name + "=" + encodeURIComponent(cookie_value);
    if(typeof cookie_expire === "number") {
        cookie += ";max-age=" + (cookie_expire*24*60*60*365);
    }

    document.cookie = cookie;
}

//Gets all desired parameters
function get_desired_parameters() {
    url_src = getParameter('utm_source');
    url_mdm = getParameter('utm_medium');
    url_cpn = getParameter('utm_campaign');
    url_trm = getParameter('utm_term');
    set_cookie("utm_source", url_src);
    set_cookie("utm_medium", url_mdm);
    set_cookie("utm_campaign", url_cpn);
    set_cookie("utm_term", url_trm);
}

//Gets cookie by specified name
function get_cookie(cookie_name) {
    var cookieg = document.cookie.split(";");
    for(var i = 0; i < cookieg.length; i++) {
        var cookie_sp = cookieg[i].split("=");
        if(cookie_name === cookie_sp[0]) {
            return decodeURIComponent(cookie_sp[1]);
        }
    }

    return null;
}

//Deletes cookie by specified name
function delete_cookie(name) {
    document.cookie = name + "=DELETE; expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

//Checks user frequency and creates cookie with respective values for the parameters
function create_cookie() {
    check_cookie();
    get_desired_parameters();
}

//Defines the .serializeObject() JQuery function
function define_serializeObject() {
    $.fn.serializeObject = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });

        return o;
    };
}

//Sends cookie data to Azure Data Lake through a POST request to a Logic App service
function send_cookie_data() {
    var jsonText = JSON.stringify($('form').serializeObject());
    var getUrl = window.location;
    var baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];

    $('#result').text(JSON.stringify($('form').serializeObject()));

    var cookieData = {
        utm_source: Cookies.get("utm_source"),
        utm_medium: Cookies.get("utm_medium"),
        utm_campaign: Cookies.get("utm_campaign"),
        utm_term: Cookies.get("utm_term")
    };

    var cliente = {
        cliente: "Grupo Zangari",
        site: baseUrl
    };

    var jsonCookie = JSON.stringify(cookieData);
    var cookieUTM = JSON.parse(jsonCookie);

    var clienteInfo = JSON.stringify(cliente);
    var clienteData = JSON.parse(clienteInfo);

    var formData = JSON.parse(jsonText);

    var dataLake = {
        cliente: clienteData,
        form: formData,
        cookie: cookieUTM,
        userid: Cookies.get("user_id")
    };

    var dataTotal = JSON.stringify(dataLake);

    //Add user id to file name
    $.ajax({
        type: "POST",
        url: "https://prod-23.brazilsouth.logic.azure.com:443/workflows/acea5f35e64b4339bcf8c363b8fe0c47/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=AMovljDdB-UIzF7ZX2UpbVam04zEwHnJykVHP5fgA5g",
        data: dataTotal,
        crossDomain: true,
        dataType: "text/plain",

        //If a response is received from the server
        success: function (response) {
            $("#uploadResponse").append(response);
        },
    });
}