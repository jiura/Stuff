//Defines variables for current date and cookie expiry date
var today = new Date();
var expiry = new Date(today.getTime() +3600 * 24 * 365);

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
    var cookie_expire = 1;
    var cookie = cookie_name + "=" + encodeURIComponent(cookie_value);
    if(typeof cookie_expire === "number") {
        cookie += ";max-age=" + (cookie_expire*3600 * 24 * 365);
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
    //Regex to check type of element
    rsubmittable = /^(?:input|select|textarea|keygen)/i;
    rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i;
    rcheckableType = /^(?:checkbox|radio)$/i;
    rCRLF = /\r?\n/g;

    jQuery.fn.serializeArrayCustom = function () {
        return this.map(function () {
            // Can add propHook for "elements" to filter or add form elements
            var elements = jQuery.prop(this, "elements");
            return elements ? jQuery.makeArray(elements) : this;
        }).filter(function () {
            var type = this.type;
            // Use .is(":disabled") so that fieldset[disabled] works
            return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
        }).map(function (i, elem) {
            var val = jQuery(this).val();
            var placeholderExists = jQuery(elem).prop('placeholder');
            var titleExists = jQuery(elem).prop('title');

            return val == null ? null : jQuery.isArray(val) ? jQuery.map(val, function (val) {
                if (placeholderExists) {
                    return {
                        name: jQuery(elem).attr('placeholder'),
                        value: val.replace(rCRLF, "\r\n")
                    }
                } else if (titleExists) {
                    return {
                        name: jQuery(elem).attr('title'),
                        value: val.replace(rCRLF, "\r\n")
                    }
                } else {
                    return {
                        name: elem.name,
                        value: val.replace(rCRLF, "\r\n")
                    }
                };
            }) : placeholderExists ? {
                name: jQuery(elem).attr('placeholder'),
                value: val.replace(rCRLF, "\r\n")
            } : titleExists ? {
                name: jQuery(elem).attr(),
                value: val.replace(rCRLF, "\r\n")
            } : true ? {
                name: elem.name,
                value: val.replace(rCRLF, "\r\n")
            } : null;
        }).get();
    };

    jQuery.fn.serializeObject = function () {
        var o = {};
        var a = this.serializeArrayCustom();
        jQuery.each(a, function () {
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
async function send_cookie_data(form) {
    var jsonText = JSON.stringify(jQuery(form).serializeObject());
    var getUrl = window.location;
    var baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];

    var cookieData = {
        utm_source: Cookies.get("utm_source"),
        utm_medium: Cookies.get("utm_medium"),
        utm_campaign: Cookies.get("utm_campaign"),
        utm_term: Cookies.get("utm_term")
    };

    if (getUrl.host.split('.')[0] == 'www' || getUrl.host.split('.')[0] == 'm')
        CLIENTE = getUrl.host.split('.')[1];
    else
        CLIENTE = getUrl.host.split('.')[0];

    var cliente = {
        cliente: CLIENTE,
        site: baseUrl
    };

    var jsonCookie = JSON.stringify(cookieData);
    var cookieUTM = JSON.parse(jsonCookie);

    var clienteInfo = JSON.stringify(cliente);
    var clienteData = JSON.parse(clienteInfo);

    var formData = JSON.parse(jsonText);

    var ua = detect.parse(navigator.userAgent);

    var environment = {
        browser: ua.browser.family,
        os: ua.os.family,
        device: ua.device.type
    };

    var environmentInfo = JSON.stringify(environment);
    var environmentData = JSON.parse(environmentInfo);

    var dataLake = {
        cliente: clienteData,
        form: formData,
        cookie: cookieUTM,
        userid: Cookies.get("user_id"),
        foldername: CLIENTE,
        environment: environmentData,
        accessdate: today
    };
    
    //Add user id to file name
    await jQuery.ajax({
        type: "POST",
        url: "https://prod-26.brazilsouth.logic.azure.com:443/workflows/e0aff7699ddd4a759df160f87c53eebb/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FhWDDGhtTvSfS2xY7dQrb1Rnp4k4RuEjnQ5HQIkGY2k",
        contentType: "application/json",
        data: JSON.stringify(dataLake)
    });
}