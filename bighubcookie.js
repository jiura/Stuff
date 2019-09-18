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
function send_cookie_data(e) {
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
        cliente: getUrl.host,
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
    
    //Add user id to file name
    $.ajax({
        type: "POST",
        url: "https://prod-23.brazilsouth.logic.azure.com:443/workflows/acea5f35e64b4339bcf8c363b8fe0c47/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=AMovljDdB-UIzF7ZX2UpbVam04zEwHnJykVHP5fgA5g",
        contentType: "application/json",
        data: JSON.stringify(dataLake)
    })
    .done(function(data) {
        console.log( "success" );
    })
    .fail(function(error) {
        console.log( error );
    })
    .always(function(data) {
        console.log( "complete" );
    });
}
