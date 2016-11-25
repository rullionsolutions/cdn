/*global $, confirm, formatDate */
/*jslint browser: true */
"use strict";

/*
 * Outstanding design questions / improvements:
 * - refactor y.login(), loadSuccess
 * - use of y.simple_url in y.render()
 */

/* Custom Event Inventory
 * deactivate  - prevent user from using any controls, visually indicate that the page is non-operational for the moment
 * activate    - return controls and page to operational state again
 * initialize  - initialize newly-added dynamic page content
 * loadSuccess - main.jsp?mode=post returns successfully
 * loadError   - main.jsp?mode=post returns with a failure
 */

if (!Array.prototype.some) {
    Array.prototype.some = function (fun /*, thisArg*/) {
        "use strict";

        var t;
        var len;
        var thisArg;
        var i;

        if (this == null) {
            throw new TypeError("Array.prototype.some called on null or undefined");
        }

        if (typeof fun !== "function") {
            throw new TypeError();
        }

        t = Object(this);
        len = t.length >>> 0;

        thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (i = 0; i < len; i += 1) {
            if (i in t && fun.call(thisArg, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

var y = {},
    qq,
    Viz,
    Highcharts,
    Aloha;

//y.url_params = {};
y.skin = "index.html";
y.default_page = "home";
y.page_active = true;
y.logged_in = false;
y.last_focused_input = null;
y.ping_interval = 5000;            // in ms
y.ping_timeout  = 5000;            // in ms
y.ping_failures = 0;
y.server_timeout = 60000;        // in ms, 60s
y.debug = false;
y.aloha_activated = false;
y.time_stamps = {};
y.loaded = {};
y.arrow_entity = "&#10148;";
y.guest_logins = 0;
y.expecting_unload = false;             // set true when deliberately navigating away from current page
y.leaving_trans_page = false;           // set true when deliberately navigating away from a transactional page
y.shows_errors_in_modal_alert = false;  //Send all error messages from server to a modal alert

/*-----------------------------------------------Initiation Routine-------------------------------------------------------------*/
$(document).ready(function() {
    var target = $("div#css_body"),
        opts   = { load_mode: "main" };

    y.url_params = y.queryParams();
    y.url_params.page_id = y.url_params.page_id || y.default_page;
    y.message_container = $(".css_messages");

    if (typeof y.url_params.rebuild !== "undefined") {
        // SDF - not sure we actually want to provide this through the front-end...
        $.ajax({ url: "jsp/main.jsp?mode=rebuild", type: "POST", timeout: y.server_timeout, async: false,
            beforeSend: function (xhr) {        // IOS6 fix
                xhr.setRequestHeader('If-Modified-Since', '');
            }
        });
    } else if (typeof y.url_params.reset !== "undefined") {
        $.ajax({ url: "jsp/main.jsp?mode=reset"  , type: "POST", timeout: y.server_timeout, async: false,
            beforeSend: function (xhr) {        // IOS6 fix
                xhr.setRequestHeader('If-Modified-Since', '');
            }
        });
        window.location = "./";
    } else if (y.url_params.mode === "renderPrint") {
        target = $("div#css_page_print");
        target.trigger('activate'  , [target, opts]);
        target.trigger('initialize', [target, opts]);
    } else if (target) {                                        // ignore if there is no target...
        y.loadQueryString(target, location.search, opts);
    }
});

/*----------------------------------------------------------Page Loads----------------------------------------------------------*/
//TODO - Look at how params and form data pull together
/*
 * SDF suggestion, re-cast y.load() as y.load(target, query_string, opts)
 *  where query_string may or may not begin with the '?' (location.search does start with '?') - if it does, it is removed
 *  opts can include:
 *      load_mode - "main" or "modal" at the moment
 *      scroll_top - y-value to re-scroll the page to once rendered
 */

y.loadQueryString = function (target, query_string, opts) {
    var params;
    query_string = query_string.substr(query_string.indexOf("?") + 1);      // remove '?' and anything before it
    params = y.splitParams(query_string);
    params.page_id = params.page_id || y.default_page;
    if (opts.load_mode === "main") {
        if ((params.page_id  !== y.url_params.page_id && typeof y.url_params.page_id === "string") ||
             params.page_key !== y.url_params.page_key) {
//            y.setPromptBeforeNavAway(false);
            y.expecting_unload = true;
            window.location = y.skin + "?" + query_string;
            return;
        }
        y.simple_url = "page_id=" + params.page_id;
        y.main_page_target = target[0];
        if (params.page_key) {
            y.simple_url += "&page_key=" + params.page_key;
        }
    }
    target.addClass("css_load_target");
    target.data("page_id"  , params.page_id);
    target.data("page_key" , params.page_key);
    target.data("load_mode", opts.load_mode);
    y.load(target, params, opts);
};

y.loadLocal = function (elem, params) {
    var target = elem && elem.parents(".css_load_target").first();
    y.leaving_trans_page = true;            // this is the only allowable way to leave a trans page
    if (!target || target.length === 0) {
        target = $(".css_load_target").first();
    }
    if (!params) {
        params = {};
    }
    params.page_id  = target.data("page_id" );
    params.page_key = target.data("page_key");
    if (!params.page_key) {
        delete params.page_key;
    }
    y.load(target, params, { load_mode: target.data("load_mode") });
};


y.load = function (target, params, opts) {
    function addParam(name, value) {
        if (params[name]) {
            value = params[name] + (value ? "|" : "") + value;
        }
        params[name] = value;
    }

    function addParamIncludingBlank(name, value) {
        if (params[name] !== undefined) {
            value = params[name] + "|" + value;
        }
        params[name] = value;
    }

    if (!y.page_active) {
        return;
    }
    y.clearMessages();//clear messages at the beginning of a load
    if (opts.load_mode === "main") {
        y.time_stamps.pre_post = new Date();
        opts.scroll_top = opts.scroll_top || $(window).scrollTop();
    }

//    target.find(":input").trigger("prepost");//Event to convert input value before post request
    target.find(":input").each(function() {
        if (!$(this).attr("name")) {
            return;
        }
        if ($(this).closest(".css_type_ni_number").length !== 0){
            if ($(this).attr("type") === "checkbox" && $(this).prop("checked") === false) {
                $(this).val("off");
            }

            addParamIncludingBlank($(this).attr("name"), $(this).val());
            return;
        }
        if ($(this).attr("type") === "checkbox" && $(this).prop("checked") === false) {
            return;
        }
        if ($(this).attr("type") === "radio"    && $(this).prop("checked") === false) {
            return;
        }
        addParam($(this).attr("name"), $(this).val());
    });

    //The Serialize call above misses password type inputs - correct selector?
//    $('input[type="password"]').each(function() {
//        data_str += "&" + $(this).attr("id") + "=" + encodeURIComponent($(this).val());
//    });
    target.find(".css_richtext.css_edit").each(function () {
        addParam($(this).attr("id"), $(this).children("div").html());
    });
    //If no attributes are ticked - allows reload to function correctly
    target.find(".css_type_attributes.css_edit").each(function () {
        addParam($(this).attr("id"), "");
    });
    target.trigger('deactivate', [target, opts]);

//    var query_string = y.joinParams(url_params);

    $.ajax({ url: y.getAjaxURL("jsp/main.jsp", "mode=post"), type: "POST", data: $.param(params), timeout: (y.page && y.page.browser_timeout) || y.server_timeout,
        //CL-Blanking this request header allows IOS6 Safari and Chrome 24+ to work (May benefit other webkit based browsers)
        //These headers were also blanked when this fix was initially added - Authorization, If-None-Match
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
            $(document).trigger("loadSuccess", [target, params, opts, data_back]);
        },
        error: function (xml_http_request, text_status) {
            y.reportError(xml_http_request.responseText || text_status);
            y.logged_in = true;
            target.empty();
            target.trigger('activate'  , [target, opts]);
            target.trigger('initialize', [target, opts]);
            $(document).trigger("loadError", [target, params, opts]);
        }
    });
};

/*--------------------------------------------------loadSuccess Handler---------------------------------------------------------*/
$(document).on("loadSuccess", function (e, target, params, opts, data_back) {
    y.leaving_trans_page = false;
    y.sessionTimeout.onLoadSuccess(data_back.logged_out, data_back.session);
    if (data_back.logged_out) {
        y.expecting_unload = true;
        if (y.default_guest) {      // If not logged in and skin HTML defines a default guest a/c
            y.guestLogin(y.default_guest, target, params, opts);
        } else {
            y.renderLogin(target, opts);
        }
    } else if (data_back.session.is_guest && data_back.session.user_id !== y.default_guest) {
        y.logout();         // invalidates current session then redirects
    } else if (data_back.page.skin && data_back.page.skin !== y.skin && opts.load_mode !== "modal") {
        window.location = y.getRedirectURL(data_back, y.simple_url);
    } else {
        y.logged_in = true;
        if (data_back.session.is_guest) {
            $(".css_not_logged_in").removeClass("css_not_logged_in");
        } else {
            $(    ".css_logged_in").removeClass(    "css_logged_in");
        }
        y.expecting_unload = false;

        if (opts.load_mode === "main") {
            y.loadSuccessMainPage(target, params, opts, data_back);
        } else if (opts.load_mode === "modal") {
            y.loadSuccessModal   (target, params, opts, data_back);
        } else {
            y.addMessage("Unrecognized load_mode: " + opts.load_mode, 'E');
        }
    }

    if (!y.logged_in || ( data_back && data_back.session && data_back.session.is_guest)) {
        $("#css_login_block_top").removeClass("hide");
    }
});

y.loadSuccessMainPage = function (target, params, opts, data_back) {
    var redir,
        mailto,
        win;
    y.page    = data_back.page;
    y.session = data_back.session;
    y.message_container = $(".css_messages");
    if (data_back.page.redirect_url) {
        redir = y.getRedirectURL(data_back);
        mailto = redir.match(/^mailto:/);
        y.leaving_trans_page = true;
        if (data_back.page.redirect_new_window || mailto) {
            if (data_back.error) {
                y.addMessage(data_back.error);
            }
            win = window.open(redir);
            if (mailto) {
                if (win) {
                    window.close();
                } else {
                    window.location = redir;
                }
            }
        } else {
            y.expecting_unload = true;
            redir = y.getRedirectURL(data_back);
            window.location = redir;
        }
    } else if (data_back.error) {
        target.empty();
        y.addMessage(data_back.error);
        target.trigger('activate'  , [target, opts]);
        target.trigger('initialize', [target, opts]);
    } else {
        y.render(target, params, opts);
    }
};

y.loadSuccessModal = function (target, params, opts, data_back) {
    var i;
    if (data_back.page.redirect_url) {
        $("#css_modal").modal('hide');
     // C7898 - redirect from modal not working
//      y.loadLocal();      // reload main page
       window.location = y.getRedirectURL(data_back);
    } else if (data_back.error) {
        target.empty();
        y.addMessage(data_back.error);
    } else {
        $("#css_modal .modal-header > h3").html(data_back.page.title);
//        $("#css_modal .modal-messages"   ).empty();
//        for (i = 0; i < data_back.session.messages.length; i += 1) {
//            $("#css_modal .modal-messages").append("[" + data_back.session.messages[i].type + "] " + data_back.session.messages[i].text + "<br/>");
//        }
        $("#css_modal .modal-footer"     ).empty();
        for (i = 0; data_back.page.links && i < data_back.page.links.length; i += 1) {
            $("#css_modal .modal-footer").append("<a class='btn' href='" + data_back.page.links[i].url + "'>" +
                data_back.page.links[i].label + "</a>");
        }
        $("#css_modal").modal('show');
        y.message_container = $("#css_modal .modal-messages");
        y.reportMessagesFromServer(data_back.session.messages);
        y.render(target, params, opts);
    }
};

/*-----------------------------------------------------------Render-------------------------------------------------------------*/
y.render = function (target, params, opts) {
    // SDF - y.simple_url should always be defined here - shouldn't be necessary to re-create...
    var url = "";
    if (opts.load_mode === "main") {
        y.time_stamps.pre_render = new Date();
        url = y.simple_url;
    } else if (params.page_id) {
        url += "page_id=" + params.page_id;
        if (params.page_key) {
            url += "&page_key=" + params.page_key;
        }
    } else {
        y.addMessage("Page rendering error", 'E');
    }

    $.ajax( { url: y.getAjaxURL("jsp/main.jsp", "mode=render&" + url), type: "GET", timeout: (y.page && y.page.browser_timeout) || y.server_timeout,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back /*, text_status, xml_http_request*/) {
            target.html(data_back);
            target.trigger('activate'  , [target, opts]);
            target.trigger('initialize', [target, opts]);
        },
        error: function (xml_http_request, text_status) {
            y.reportError(xml_http_request.responseText || text_status);
            target.trigger('activate'  , [target, opts]);
            target.trigger('initialize', [target, opts]);
        }
    });
};

/*------------------------------------------------------Activate Event----------------------------------------------------------*/
$(document).on("activate", function (e, target, opts) {
    if (opts && opts.load_mode === "main") {
        y.page_active = true;
    }
    $("body").removeClass("css_inactive");
    document.body.style.cursor = 'default';

    //Enable Inputs
    if (target) {
        target.find(":input.css_was_enabled").removeAttr("disabled");
    }

    $("a.css_bulk").each(function () {
        var parent = $(this).parent(),
            selected = parent ? parent.find("input[name*=mr_selected]") : false;
        if (selected && !!selected.val() && JSON.parse(selected.val()).length > 0) {
            $(this).removeClass("disabled");
        }
    });
});

/*---------------------------------------------------- Initialize Event---------------------------------------------------------*/
$(document).on("initialize", function (e, target, opts) {
    if (opts.load_mode === "main") {
        //Set Test Styling
        if (y.session && y.session.server_purpose.indexOf("prod") !== 0) {
            $('div#css_content').addClass("css_test");
        }
        //Set Timestamp
        y.time_stamps.post_render = new Date();
        //Set scroll
        $(window).scrollTop(opts.scroll_top);
    }
});

//Set input focus on activation
$(document).on("initialize", function (e, target, opts) {
    var focus_next_input = false,
        input;

    //Focus on next input
    target.find("div.css_edit").each(function() {
        if ($(this).children(":input").length > 0) {
            if (focus_next_input === true) {
                focus_next_input = $(this).children(":input");
            } else if ($(this).children(":input").attr("id") === y.last_focused_input) {
                focus_next_input = true;
            }
        }
    });
    if (y.last_focused_input) {
        if (y.last_key_pressed === 9 && typeof focus_next_input === "object") {        // tab
            input = focus_next_input;
        } else {
            input = target.find(":input#" + y.last_focused_input);
        }
    } else {
        input = target.find(":input:not(.hasDatepicker):visible:enabled:first");
    }

    //Only focus if the input is not a date field
    if (input && (!input.is(".css_type_date input") || y.last_key_pressed === 9)) {
        input.focus();
    }
    y.last_key_pressed = null;
});

//Load page includes assets
$(document).on("initialize", function (e, target, opts) {
    var i;

    for (i = 0; y.page && y.page.includes && i < y.page.includes.length; i += 1) {
        if ( y.page.includes[i].indexOf(".css") > -1) {
            y.checkStyle(y.page.includes[i]);
        } else {
            y.checkScript(y.page.includes[i]);
        }
    }
});

/*-----------------------------------------------Deactivate Event---------------------------------------------------------------*/
$(document).on("deactivate", function (e, target, opts) {
    if (opts && opts.load_mode === "main") {
        y.page_active = false;
    }
    $("body").addClass("css_inactive");
    document.body.style.cursor = 'progress';
    if (target) {
        target.find(":input:enabled").each( function() {
            $(this).addClass("css_was_enabled");
            $(this).attr("disabled", "disabled");
        });
    }
});

/*-----------------------------------------------------------Login--------------------------------------------------------------*/
y.guestLogin = function (guest_id, target, params, opts) {
    if (y.guest_logins > 2) {
        y.handleGuestLoop();
        return;
    }
    $.ajax({ url: y.getAjaxURL("jsp/guest.jsp", "mode=guestLogin&guest_id=" + guest_id), type: "POST", timeout: y.server_timeout, cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
            var page_button
            if (data_back.session && data_back.session.user_id === guest_id) {
                y.guest_logins += 1;
                y.page_active = true;
                // don't loose the page button if it exists
                if(params.page_button){
                    page_button = params.page_button;
                }
                params = y.queryParams();
                params.page_id = params.page_id || y.default_page;
                if (page_button) {
                    params.page_button = page_button;
                }
                y.load(target, params, opts);
            }
        }
    });
};

// CL - Overridden by skin html file
y.handleGuestLoop = function () {
    y.reportError("Sorry, this device is not currently supported");
};

y.renderLogin = function (target, opts) {
//    y.setPromptBeforeNavAway(false);
    y.expecting_unload = true;
    $.ajax({ url: y.getAjaxURL("jsp/login.jsp"), type: "GET", timeout: y.server_timeout, cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
            if (y.logged_in) {        // was logged-in, must have timed out?
                window.location = y.skin;
            } else {
                target.empty();
                target.html(data_back);
                if (opts.load_mode === "main") {
                    target.find("h1.css_page_title").each(function() {
                        var title = $(this).text();
                        $(this).remove();
                        $(document).find("span#css_page_header_title").html(title);
                        document.title = y.unescapeString(title);
                    });
                }
                target.find(".css_not_logged_in").removeClass("css_not_logged_in");
                target.trigger('activate', [target, opts]);
            }
        },
        error: function (xml_http_request, text_status) {
            y.reportError(xml_http_request.responseText);
        }
    });
};

// Function needs re-factoring...
y.login = function (clicked_elem) {
    var div_elem,
        username,
        password,
        mimic_user_id,
        request_page,
        get_str,
        post_str;

    if (!y.page_active) {
        return;
    }
    div_elem = $(clicked_elem).parents("div");
    if (div_elem) {
        username = div_elem.find(":input[name='j_username']");
        password = div_elem.find(":input[name='j_password']");
        mimic_user_id = div_elem.find(":input[name='mimic_user_id']").val();
    }
    if (!username.val() || !password.val()) {
        y.clearMessages();
        y.addMessage("Please enter a user id and password", 'E');
        return;
    }
    request_page = window.location.search;
    post_str = div_elem.find(":input").serialize();

    if (mimic_user_id) {
        get_str = "mimic_user_id=" + mimic_user_id;
    } else if (div_elem.find(":input[name='mimic_user_id']:visible").length > 0) {
        //If this page has a visible mimic_user_id input but no value then throw an error
        y.clearMessages();
        y.addMessage("This is the <strong>Chameleon</strong> Login page - please enter the user id in the 'log in as' field.", 'E');
        return;
    }
    $("div#css_body").trigger('deactivate', [$("div#css_body"), { load_mode: "main" }]);

    function postLogin(data_back) {
        if (typeof data_back === "string") {        // Login failed
            $(".css_not_logged_in").removeClass("css_not_logged_in");
            y.clearMessages();
            y.addMessage("Sorry, the user and password entered are not valid", 'E');
            $("div#css_body").trigger('activate', [$("div#css_body"), { load_mode: "main" }]);
        } else {
            window.location = y.getRedirectURL(data_back, request_page);
        }
    }

    $.ajax({ url: y.getAjaxURL("jsp/login.jsp", get_str), type: "POST", data: post_str, timeout: y.server_timeout, cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function(data_back) {
            $.ajax({ url: y.getAjaxURL("j_security_check"), type: "POST", data: post_str, timeout: y.server_timeout,
                beforeSend: function (xhr) {        // IOS6 fix
                    xhr.setRequestHeader('If-Modified-Since', '');
                },
                success: function (data_back2, text_status, xml_http_request) {
                    if (typeof data_back2 === "object" && data_back2.action === "normal_login") {
                        postLogin(data_back2);
                    } else {            // IE needs this...
                        $.ajax({ url: y.getAjaxURL("jsp/login.jsp", get_str), type: "POST", timeout: y.server_timeout, cache: false,
                            beforeSend: function (xhr) {        // IOS6 fix
                                xhr.setRequestHeader('If-Modified-Since', '');
                            },
                            success: function (data_back3) {            // Final Ajax request required for IE
                                postLogin(data_back3);
                            },
                            error: function(xml_http_request3, text_status3) {
                                y.clearMessages();
                                y.addMessage("Server not responding #1");
                                $("div#css_body").trigger('activate', [ $("div#css_body"), { load_mode: "main" } ]);
                            }
                        });
                    }
                }, error: function (xml_http_request2, text_status2) {
                    y.clearMessages();
                    y.addMessage("Server not responding #2");
                    $("div#css_body").trigger('activate', [ $("div#css_body"), { load_mode: "main" } ]);
                }
            });
        }, error: function (xml_http_request, text_status) {
            y.clearMessages();
            y.addMessage("Server not responding #3 - " + text_status + "<br/>" + xml_http_request.responseText );
            $("div#css_body").trigger('activate', [ $("div#css_body"), { load_mode: "main" } ]);
        }
    });
};

/*----------------------------------------------------------Logout--------------------------------------------------------------*/
y.logout = function () {
    y.expecting_unload = true;
    $("div#css_body").trigger('deactivate', [$("div#css_body"), { load_mode: "main" }]);
    //CL - GET doesn't work in IE
    $.ajax({ url: y.getAjaxURL("jsp/guest.jsp", "mode=logout"), type: "POST", timeout: y.server_timeout,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back, text_status, xml_http_request) {
            window.location = y.skin;
        }
    });
};

/*------------------------------------------------------------Ping--------------------------------------------------------------*/
y.ping = function () {
    var url_params;
    setTimeout(y.ping, y.ping_interval);
    if (!y.logged_in || !y.session || !y.session.ping_mechanism) {
        return;
    }
    url_params = "&visit_id=" + y.session.id + "." + y.session.visits;
    if (y.page_active && y.time_stamps. pre_render && y.time_stamps.pre_post) {
        url_params +=   "&post_interval=" + (y.time_stamps. pre_render.getTime() - y.time_stamps.pre_post  .getTime());
    }
    if (y.page_active && y.time_stamps. pre_render && y.time_stamps.post_render) {
        url_params += "&render_interval=" + (y.time_stamps.post_render.getTime() - y.time_stamps.pre_render.getTime());
        y.time_stamps = {};
    }
    $.ajax({ url: y.getAjaxURL("jsp/main.jsp", "mode=ping" + url_params), type: "GET", timeout: y.ping_timeout, dataType: "json", cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
            if (y.ping_failures > 0) {
                y.clearMessages();
                y.addMessage("And we're back!", 'I');
            }
            y.ping_failures = 0;
            if (typeof data_back === "string" || data_back.logged_out) {
                window.location = y.skin;
            }
        },
        error: function (xml_http_request, text_status) {
            if (!y.logged_in) {
                return;
            }
            y.clearMessages();
            y.ping_failures += 1;
            if (text_status === "parsererror") {            // logged out, so response is log-in page
                window.location = y.skin;
            } else if (y.ping_failures < 20) {
                y.addMessage("Server gone away, retrying...", 'W');
            } else {
                y.addMessage("Server gone for good. Giving up. Please try later", 'E');
            }
        }
    });
};

y.ping();           // run ping always

/*--------------------------------------------------------Parameters------------------------------------------------------------*/
y.splitParams = function (str) {
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = str,
        out = {};
    e = r.exec(q);
    while (e) {
        out[d(e[1])] = d(e[2]);
        e = r.exec(q);
    }
    return out;
};

y.joinParams = function (obj) {
    var str = "",
        param,
        delim = "";
    for (param in obj) {
        if (obj.hasOwnProperty(param)) {
            str += delim + param + "=" + encodeURIComponent(obj[param]);
            delim = "&";
        }
    }
    return str;
};

y.queryParams = function () {
    return y.splitParams(window.location.search.substring(1));
};

/*------------------------------------------------------------URL---------------------------------------------------------------*/
y.simpleURL = function () {
    return "page_id=" + y.url_params.page_id + (y.url_params.page_key ? "&page_key=" + y.url_params.page_key : "");
};

y.getAjaxURL = function (path, query_string) {
    var out = path;
    if (y.jsessionid) {
        out += ";jsessionid=" + y.jsessionid;
    }
    if (query_string) {
        out += "?" + query_string;
    }
    return out;
};

y.getRedirectURL = function (data_back, query_string) {
    var skin = (data_back && data_back.page && data_back.page.skin) || y.skin;
    if (data_back && data_back.page && data_back.page.redirect_url) {
        query_string = data_back.page.redirect_url;
    }
    // Return absolute URLs
    if (query_string.match(/^http[s]?:\/\//)) {
        return query_string;
    }
    if (typeof query_string !== "string") {
        query_string = "";
    }
    if (query_string.indexOf(".html") > -1) {
        return query_string;
    }
    if (query_string.indexOf("mailto") === 0) {
        return query_string;
    }
    if (query_string && query_string.indexOf("?") !== 0) {
        query_string = "?" + query_string;
    }
    return skin + query_string;
};

// needed? why not just window.location = url?
y.handleURL = function (url) {
    var i,
        skin,
        query_str;
    i = url.indexOf("?");
    if (i > -1) {
        skin = url.substr(0, i);
        query_str = url.substr(i + 1);
    } else {
        skin = url;
    }
    if (skin === y.skin) {
        y.loadQueryString($("div#css_body"), query_str, { load_mode: "main" });
    } else {
        window.location = url;
    }
};

/*---------------------------------------------------------Unload---------------------------------------------------------------*/
//y.setPromptBeforeNavAway = function (on) {
//    window.onbeforeunload = (on) ? function(e) { return "Do you really want to navigate away from this page?"; } : null;
//};
// TODO - next and previous browser buttons...
//CL - No way to detect clicks on the forward or back buttons or the URL the user will be taken to upon clicking them
$(window).bind("beforeunload", function () {
//    if (!y.expecting_unload) {          // should only be due to closing the browser window
//        return "Closing the browser window will log you out of the application";
    if (!y.expecting_unload && y.page && y.page.prompt_nav_away) { //This message covers refresh closing window/tab, back/forward & refresh
        return y.page.prompt_message || "Do you really want to navigate away from this page?";
    } else if (y.page && y.page.prompt_nav_away && !y.leaving_trans_page) {
        return y.page.prompt_message || "Navigating away from this page will mean losing any data changes you've entered";
    }
});

/*------------------------------------------------------------Menu--------------------------------------------------------------*/
$(document).on("loadError loadSuccess", function (e, target, params, opts) {
    var elmt_menu = $("#css_menu_replace");
    if (!y.session || !y.logged_in || elmt_menu.length === 0 || opts.load_mode !== "main") {
        return;
    }
    $.ajax({
        type: "GET", dataType: "html", timeout: y.server_timeout,    // User id added to URL to solve cache issue
        url: y.getAjaxURL("jsp/main.jsp", "mode=menu&session=" + y.session.id), cache: true,    // cache to the session
        // No IOS6 fix
        success: function (data) {
            elmt_menu.parent().append(data);
            elmt_menu.remove();
            if (y.page.area) {
                $("li.css_menu_area_" + y.page.area).addClass("active");
            }
            if (y.page.id) {
                $("li.css_menu_page_" + y.page.id  ).addClass("active");
            }

            y.checkScript("/cdn/jquery.shortcuts/jquery.shortcuts.min.js");    //http://www.stepanreznikov.com/js-shortcuts/
            // Ctrl+M highlights the first menu item - Better shortcut?
            $.Shortcuts.add({
                type: 'down', mask: 'Ctrl+M',
                handler: function () {
                    $("div#css_menu_replace > ul.nav > li:first > a").focus();
                }
            });
            $.Shortcuts.start();
            y.addTasksToMenu();
        },
        error: function (xml_http_request, text_status) {
            y.reportError(xml_http_request.responseText);
        }
    });
});

y.addTasksToMenu = function () {
    $.ajax({
        type: "GET", dataType: "html", timeout: y.server_timeout, url: y.getAjaxURL("jsp/main.jsp", "mode=tasks"), cache: false,
        success: function (data) {
            $("div#css_task_replace").empty();
            $("div#css_task_replace").append(data);
            $("div#css_task_replace li.css_task_overdue > a").prepend("<span class='label label-important'>Overdue</span> ");
            $("div#css_menu_replace div.css_menu_tasks").remove();

            $("div#css_task_replace > div > div").each(function () {
                var module_id = $(this).attr("id"),
                    target_node = $("div#css_menu_replace li.css_menu_area_" + module_id + " > ul.dropdown-menu");

                if (target_node.length > 0) {
                    $(this).children("li").detach().appendTo(target_node);
//                    target_node.parent().addClass("css_cntr_tasks");
                }
            });

            $("div#css_menu_replace > ul > li > ul").each(function () {
                var tasks_underdue = 0,
                    tasks_overdue = 0;

                $(this).children(".css_tasks_badges").each(function () {
                    tasks_overdue  += $(this).attr("tasks_overdue" ) ? parseInt($(this).attr("tasks_overdue"),10) : 0;
                    tasks_underdue += $(this).attr("tasks_underdue") ? parseInt($(this).attr("tasks_underdue"),10) : 0;
                });

                if (tasks_overdue > 0) {
                    $(this).siblings("a").append(" <span class='badge badge-important' title='Overdue workflow tasks assigned to you'>" + tasks_overdue  + "</span>");
                }
                if (tasks_underdue > 0) {
                    $(this).siblings("a").append(" <span class='badge badge-info' title='Workflow tasks assigned to you that are not yet overdue'>" + tasks_underdue + "</span>");
                }
            });
        },
        error: function (xml_http_request, text_status) {
            y.reportError(xml_http_request.responseText);
        }
    });
};




//Solution based upon http://stackoverflow.com/questions/17713520/enabling-keyboard-navigation-in-the-bootstrap-dropdown-menu
$("div.navbar-inner").on("keydown", "div#css_menu_replace a", function (e) {
    var dir,
        a;

    if (e.which === 27) { //escape
        if($(this).closest(".dropdown-menu").parents().hasClass("dropdown-submenu")) {
            $(this).closest(".dropdown-menu").hide();
            $(this).closest(".dropdown-submenu").find("a").first().focus();
        } else {
            $(this).blur();
            if ($(this).parent().parent().hasClass("dropdown-menu")) {
                $(this).parent().parent().prev().parent().click();
            }
            return false;
        }
    }
    if (e.which === 13) { // enter
        if ($(this).parent().hasClass("dropdown")) {
            $(this).parent().find("ul.dropdown-menu > li > a:first").focus();
        }
    }
    if (e.which === 37 || e.which === 39) {    //left or right
        dir = (e.which === 37 ? "prev" : "next" );
        if($(this).closest(".dropdown-menu").parents().hasClass("dropdown-submenu")) {
            //This will only trigger if you are within a submenu (i.e. within a dropdown menu that is descended from a submenu)
            if (dir === "prev") {
                $(this).closest(".dropdown-menu").hide();
                $(this).closest(".dropdown-submenu").find("a").first().focus();
            }
        } else if ($(this).parent().hasClass("dropdown-submenu") && dir === "next") {
            $(this).parent().find("ul.dropdown-menu").show();
            $(this).parent().find("ul.dropdown-menu > li > a:first").focus();
        } else if ($(this).parent().parent().hasClass("dropdown-menu")) {
            a = $(this).parent().parent().prev().parent()[dir]().find("a:first");
            a.click();
            if (a.parent().hasClass("dropdown")) {
                a.parent().find("ul.dropdown-menu > li > a:first").focus();
            } else {
                a.focus();
            }
        } else {
            a = $(this).parent()[dir]().find("a").first();
            a.focus();
            a.click();
        }
        return false; // stops the page from scrolling
    }
    if (e.which === 38) {    // up
        if ($(this).parents().hasClass("dropdown-menu") && $(this).parent().is($(this).parent().parent().children(":not(.css_menu_icon):first"))) {
            if($(this).closest(".dropdown-menu").parents().hasClass("dropdown-submenu")) {
                $(this).closest(".dropdown-menu").hide();
                $(this).closest(".dropdown-submenu").find("a").focus();
            } else {
                a = $(this).parent().parent().prev();
                a.click();
                a.focus();
            }
        } else {
            $(this).parent().prev().find("a").first().focus();
        }
        return false; // stops the page from scrolling
    }
    if (e.which === 40) {    // down
        if ($(this).parent().hasClass("dropdown")) {
            if (!$(this).parent().hasClass("open")) {
                $(this).click();
            }
            $(this).parent().find("ul.dropdown-menu > li > a:first").focus();
        } else {
            $(this).parent().next().find("a").first().focus();
        }
        return false; // stops the page from scrolling
    }
});

$("div.navbar-inner").on("click", "a.dropdown-toggle", function (e) {
    var openSubmenus = $(".dropdown-submenu").find(".dropdown-menu:visible");
    openSubmenus.parent().removeClass("active");
    openSubmenus.hide();
});

$("div.navbar-inner").on("click", "li.dropdown-submenu", function (e) {
    e.stopPropagation();
    var openSubmenus = $(".dropdown-submenu").find(".dropdown-menu:visible");
    openSubmenus.hide();
    $(this).find("ul.dropdown-menu").show();
});
//----mouseenter rather than mouseover seems to prevent the doubletap behaviour, rendering the touchend fix unnecessary--
$("div.navbar-inner").on("mouseenter", "li.dropdown-submenu", function (e) {
    var openSubmenus = $(".dropdown-submenu").find(".dropdown-menu:visible"),
        focusedSubmenus = $(".dropdown-submenu").find("a:focus");
    openSubmenus.hide();
    focusedSubmenus.blur();
    $(this).find("ul.dropdown-menu").show();
});

$("div.navbar-inner").on("mouseleave", "li.dropdown-submenu", function (e) {
    var openSubmenus = $(".dropdown-submenu").find(".dropdown-menu:visible");
    openSubmenus.hide();
});

/*//----------------iOS hover double tap fix attempt #782---------------
//See above note for why this was removed. I've kept it here as a comment in case apple change things
//i.e. if they start treating mouseenter the same as mouseover
$("div.navbar-inner").on('touchend', "a", function(e) {
    var el = $(this),
        link = el.attr('href');
    if(link !== undefined && link !== "#"){
        window.location = link;
    }
});*/

y.updateMenu = function () {
    $("div#css_menu_replace ul.dropdown-menu").data("menu_update", false);
    $("div#css_menu_replace ul > li > ul.dropdown-menu:visible").each(function(){
        if ($(this).is(":visible")) {
            y.updateMenuUL($(this));
        }
    });
};
y.updateMenuUL = function (ul) {
    y.updateMenuHorizUL(ul);
    y.updateMenuVertUL(ul);
    ul.data("menu_update", true);

    ul.children("li.dropdown-submenu").each(function(){
        $(this).children("ul.dropdown-menu").each(function(){
            y.updateMenuUL($(this));
        });
    });
};
y.updateMenuHorizUL = function (ul) {
    var win_width = $(window).width() - 40;

    //Reset styling
    ul.removeClass("pull-left" );
    ul.removeClass("pull-right");

    //Position UL Left or Right to avoid horizontal overflow
    if (ul.parent(".dropdown-submenu").length > 0) {
        y.updateSubmenuHoriz(ul);
    } else {
        if ((ul.offset().left + ul.width()) > win_width) {
            //Place Main Dropdown Left
            ul.addClass("pull-right");
        }else{
            //Place Main Dropdown Right
            ul.removeClass("pull-right");
        }
    }
};
y.updateSubmenuHoriz = function (ul) {
    var left = 0,
        right = 0,
        win_width = $(window).width() - 10,
        parent_ul;

    //Reset styling
    ul.css("width","");
    ul.find("li>a").css("white-space","");

    parent_ul = $(ul.parents("ul.dropdown-menu")[0]);
    left  = parent_ul.offset().left;
    right = (win_width - (left + parent_ul.width()));
//    console.log("l: "+left+"; r: "+right+"; pw: "+parent_ul.width()+"; w: "+(ul.width())+";");
    if (left > right && right < ul.width()) {
        //Place Sub Menu Left
        ul.removeClass("pull-left" );
        ul   .addClass("pull-right");
        if (ul.width() > (left-10)) {
            ul.css("width",(left-10) + "px");
            ul.find("li>a").css("white-space","normal");
        }
    }else{
        //Place Sub Menu Right
        ul   .addClass("pull-left" );
        ul.removeClass("pull-right");
        if (ul.width() > (right-10)) {
            ul.css("width",(right-10) + "px");
            ul.find("li>a").css("white-space","normal");
        }
    }
};
y.updateMenuVertUL = function (ul) {
    var bottom_win = $(window).height()-90,
        view_all,
        lis,
        li,
        i;

    //Position View All link
    if (ul.data("menu_update") !== true && ul.children(".css_task_all").length !== 0) {
        view_all = $(ul.children(".css_task_all")[0]);
        view_all.appendTo(ul);//Move to the end of ul
        view_all.addClass("hide");
        ul.parent().addClass("open");//Menu has to be opened temporarily otherwise height and offset return 0
        ul.children("li:not(.css_task_all)").removeClass("show");
        ul.children("li:not(.css_task_all)").removeClass("hide");
        if (ul.offset().top + ul.height() > bottom_win) {
            lis = ul.children("li:not(.css_task_all)");
            for (i = 0; i < lis.length; i += 1) {
                li = $(lis[i]);
                li.addClass("show");
                if ((li.offset().top + li.height()) > bottom_win) {
                    break;
                }
            }
            ul.children("li:not(.css_task_all.show)").addClass("hide");
            view_all.removeClass("hide");
        }
        ul.parent().removeClass("open");
    }
};
$(document).on("click","div#css_menu_replace a.dropdown-toggle",function(){
    var ul = $($(this).siblings("ul.dropdown-menu")[0]);
    if (ul.is(":visible")) {
        y.updateMenuUL(ul);
    }
});

/*----------------------------------------------------Setup Page Header---------------------------------------------------------*/
// SDF - function needs re-factoring...
$(document).on("loadSuccess", function (e, target, params, opts, data_back) {
    var i,
        tab,
        link,
        addl,
        classes;

    if (opts.load_mode !== "main" || !y.page) {
        return;
    }

    $("#favicon").remove();
    if (y.page.icon) {
        $("span#css_page_header_icon > img")
            .attr("src", "/rsl_shared/" + y.page.icon)
            .attr("alt", y.page.title);
        $("head").append('<link href="/rsl_shared/' + y.page.icon + '" id="favicon" rel="shortcut icon" />');
    }
    $("span#css_page_header_title").html(y.page.title);
    if (y.page.glyphicon) {
        $("span#css_page_header_title").prepend("<b class='icon-large " + y.page.glyphicon + "' /> ");
    }
    document.title = y.unescapeString(y.page.title);
    if (y.page.description) {
        $("p#css_page_header_descr").text(y.page.description);
        $("p#css_page_header_descr").removeClass("css_hide");
    } else {
        $("p#css_page_header_descr").addClass("css_hide");
    }

    $("a#css_page_print").attr("href", "jsp/main.jsp?mode=renderPrint&" + y.simpleURL());
    $("a#css_page_excel").attr("href", "jsp/main.jsp?mode=renderExcel&" + y.simpleURL());
    $("a#css_page_pdf"  ).attr("href", "jsp/main.jsp?mode=renderPDF&"   + y.simpleURL());
    $(".css_accnt").text((y.session.chameleon ? "[" + y.session.chameleon + "] " : "" ) + y.session.user_name);
    if (y.session.help_article) {
        link = $("a#css_page_helpw").attr("href");
        if (link) {
            link = link.match(/(.*)page_key=/);
            if (link && link.length > 1) {
                $("a#css_page_helpw").attr("href", link[1] + "page_key=" + y.session.help_article);
            }
        }
    }
//    $("li#accnt > a").attr("href", y.session.home_page_url);

    $("ul#css_page_tabs").empty();
//    $("ul#css_page_tabs").addClass("css_hide");
    for (i = 0; y.page.tabs && i < y.page.tabs.length; i += 1) {
        tab = y.page.tabs[i];
        $("ul#css_page_tabs").append("<li id='" + tab.id + "'" + ( y.page.page_tab === tab.id ? " class='active'" : "" ) + "><a>" + tab.label + "</a></li>");
    }
    if (tab) {        // at least one tab shown...
        $("ul#css_page_tabs").removeClass("css_hide");
        $("div#css_body").addClass("css_body_tabs_above");
    }
    $("ul#css_page_tabs > li").click(function (event) {
        y.loadLocal($(this), { page_tab: $(event.currentTarget).attr("id") });
    });

    $(".css_page_links").empty();
    for (i = 0; y.page.links && i < y.page.links.length; i += 1) {
        link = y.page.links[i];
        addl = "href='" + link.url + "'" + (link.target ? " target='" + link.target + "'" : "");
        if (link.task_info) {
            addl += " title='Task for " + link.task_info.assigned_user_name + (link.task_info.due_date ? " due on " + link.task_info.due_date : "") + "'";
        }
        addl += ">" + link.label + " " + y.arrow_entity + "</a>";
        classes = "btn-primary btn";
        if (link.open_in_modal === true) {
            classes += " css_open_in_modal";
        }
        $("div#css_left_bar .css_page_links").append("<a class='" + classes + " btn-block' " + addl);
        $("div#css_top_bar  .css_page_links").append("<a class='" + classes + "'           " + addl);
    }

    if (y.page.entity_search_page) {
        $("#css_nav_search").css("visibility", "visible").attr("href", "?page_id=" + y.page.entity_search_page);
    } else {
        $("#css_nav_search").css("visibility", "hidden");
    }
    if (y.page.nav_prev_key) {
        $("#css_nav_prev").css("visibility", "visible").attr("href", "?page_id=" + y.page.id + "&page_key=" + y.page.nav_prev_key);
    } else {
        $("#css_nav_prev").css("visibility", "hidden");
    }
    if (y.page.nav_next_key) {
        $("#css_nav_next").css("visibility", "visible").attr("href", "?page_id=" + y.page.id + "&page_key=" + y.page.nav_next_key);
    } else {
        $("#css_nav_next").css("visibility", "hidden");
    }
    y.reportMessagesFromServer(y.session.messages);
    $("a.css_undo_link").click(function() {
        if (!confirm("Are you sure you want to undo your last action?\nIf you click 'OK' any updates made will be removed and you will have to complete that action again.")) {
            return false;
        }
    });
});

y.positionLeftBar = function(){
    if ($("div#css_opt_navbar").length && $("div#css_left_bar").length) {
        $("div#css_left_bar").css("margin-top",($("div#css_opt_navbar").height()-50) + "px");
    }
};

/*--------------------------------------------------------------Messages--------------------------------------------------------*/
y.addMessage = function (msg_text, msg_type) {
    var css_class = "alert",
        new_elem;
    if (typeof msg_type !== "string") {
        msg_type = "E";
    }
    if (msg_type === 'E') {
        css_class += " alert-error";
    } else if (msg_type === 'W') {
        css_class += " alert-warning";
    } else if (msg_type === 'I') {
        css_class += " alert-info";
    }
    msg_text = "<div class='" + css_class + "'>" + msg_text + "</div>";
    new_elem = $(msg_text).appendTo(y.message_container);
    y.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
    y.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
    new_elem.effect("pulsate", { times: 2 }, 500);
};

y.clearMessages = function () {
    y.message_container.empty();
};

y.reportError = function (error) {
    y.clearMessages();
    y.addMessage("Ouch, server error, I'm afraid", 'E');
};

/*------------------------------------Messages with Modal Alert Support *Experimental*------------------------------------------*/
y.reportMessagesFromServer = function (messages) {
    var i,
        msg_text = {},
        modal_text = {},
        modal_allowed,
        modal_confirm_btn = false,
        modal_dialog = false,
        modal_options;

    if (!messages || messages.length === 0) {
        return;
    }

    modal_allowed = $("#css_modal > .modal-messages").length && !$("#css_modal .modal-body").hasClass("css_load_target");

//    y.clearMessages();
// SDF: messages raised directly from master.js code are not in 'messages' argument, so are being blitzed here!
    if (modal_allowed) {
        y.clearModalMessages();
    }
    for (i = 0; i < messages.length; i += 1) {
        if (modal_allowed && (messages[i].modal || (messages[i].type === "E" && y.shows_errors_in_modal_alert))){
            if (!modal_text[messages[i].type]) {
                modal_text[messages[i].type] = "";
            }
            modal_text[messages[i].type] += messages[i].text + "<br/>";
            if (messages[i].modal_confirm_btn) {
                modal_confirm_btn = messages[i].modal_confirm_btn;
            }else{
                modal_dialog = true;
            }
        }else{
            if (!msg_text[messages[i].type]) {
                msg_text[messages[i].type] = "";
            }
            msg_text[messages[i].type] += messages[i].text + "<br/>";
        }
    }
    for (i in msg_text) {
        if (msg_text.hasOwnProperty(i)) {
            y.addMessage(msg_text[i], i);
        }
    }
    for (i in modal_text) {
        if (modal_text.hasOwnProperty(i)) {
            y.addModalMessage(modal_text[i], i);
        }
    }
    if (modal_dialog) {
        modal_confirm_btn = null;
    }
    modal_options = {
        modal_allowed: modal_allowed,
        modal_confirm_btn: modal_confirm_btn,
    };
    y.showModalAlert(modal_options);
};

y.addModalMessage = function (msg_text, msg_type) {
    var css_class = "alert";
    if (typeof msg_type !== "string") {
        msg_type = "E";
    }
    if (msg_type === 'E') {
        css_class += " alert-error";
    } else if (msg_type === 'W') {
        css_class += " alert-warning";
    } else if (msg_type === 'I') {
        css_class += " alert-info";
    }
    msg_text = "<div class='" + css_class + "'>" + msg_text + "</div>";
//    $(".css_messages").append(msg_text);
//    $(".css_messages").effect( "pulsate", {}, 500 );
    y.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
    y.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
    $(msg_text).appendTo($("#css_modal > .modal-messages")).effect( "pulsate", { times: 2 }, 500 );
};

y.clearModalMessages = function () {
    $("#css_modal > .modal-messages").empty();
};

y.showModalAlert = function (params) {
  //If modal messages are present then show the modal window
    var modal_options = {
        backdrop: "static",
        keyboard: "false",
    };
    var modal_confirm_text = params.modal_confirm_text || "Yes";
    var default_close_text = ((params.modal_confirm || params.modal_confirm_btn) ? "No" : "OK");
    var modal_close_text = params.modal_close_text || default_close_text;
    var modal_confirm_attr;
    var modal_close_attr;

    if ($("#css_modal > .modal-messages").children().length > 0 && params.modal_allowed) {
        $("#css_modal .modal-header > .close").addClass("hide");
        $("#css_modal .modal-body").empty();
        $("#css_modal .modal-body").addClass("hide");
        $("#css_modal #css_modal_label").text("");
        $("#css_modal .modal-footer").empty();

        if (params.modal_confirm || params.modal_confirm_btn) {
            modal_confirm_attr = (params.modal_confirm_btn ? "modal_confirm_btn='" + params.modal_confirm_btn + "'" : "");
            $("#css_modal .modal-footer").append("<a class='btn btn-large modal-message-confirm' " + modal_confirm_attr + ">" + modal_confirm_text + "</a>");
        }
        if (params.modal_close || params.modal_close_btn
            || !(params.modal_confirm || params.modal_confirm_btn)) {
            modal_close_attr = (params.modal_close_btn ? "modal_close_btn='" + params.modal_close_btn + "'" : "");
            $("#css_modal .modal-footer").append("<a class='btn btn-large modal-message-close' " + modal_close_attr + ">" + modal_close_text + "</a>");
        }

        $("#css_modal .modal-footer").css("text-align", "center");
        $("#css_modal").modal(modal_options);
    }
};

y.closeModalAlert = function () {
    $("#css_modal .modal-header > .close").removeClass("hide");
    y.clearModalMessages();
    $("#css_modal .modal-body").removeClass("hide");
    $("#css_modal .modal-footer").css("text-align","");
    $("#css_modal .modal-footer"     ).empty();
    $("#css_modal").modal('hide');
};
$(document).on("click",".modal-message-confirm",function(){
    if ($(this).attr("modal_confirm_btn")) {
        y.closeModalAlert();
        y.loadLocal($(this), { page_button: $(this).attr("modal_confirm_btn") });
    } else {
        y.closeModalAlert();
    }
});
$(document).on("click",".modal-message-close",function(){
    y.closeModalAlert();
});
/*---------------------------------------------------------Popover--------------------------------------------------------------*/

//Popover click handler for Description display
$(document).on("click", ".css_popover", function (event) {
    //If popover is not present
    if (!$(this).data("popover")) {
        $(this).popover();
        $(this).trigger("click");
    }
    event.preventDefault();
});

y.newBox = function (container, data, event) {
    $(container).popover({
        content: data, html: true, placement: "bottom"
    }).popover("show");
};



/*----------------------------------------------------URL Click Handler---------------------------------------------------------*/
//Click handlers for elements with url attribute
$(document).on("click", "[url]", function (event) {
    // Avoid redirecting if clicked an anchor or button...
    if ($(event.target).is("a")    || $(event.target).parents("a")   .length > 0) {
        return;
    }
    if ($(event.target).is(".btn") || $(event.target).parents(".btn").length > 0) {
        return;
    }

    y.expecting_unload = true;
//    window.location = $(this).attr("url");
    // avoid unload message if page is the same - could perhaps just be a call to loadQueryString?
    y.handleURL($(this).attr("url"));
});

$(document).on("click", "a[href]", function () {
    y.expecting_unload = true;
});

/*-------------------------------------------------Main Button Click Handler----------------------------------------------------*/
$(document).on("click", ".css_cmd", function (event) {
    var confirm_text = $(this).data("confirm-text"),
        is_confirmed,
        params;

    function addParam(name, value) {
        if (params[name]) {
            value = params[name] + (value ? "|" : "") + value;
        }
        params[name] = value;
    }

    if (confirm_text) {
        is_confirmed = confirm(confirm_text);
        if (!is_confirmed) {
            return;
        }
    }
//    var target = y.getTarget($(this));
    if (/*target &&*/ (!this.onclick || ( $(this).is("a") && this.href ))) {         // imgs don't have hrefs
        params = { page_button: $(this).attr("id") };

        if ($(this).data("data_source") && $("#" + $(this).data("data_source"))) {
            // this functinality could be under one function as it's used else where
            $("#" + $(this).data("data_source")).find(":input").each(function () {
                if (!$(this).attr("name")) {
                    return;
                }
                if ($(this).attr("type") === "checkbox" && $(this).prop("checked") === false) {
                    return;
                }
                if ($(this).attr("type") === "radio"    && $(this).prop("checked") === false) {
                    return;
                }
                addParam($(this).attr("name"), $(this).val());
            });
        }
//        console.log(JSON.stringify(params));
        y.loadLocal($(this), params);
//        y.load(y.simpleURL() + "&page_button=" + $(this).attr("id"));
    }
});

/*---------------------submit on enter key if .css_button_main specified - deactivated for the moment---------------------------*/
$(document).on("keyup", function (event) {
    var node = event.target || event.srcElement,
        button;
    y.last_key_pressed = event.keyCode;
    if ((event.keyCode === 13) && node && ($(node).attr("type") === "text" || $(node).attr("type") === "password"))  {
        button = $(node).closest(".css_section").find(".css_button_main");
        if (button.length === 0) {
            button = $(".css_button_main");
        }
        if (button.length > 0) {
            button.click();
        }
    }
    return false;
});

/*------------------------------------------------Universal Search Box----------------------------------------------------------*/
y.unisrch = function (selector) {
    var query_string;
    $(selector).typeahead({
        minLength: 2,        // min chars typed to trigger typeahead
        source: function (query, process) {
            $.get(y.getAjaxURL("jsp/main.jsp", "mode=unisrch&q=" + query), function (data) {
                var inp = data.split("\n"),
                    out = [],
                    res,
                    str,
                    i;
                query_string = {};
                for (i = 0; i < inp.length; i += 1) {
                    if (inp[i]) {
                        res = inp[i].split("|");
                        if (res.length > 3) {
                            str = res[3] + " [" + res[0] + "] " + res[1];
                            query_string[str] = "?page_id=" + res[2] + "&page_key=" + res[0];
                            out.push(str);
                        }
                    }
                }
                process(out);
            });
        },
        updater: function (item) {
            if (query_string[item]) {
                y.loadQueryString($("div#css_body"), query_string[item], { load_mode: "main" });
            }
        }
    });
};

/*------------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------Fields---------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------*/

/*--------------------------------------------------------Field Event Handler---------------------------------------------------*/
//Target Input Focus
$(document).on("focus", ":input", function (event) {
    y.fieldFocus(this, event);
});

//Target Input Blur
$(document).on("blur", ":input", function (event) {
    y.fieldBlur(this, event);
});

//Target Input Keydown to blur on escape key press
$(document).on("keydown", ":input", function (event) {
    if (event.which === 27) {
        $(this).blur();
    }
});

//Prevent enter to submit behaviour in IE
$(document).on("keydown", "div.css_edit > input", function (e) {
    if (e.which === 13) {
        e.preventDefault();
    }
});

//Activate handler for all fields (div.css_edit inputs)
$(document).on("initialize", function (e, target, opts) {
    target.find("div.css_edit").each(function() {
        if ($(this).parents(".css_list").length > 0) {
            $(this).children("span.css_field_errors").addClass("css_hide");
        }

        var json_obj = y.getRenderData($(this));
        if ($(this).hasClass("css_type_number")) {
            if (typeof json_obj.max === "number") {
                $(this).find(":input").attr("max" , json_obj.max);
            }
            if (typeof json_obj.min === "number") {
                $(this).find(":input").attr("min" , json_obj.min);
            }
            if (typeof json_obj.decimal_digits === "number") {
                $(this).find(":input").attr("step", String(1 / Math.pow(10, parseInt(json_obj.decimal_digits, 10))));
            }
        }
        if (json_obj.input_mask && !$(this).hasClass("css_type_date")) {
            y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
            $(this).find(":input").mask(json_obj.input_mask);
        }
    });
});

/*---------------------------------------------Reloadable Field Handlers--------------------------------------------------------*/
$(document).on("change", ".css_reload :input", function (event) {
//    var target = y.getTarget($(this));
    //CL - Try to do this with the selector on the .change call if possible
    if (!($(this).parent().hasClass("css_type_reference") && $(this).parent().children("input").length > 1)) {
        y.last_focused_input = $(this).attr("name");
        y.loadLocal($(this), {
            page_button: $(this).attr("name")
        });
    }
});

/*-------------------------------------------------------------Field Functions--------------------------------------------------*/
y.getRenderData = function (field) {
    var json_obj = {},
        json_str = field.find("span.css_render_data").text();
    if (json_str) {
        json_obj = $.parseJSON(json_str);
        field.data("render_data", json_obj);
    }
    return json_obj;
};

y.fieldFocus = function (field) {
    var errors_msg = $(field).siblings("span.inline-help");
//        json_obj = $(field).parent().data("render_data");
    errors_msg.removeClass("css_hide");
//    if (json_obj && json_obj.helper_text && $(field).val() === json_obj.helper_text) {
//        $(field).val("");
//        $(field).removeClass("css_helper_text");
//    }
    y.last_focused_input = $(field).attr("id");
};

// Need to re-factor this function!
y.fieldBlur = function (field) {
    var field_val = $(field).val(),
        error     = "",
        delim     = "",
        valid,
        regex,
        number,
        container = $(field).parents(".css_edit").first(),
        json_obj  = container.data("render_data"),
        mask,
        checked,
        siblings = $(field).siblings(":input");

    function addError(str) {
        error += delim + str;
        delim  = ", ";
    }

    if (typeof json_obj !== "object") {
        json_obj = {};
    }

    //Richtext field value
    if ($(field).hasClass("aloha-editable")) {
        field_val = $(field).text();
    }

    //Blank field val if it equals the input mask
    if (json_obj.input_mask || json_obj.input_mask1 || json_obj.input_mask2) {
        if (container.hasClass("css_type_datetime")) {
            if ($(field).index() === 0) {
                mask = json_obj.input_mask1;
            } else if ($(field).index() === 1) {
                mask = json_obj.input_mask2;
            }
        } else{
            mask = json_obj.input_mask;
        }

        //replace '9's with underscores
        mask = mask.split("9").join("_");

        if (field_val === mask) {
            field_val = "";
            $(field).val("");
        }
    }

    //Check if any radio button is ticked
    if ($(field).attr("type") === "radio") {
        checked = false;
        $("input[name='"+$(field).attr("name")+"']").each(function(){
            if ($(this).is(":checked")) {
                checked = true;
            }
        });
        if (!checked) {
            field_val = "";
        }
    }
    if (field_val === "") {
        if (container.hasClass("css_mand")) {
            addError("mandatory");
        }
//        if (json_obj.helper_text) {
//            $(field).val(json_obj.helper_text);
//            $(field).addClass("css_helper_text");
//        }
    } else {
        if (container.hasClass("css_mand")) {
            [].some.call(siblings, function (sibling) {
                if ($(sibling).val() === "" && $(sibling).attr("type") !== "hidden") {
                    addError("mandatory");
                    return true;
                }
                return false;
            });
        }

        if (json_obj.before_validation && typeof field_val[json_obj.before_validation] === "function") {
            field_val = field_val[json_obj.before_validation]();
        }

        if (container.hasClass("css_type_number")) {
            field_val = field_val.replace(/,/g, "");
            valid = !isNaN(field_val);
            number = parseFloat(field_val, 10);
            if (!valid) {
                addError("not a number");
            } else if (typeof json_obj.max === "number" && number > json_obj.max) {
                addError(number + " is higher than maximum value: " + json_obj.max);
            } else if (typeof json_obj.min === "number" && number < json_obj.min) {
                addError(number + " is lower than minimum value: " + json_obj.min);
            }
        }
//        if ($(field).parent().hasClass("css_type_date")) {
//            json_obj.regex_pattern = "[0-3]?[0-9]/[0-1]?[0-9]/[0-9]{2}";
//        }
        if (container.hasClass("css_type_datetime")) {
            if ($(field).index() === 0) {
                if (json_obj.regex_pattern1) {
                    json_obj.regex_pattern = json_obj.regex_pattern1;
                }
                if (json_obj.regex_label1) {
                    json_obj.regex_label = json_obj.regex_label1;
                }
            } else if ($(field).index() === 1) {
                if (json_obj.regex_pattern2) {
                    json_obj.regex_pattern = json_obj.regex_pattern2;
                }
                if (json_obj.regex_label2) {
                    json_obj.regex_label = json_obj.regex_label2;
                }
            }
        }
        if (container.hasClass("css_type_ni_number") && $(field).attr("id") !== "nino_unknown_input") {
            if (container.find("#nino_unknown_input").prop("checked") === false){
                if (json_obj.regex_ni && !json_obj.regex_ni_label) {
                    json_obj.regex_ni_label = "not valid";
                }
                if (json_obj.regex_ni) {
                    regex = new RegExp(json_obj.regex_ni);
                    valid = regex.exec(field_val);
                    if (!valid) {
                        addError(json_obj.regex_ni_label);
                    }
                }
            } else {
                if ($(field).attr("id") !== "nino_date_input") {
                    //Validate date sibling
                    if (json_obj.regex_date && !json_obj.regex_date_label) {
                        json_obj.regex_date_label = "not valid";
                    }
                    if (json_obj.regex_date) {
                        regex = new RegExp(json_obj.regex_date);
                        [].some.call(siblings, function (sibling) {
                            if ($(sibling).attr("id") === "nino_date_input" && !regex.exec($(sibling).val())) {
                                addError(json_obj.regex_date_label);
                                return true;
                            }
                            return false;
                        });
                    }

                    //Validate self
                    if (json_obj.regex_gender && !json_obj.regex_gender_label) {
                        json_obj.regex_gender_label = "not valid";
                    }
                    if (json_obj.regex_gender) {
                        regex = new RegExp(json_obj.regex_gender);
                        valid = regex.exec(field_val);
                        if (!valid) {
                            addError(json_obj.regex_gender_label);
                        }
                    }
                } else {
                    if (json_obj.regex_date && !json_obj.regex_date_label) {
                        json_obj.regex_date_label = "not valid";
                    }
                    if (json_obj.regex_date) {
                        regex = new RegExp(json_obj.regex_date);
                        valid = regex.exec(field_val);
                        if (!valid) {
                            addError(json_obj.regex_date_label);
                        }
                    }
                }
            }
        }
        if (json_obj.regex_pattern && !json_obj.regex_label) {
            json_obj.regex_label = "not valid";
        }
        if (json_obj.regex_pattern) {
            regex = new RegExp(json_obj.regex_pattern);
            valid = regex.exec(field_val);
            if (!valid) {
                addError(json_obj.regex_label);
            }
        }
    }

    y.fieldError(container, error);
};

//Override friendly function to
y.fieldError = function (container, error) {
    container.children("span.help-inline").remove();
    if (error) {
        container.append("<span class='help-inline'>" + error + "</span>");
//        $(field).parent().children("span.help-inline").effect( "pulsate", { mode: "hide" }, 500 );
        container.parent(".control-group").addClass("error");
    } else {
        container.parent(".control-group").removeClass("error");
    }
};

/*------------------------------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------Field Types------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------*/

/*-------------------------------------------------------Date Field-------------------------------------------------------------*/

$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_type_date").each(function () {
        var dp_settings,
            json_obj = y.getRenderData($(this));
        y.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
        y.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
        dp_settings = {
    //      showOn: "button",
    //      buttonImage: "/cdn/Axialis/Png/16x16/Calendar.png",
    //      buttonImageOnly: true,
            dateFormat: "dd/mm/y",          // 2-digit year
            shortYearCutoff: +50
        };
        if (json_obj.min) {
            dp_settings.minDate = new Date(json_obj.min);
        }
        if (json_obj.max) {
            dp_settings.maxDate = new Date(json_obj.max);
        }
        $(this).find(":input").datepicker(dp_settings);

        if (json_obj.input_mask && !$(this).hasClass("css_type_date")) {
            y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
            $(this).find(":input").mask(json_obj.input_mask);
        }
    });
});

/*----------------------------------------------------Date/Time-----------------------------------------------------------------*/

$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_type_datetime").each(function () {
        var field = $(this),
            json_obj = y.getRenderData(field),
            input1 = field.find(":input:eq(0)"),
            input2 = field.find(":input:eq(1)"),
            dp_settings;

        y.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
        y.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
        dp_settings = {
        //  showOn: "button",
        //  buttonImage: "/cdn/Axialis/Png/16x16/Calendar.png",
        //  buttonImageOnly: true,
            dateFormat: "dd/mm/y",          // 2-digit year
            shortYearCutoff: +50
        };
        if (json_obj.min) {
            dp_settings.minDate = new Date(json_obj.min);
        }
        if (json_obj.max) {
            dp_settings.maxDate = new Date(json_obj.max);
        }
        input1.datepicker(dp_settings);
        // An array would be better
        if (json_obj.input_mask1) {
            y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
            input1.mask(json_obj.input_mask1);
        }
        if (json_obj.input_mask2) {
            y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
            input2.mask(json_obj.input_mask2);
        }
    });
});

/*----------------------------------------------------NI Number-----------------------------------------------------------------*/
$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_type_ni_number").each(function () {
        var field = $(this),
            json_obj = y.getRenderData(field),
            nino_text_input = field.find("#nino_text_input"),
            nino_date_input = field.find("#nino_date_input"),
            //input2 = field.find(":input:eq(1)"),
            dp_settings;

        y.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
        y.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
        dp_settings = {
        //  showOn              : "button",
        //  buttonImage         : "/cdn/Axialis/Png/16x16/Calendar.png",
        //  buttonImageOnly     : true,
            dateFormat          : "dd/mm/yy",   // 2-digit year
        //  shortYearCutoff     : +50
            changeMonth         : true,         // Allow drop downs for month/year
            changeYear          : true,
            yearRange           : "-89:-0",     // Allow selection of -75Y

        };
        // if (json_obj.min) {
        //     dp_settings.minDate = new Date(json_obj.min);
        // }
        // if (json_obj.max) {
        //     dp_settings.maxDate = new Date(json_obj.max);
        // }
        nino_date_input.datepicker(dp_settings);
        // // An array would be better
        if (json_obj.date_input_mask) {
            y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
            nino_date_input.mask(json_obj.date_input_mask);
        }
        if (json_obj.ni_input_mask) {
            y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
            nino_text_input.mask(json_obj.ni_input_mask, {autoclear: false});
        }
        // if (json_obj.input_mask2) {
        //     y.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.min.js");
        //     input2.mask(json_obj.input_mask2);
        // }
    });
});

/*--------------------------------------------------------Dotgraph--------------------------------------------------------------*/

$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_type_dotgraph").each(function () {
        var field = $(this);
        y.checkScript("/cdn/viz/viz.js");
        function drawGraph() {
            var text = field.children("textarea").val();
            if (text) {
                /*jslint newcap: true */
                field.children("div.css_diagram").html(Viz(text, "svg"));
            }
        }
        drawGraph();
        field.children("textarea").blur(function () {
            drawGraph();
        });
    });
});

$(document).on("initialize", function (event, target, opts) {
    target.find(".css_type_dotgraph").each(function () {
        var element,
            text;
        y.checkScript("/cdn/viz/viz.js");
        element = $(this).children("div.css_disp");
        text = element.text();
        /*jslint newcap: true */
        element.html(Viz(text, "svg"));
    });
});

/*----------------------------------------------Reference/Combo (Autocompleter)-------------------------------------------------*/

$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_type_reference").each(function () {
        if ($(this).children("input").length === 0) {
            return;
        }

        var id,
            map = {},
            field        = $(this),
            field_value  = field.children("input[type='hidden']"),
            input_cntrl  = field.children("input[type='text']"),
            input_value  = input_cntrl.val(),
            combo        = field.hasClass("css_combo"),
            max_rows,
            min_length,
            modified = false;

        id         = input_cntrl.attr( "id" );
        max_rows   = field.data("render_data").autocompleter_max_rows   || 10;
        min_length = field.data("render_data").autocompleter_min_length || 2;

        function setValue(val) {
            if (input_value === val) {
                return;
            }
            modified = true;
            if (map[val]) {         // picked a value from the list
                field_value.val((combo ? "R" : "") + map[val]);
                input_value = val;

            } else {                // free-text
                if (combo && val) {
                    field_value.val("F" + val);
                    input_cntrl.val(val);
                    input_value = val;
                } else {
                    field_value.val("");
                    input_cntrl.val("");
                    input_value = "";
                }
            }

        }

        function afterBlur() {
            if (modified) {
                modified = false;
                if (field.hasClass("css_reload")) {
                    y.loadLocal(field, { page_button: field_value.attr("name") });
                }
            }
        }

        input_cntrl.typeahead({
            minLength: min_length,       // min chars typed to trigger typeahead
            items : max_rows,
            source: function (query, process) {
                $.ajax({
                    dataType    : "json",
                    url         : y.getAjaxURL("jsp/main.jsp"),
                    data        : {
                                    "mode"  : "autocompleter",
                                    "q"     : query,
                                    "field" : id
                                  },
                    beforeSend: function (xhr) {        // IOS6 fix
                        xhr.setRequestHeader('If-Modified-Since', '');
                    },
                    success: function (data, status_text) {
                        var out  = [];
                        //create typeahead dataset
                        $.each(data.results, function (i, obj) {
                            out.push(obj.value);
                            /*jslint nomen: true */
                            map[obj.value] = obj._key;
                        });
                        process(out);
                        //add extra row in case of more results
                        if (data.results.length < data.meta.found_rows) {
                            field.children('ul.typeahead').append(
                                '<li style="text-align:center;">[' + data.results.length + ' of ' + data.meta.found_rows + ']</li>');
                        }
                    }
                });
            },
            updater: function (item) {
                setValue(item);
                return item;
            }
        });
        if ($(input_cntrl).is(":focus")) {
            input_cntrl.typeahead().focus();
        }
        input_cntrl.focus(function (event2) {
            input_value = input_cntrl.val();
        });
        // If the item is chosen with the mouse, blur event fires BEFORE updater, but with keyboard it is opposite way around
        // Worse, when choosing with mouse, it seems we cannot tell at blur that an updater call is coming afterwards
        // Hack solution uses setTimeout() to execute after updater
        input_cntrl.blur(function (event2) {
            setValue(input_cntrl.val());
            setTimeout(afterBlur, 500);
        });
    });
});

/*-----------------------------------------------------File Upload Field-------------------------------------------------------*/
$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_type_file").each(function () {
        var field = $(this),
            oInput,
            control        = field.children(":input"   ).attr("id"),
            existing_id    = field.children("span.val" ).text(),
            existing_title = field.children("span.text").text();

        y.checkStyle( "/cdn/jquery.fileuploader/fileuploader.css");
        y.checkScript("/cdn/jquery.fileuploader/fileuploader.js");
        //y.checkStyle("/cdn/jquery.fineuploader-3.3.0/fineuploader-3.3.0.css");
        //y.checkScript("/cdn/jquery.fineuploader-3.3.0/jquery.fineuploader-3.3.0.js");
        /*
        * Future upgrade:
        $(this).fineUploader({
            request: {
                endpoint: "jsp/main.jsp?mode=fileup&"
            }
        }).on("complete", function(event, id, name, responseJSON) {
            oInput.val(responseJSON.file_id);
            y.fieldBlur(oInput);        // put the inline-help message back
        });
        */
        function addFileRemover() {
            //Add an 'X' button to remove file id val - put me in a function
            field.children("div.qq-uploader").children('ul.qq-upload-list').children("li.qq-upload-success").each(function() {
                var x_span = $('<span style="color: red; font-weight: bold; font-size: 18px; cursor:pointer;">&times;</span>');
                x_span.click(function () {
                    oInput.val("");
                    $(this).parent().remove();
                    y.fieldBlur(oInput);
                });
                $(this).append(x_span);
            });
        }

        new qq.FileUploader({
            element: field[0],
            action: y.getAjaxURL("jsp/main.jsp", "mode=fileup&field_control=" + control),
            allowedExtensions: field.children("span.allowed_extensions").text().split(","),
            onSubmit: function (id, file_name) {
                field.find("ul.qq-upload-list").empty();
                oInput.val("");                 // allow user to clear the field
                //5174 - Deactivate page during file upload
                $("div#css_body").trigger('deactivate', [$("div#css_body"), { load_mode: "main" }]);
            },
            onCancel : function (id, file_name) {
                //5174 - Reactivate page after upload cancellation
                $("div#css_body").trigger(  'activate', [$("div#css_body"), { load_mode: "main" }]);
            },
            onComplete: function (id, sFileName, responseJSON) {
                var file_id = responseJSON.file_id;
                oInput.val(file_id);
                y.fieldBlur(oInput);        // put the inline-help message back
        //          oSpan.find( "$(this).qq-upload-button > span" ).text( "Upload a replacement file" );
        //          var fileURL = "jsp/main.jsp?mode=filedown&id=" + responseJSON.file_id;
        //          oSpan.find( "span.qq-upload-file > a").attr("href", fileURL );
                addFileRemover();

                //5174 - Reactivate page after upload
                $("div#css_body").trigger('activate',[$("div#css_body"), { load_mode: "main" }]);
            },
            sizeLimit: field.children("span.sizeLimit") ? field.children("span.sizeLimit").text() : 0
        });

        field.append("<input type='hidden' name='" + control + "' value='" + existing_id + "' />");
        oInput = field.children(":input[type='hidden']");
        if (existing_title) {
            field.find("ul.qq-upload-list").append(
                "<li class='qq-upload-success'><span class='qq-upload-file'>" +
                "<a target='_blank' href='" + y.getAjaxURL("file/" + existing_title, "mode=filedown&id=" +
                existing_id) + "'>" + existing_title + "</a></span></li>");
        //      "<a href='javascript:y.remoteModal(\"jsp/main.jsp?mode=context&page_id=ac_file_context&page_key=" +
        //      existing_id + "\")'>" + existing_title + "</a></span></li>");
            addFileRemover();
        }
        y.fieldBlur(oInput);        // put the inline-help message back
    });
});

/*-----------------------------------------------Richtext (aloha) fields--------------------------------------------------------*/
$(document).on("initialize", function (event, target, opts) {
    target.find("div.css_edit.css_richtext").each(function () {
        var textarea;

        textarea = $(this).children("div")[0];
        if (!y.aloha_activated) {
            Aloha = window.Aloha || {};
            Aloha.settings = Aloha.settings || {};
            Aloha.settings.locale = 'en';
            Aloha.settings.sidebar = { disabled: true };
            // Restore the global $ and jQuery variables of your project's jQuery
//            Aloha.settings.jQuery = window.jQuery;
    //        Aloha.settings.jQuery = window.jQuery.noConflict(true);
            Aloha.settings.plugins = {
                load: "common/ui, common/format, common/list, common/link, common/paste, common/table, common/contenthandler, common/image"
            };
            Aloha.settings.contentHandler = {
                insertHtml: [ 'word', 'generic', 'oembed', 'sanitize' ],
                initEditable: [ 'sanitize' ],
                getContents: [ 'blockelement', 'sanitize', 'basic' ],
                sanitize: 'relaxed' // relaxed, restricted, basic,
            };
    //        Aloha.settings.plugins.image = {
    //            config: [ 'img' ], // enable the plugin
    //            config: { ui: { reset: true, resize: false, crop: false, resizeable: false } }
    //        };
            y.checkStyle( "/cdn/alohaeditor-1.2.1/aloha/css/aloha.css");
    //      y.checkScript("/cdn/alohaeditor-v0.25.2/aloha/lib/vendor/jquery-1.7.2.js");
            y.checkScript("/cdn/alohaeditor-1.2.1/aloha/lib/require.js");
            y.checkScript("/cdn/alohaeditor-1.2.1/aloha/lib/aloha-full.min.js");
            y.aloha_activated = true;
        }
        Aloha.ready(function() {
//          $ = Aloha.jQuery;
//          $(textarea).aloha();
          Aloha.jQuery(textarea).aloha();
      });

        $(textarea).blur(function () {
            y.fieldBlur(textarea);
        });
        //Append Mandatory span tags to parent - Move to Server side??
    //  $(this).children('span.help-inline').each(function() {
    //      $(this).parent().parent().append( $('<div class="css_edit error" style="margin-left: 180px;"> </div>').append($(this)) );
    //  });
    });
});

/*---------------------------------------------------------Search Filters-------------------------------------------------------*/
$(document).on("initialize", function (event, target, opts) {
    target.find("table.css_search_filters").each(function() {
        var tr = $(this).find("tbody > tr");
        function adjustOperator(input) {
            var oper_field,
                json_obj;
            tr = $(input).parent().parent().parent();
            oper_field = tr.find("td:eq(2) > div > :input");
            if ($(input).val()) {
                if (oper_field.val() === "") {
                    json_obj = tr.find("td:eq(3) > div").data("render_data");
                    if (json_obj && json_obj.auto_search_oper) {
                        oper_field.val(json_obj.auto_search_oper);
                    }
                }
            } else {
                oper_field.val("");
            }
        }
        function adjustBetween(input) {
            tr = $(input).parent().parent().parent();
            if ($(input).val() === "BT") {
                tr.find("td:eq(4)").removeClass("css_hide");
            } else {
                tr.find("td:eq(4)").addClass("css_hide");
            }
        }
        tr.find("td:eq(3) > div > :input").keyup(  function() { adjustOperator(this); });
        tr.find("td:eq(3) > div > :input").change( function() { adjustOperator(this); });
        tr.find("td:eq(2) > div > :input").change( function() { adjustBetween(this); });
        tr.find("td:eq(2) > div > :input").each(   function() { adjustBetween(this); });
    });
});

/*------------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------Sections Types-------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------------------------------*/

/*-----------------------------------------------------------Hierarchy----------------------------------------------------------*/
$(document).on("initialize", function (event, target, opts) {
    target.find(".css_section_Hierarchy").each(function() {
        $(this).find("li").not(":has(ul)").children("a.css_hier_ctrl").remove();
    });
});
$(document).on("click", "div.css_section_Hierarchy ul > li > a.css_hier_ctrl", function () {
    var parent_li = $(this).parent();
    if (parent_li.hasClass("css_expanded")) {
        parent_li.removeClass("css_expanded");
        parent_li.   addClass("css_contracted");
    } else {
        parent_li.   addClass("css_expanded");
        parent_li.removeClass("css_contracted");
    }
});

////the following is from: http://stackoverflow.com/questions/447789/jquery-expanding-collapsing-lists
$(document).on("initialize", function (event, target, opts) {
    target.find(".css_tree_table_layout").each(function () {
        $(this).find("tr").each(function () {
            var inset = 0,
                td_elem = null;
            $(this).find("td").each(function () {
                var text_content = $(this).text();
                if (!td_elem) {
                    if (text_content) {
                        td_elem = this;
                    } else {
                        inset += 1;
                    }
                }
            });
            $(this).data("inset", inset);
        });
    });
});
$(document).on("click", "table.css_tree_table_layout a.css_hier_ctrl", function (event) {
    var tr_elem = $(this).parent().parent(),
        keep_going = true,
        inset = tr_elem.data("inset"),
        expand = tr_elem.hasClass("css_contracted");

    if (expand) {
        tr_elem.   addClass("css_expanded");
        tr_elem.removeClass("css_contracted");
    } else {
        tr_elem.removeClass("css_expanded");
        tr_elem.   addClass("css_contracted");
    }
    tr_elem.nextAll().each(function() {
        if (!keep_going) {
            return;
        }
        if ($(this).data("inset") > inset) {
            $(this).css("display", expand ? "table-row" : "none");
        } else {
            keep_going = false;
        }
    });
});

/*------------------------------------------------------------Chart-------------------------------------------------------------*/
$(document).on("initialize", function (event, target, opts) {
    target.find(".css_section_Chart").each(function() {
        var json,
            obj,
            new_obj,
            enable_regression = false,
            i, j,
            chart, ser;

        function clickThrough (event) {
            if (event.point && event.point.url) {
                window.location = event.point.url.replace(/&amp;/g, "&");
            }
        }

        json = $(this).find("span.css_hide").html();
        obj  = $.parseJSON(json);
        if (obj.library === "flot") {
            y.checkScript("/cdn/jquery.flot/jquery.flot.min.js");
            y.checkScript("/cdn/jquery.flot/jquery.flot.stack.min.js");
            $(this).find("div.css_chart").css("width" , obj.options.width  || "900px");
            $(this).find("div.css_chart").css("height", obj.options.height || "400px");
            $.plot($(this).find("div.css_chart"), obj.series, obj.options);
        } else if (obj.library === "highcharts") {
            y.checkScript("/cdn/highcharts-3.0.0/highcharts.js");
            y.checkScript("/cdn/highcharts-3.0.0/highcharts-more.js");
            y.checkScript("/cdn/highcharts-3.0.0/exporting.js");
            y.checkScript("style/highcharts_defaults.js");
            new_obj = obj.options;
            //new_obj.series = obj.series;
            new_obj.series = [];
            j = 0;
            for (i = 0; i < obj.series.length; i += 1) {
                if (!enable_regression && obj.series[i].regression) {
                    enable_regression = true;
                }
                if (!obj.series[i].remove) {
                    new_obj.series[j] = obj.series[i];
                    new_obj.series[j].events = { click: clickThrough };
                    j += 1;
                }
            }
            new_obj.chart.renderTo = "css_chart_" + $(this).attr("id");

            if (enable_regression) {
//                console.log(enable_regression);
                y.checkScript("/cdn/highcharts-3.0.0/highcharts-regression.js");
            }

            chart = new Highcharts.Chart(new_obj);
            if (enable_regression) {
                ser = chart &&
                          chart.options &&
                          chart.options.series &&
                          chart.options.series[chart.options.series.length - 1]; //the last one it's always the regression line
                if (ser) {
                    ser.enableMouseTracking = false;
                    chart = new Highcharts.Chart(chart.options);
                }
            }
        //} else if (obj.library === "google") {
            // TODO
        }
    });
});

/* ------------------------------------SessionTimeout------------------------------------------- */

y.sessionTimeout = {};

y.sessionTimeout.onLoadSuccess = function (logged_out, session) {
    var session_timeout_required = (
        !logged_out
        && session.max_inactive_interval
        && session.timeout_extension_limit
    );
    this.cancelTimers();
    if (session_timeout_required) {
        this.initialise(session.max_inactive_interval, session.timeout_extension_limit);
    }
};

y.sessionTimeout.initialise = function (timeout, extension) {
    this.extension = extension * 1000;
    this.extension_timer_handle = setTimeout(this.promptForExtension.bind(this), timeout * 1000);
};

y.sessionTimeout.promptForExtension = function () {
    var modal_allowed = (
        $("#css_modal > .modal-messages").length
    );
    var modal_options = {
        modal_allowed: modal_allowed,
        modal_confirm_btn: "extend",
        modal_confirm_text: "Extend",
        modal_close: false,
    };
    y.addModalMessage("Your session will soon timeout. Please click here to extend your session.", "W");
    y.showModalAlert(modal_options);
    this.logout_timer_handle = setTimeout(y.logout, this.extension);
};

y.sessionTimeout.cancelTimers = function () {
    if (this.extension_timer_handle) {
        clearTimeout(this.extension_timer_handle);
    }
    if (this.logout_timer_handle) {
        clearTimeout(this.logout_timer_handle);
    }
};


/*-----------------------------------------------------Modal--------------------------------------------------------------------*/
//Click handlers to load a modal
$(document).on("click", "a[data-toggle='modal']", function (event) {
    var url = $(this).attr("href");
    // SDF - what this is line for?
//    $(this).closest("ul.dropdown-menu").siblings("a.dropdown-toggle").trigger("click");
    y.remoteModal(url);
    return false;
});
$(document).on("click", "a.css_open_in_modal", function (event) {
    var url = $(this).attr("href"),
        section_id = $(this).parents("div.css_section").attr("id");

    if ($(this).hasClass("disabled")) {
        return false;
    }
    if ($(this).hasClass("css_bulk")) {
        url += y.bulk.getURLParams($(this)) + "&refer_page=" + y.page.id + "&refer_section=" + section_id;
    }
    y.remoteModal(url);
    return false;
});

y.remoteModal = function (url) {
    $("#css_modal .modal-header > h3").html("Loading...");
    $("#css_modal .modal-messages"   ).empty();
    $("#css_modal .modal-body"       ).html("");
    y.loadQueryString($("#css_modal .modal-body"), url, { load_mode: "modal" });
};

y.localModal = function (body, header, footer) {
    $("#css_modal .modal-header > h3").html(header);
    $("#css_modal .modal-messages"   ).empty();
    $("#css_modal .modal-body"       ).html(body);
    $("#css_modal .modal-footer"     ).html(footer);
    $("#css_modal").modal('show');
};

/*-----------------------------------------------------Column Chooser-----------------------------------------------------------*/

y.listColumnChooser = function (span) {
    var col_chooser = $(span).parent().children("div.css_list_choose_cols");
    col_chooser.toggle('fast');
};

/*
$(document).on("initialize", function (e, target, opts) {
    $(this).find(".css_list_choose_cols").each(function() {
        var sctn_id = $(this).closest(".css_section").attr("id"),
            chooser = $(this),
            i,
            btn_labels = [],
            input;

        //Populate label array for datasource
        //CL - I'd prefer to show/hide using button id rather than text but this approach seems to work as false positives shouldn't happen
        $(this).find("button").each(function() {
            btn_labels.push($(this).text());
        });
        $("input[name='cols_filter_" + sctn_id + "']").typeahead({ source: btn_labels, items: 0,
            sorter: function(items) {
                chooser.find("button").addClass("css_hide");
                for (i = 0; i < items.length; i += 1) {
                    chooser.find("button:contains('" + items[i] + "')").removeClass("css_hide");
                }
                return items;
            }
        });
        input = $("input[name='cols_filter_" + sctn_id + "']");
        input.typeahead('lookup');
    });
});

//Show all buttons when filter value is blank - typeahead sorter doesn't run if blank
y.blankChooserFilter = function(input) {
    if (!input.val()) {
        input.closest(".css_list_choose_cols").find("button").removeClass("css_hide");
    }
};
$(document).on("blur input", ".css_list_cols_filter > input", function() {
    y.blankChooserFilter($(this));
});
//$(document).on("input",".css_list_cols_filter > input", function(){y.blankChooserFilter($(this));});

//Click x to clear filter input and show all buttons
$(document).on("click", "a.cols_filter_clear", function() {
    var input = $(this).siblings("input");
    input.val("");
    input.trigger("blur");
});
*/

y.filterColumnButtons = function (button_container, filter_text) {
    var pattern = new RegExp(filter_text, "i"),
        button;
    button_container.children("button").each(function () {
        if (pattern.test($(this).text())) {
            $(this).removeClass("css_hide");
        } else {
            $(this).   addClass("css_hide");
        }
    });

    //Join Button Group
    button_container.children("div.btn-group").each(function () {
        button = $($(this).children("button")[0]);
        if (pattern.test(button.text())) {
            $(this).removeClass("css_hide");
        } else {
            $(this).   addClass("css_hide");
        }
    });
};

$(document).on("keyup", ".css_list_cols_filter > :input", function () {
    y.filterColumnButtons($(this).parent().parent(), $(this).val());
});

$(document).on("initialize", function (event) {
    $(".css_list_choose_cols").each(function () {
        y.filterColumnButtons($(this), $(this).find(".css_list_cols_filter > :input").val());
    });
});
/*----------------------------------------------------------Misc----------------------------------------------------------------*/

y.toggle = function (selector) {
    $(selector).toggle('fast');
};

y.updateDate = function () {
    y.checkScript("/cdn/mattkruse.com/date.js");
    var sDate = formatDate(new Date(), "E d NNN yyyy HH:mm:ss");
    $("div#css_footer_datetime").text(sDate);
    setTimeout(y.updateDate, 1000);
};

y.setCopyrightMsg = function () {
    $("div#css_footer_copyright").html("&#169; 2009-"+String((new Date()).getFullYear()).slice(-2)
        +" Rullion Solutions Ltd");
};

y.unescapeString = function (value) {
    var d = document.createElement('div');
    d.innerHTML = value;
    return d.innerText;
};

/*----------------------------------------------Dynamic Asset Loading-----------------------------------------------------------*/
y.checkScript = function (src) {
    if (typeof y.loaded[src] === "undefined") {
        $.ajax({ url: src, dataType: "script", cache: true, async: false, type: "GET",
            // No beforeSend IOS6 fix
            error: function(XHR, descr, exception) {
                y.addMessage(exception + " trying to get " + src, 'E');
                y.loaded[src] = false;
            },
            success: function() {
                y.loaded[src] = true;
            }
        });
    }
};

y.checkStyle = function (src) {
    var style;
    if (typeof y.loaded[src] === "undefined") {
        style = document.createElement("link");
        style.setAttribute("rel" , "stylesheet");
        style.setAttribute("type", "text/css");
        style.setAttribute("href", src);
        if (typeof style !== "undefined") {
              document.getElementsByTagName("head")[0].appendChild(style);
              y.loaded[src] = true;
        }
    }
};

/** Bulk functionality */
y.bulk = {};

y.bulk.getKeyArray = function () {
    return y.multiselect_table.data("bulk_selection_key_array") || [];
};

y.bulk.updateRowSelection = function (key_array, row, select) {
    var key = row.attr("data-key");
    if (select) {
        row   .addClass("css_mr_selected");
        if (key_array.indexOf(key) === -1) {
            key_array.push(key);
        }
    } else {
        row.removeClass("css_mr_selected");
        if (key_array.indexOf(key) > -1) {
            key_array.splice(key_array.indexOf(key), 1);
        }
    }
};

y.bulk.setKeyArray = function (key_array) {
    var elem_count = key_array.length;
    y.multiselect_table.data("bulk_selection_key_array", key_array);
    y.multiselect_table.find("tr.css_mr_actions .css_bulk_rowcount").html(elem_count + " " + (elem_count !== 1 ? "rows" : "row") + " selected");
    y.multiselect_table.find("tr.css_mr_actions > input").val(JSON.stringify(key_array));
    if (key_array.length > 0) {
        y.multiselect_table   .addClass("css_mr_selecting");
        y.multiselect_table.find("tr.css_mr_actions > td > span.btn-group > a.css_bulk").removeClass("disabled");
    } else {
        y.multiselect_table.removeClass("css_mr_selecting");
        y.multiselect_table.find("tr.css_mr_actions > td > span.btn-group > a.css_bulk").addClass("disabled");
    }

};

y.bulk.mouseoverRow = function(row) {
    var key_array = this.getKeyArray();
    this.updateRowSelection(key_array, row, !y.mouse_deselect);
    this.setKeyArray(key_array);
};

y.bulk.getURLParams = function (btn_elem) {
    var table = $(btn_elem).parents("table");
    var out = "&selected_keys=" + JSON.stringify(table.data("bulk_selection_key_array") || []);
    table.data("bulk_selection_key_array", []);
    return out;
}



$(document).on("mousedown", "td.css_mr_sel"  , function(event) {
    y.multiselect_table = $(this).parent("tr").parent("tbody").parent("table");
    y.mouse_deselect    = $(this).parent("tr").hasClass("css_mr_selected");
    y.bulk.mouseoverRow($(this).parent());
    return false;
});
$(document).on("mouseover", "td.css_mr_sel"  , function(event) {
    if (y.multiselect_table) {
        y.bulk.mouseoverRow($(this).parent());
    }
});
$(document).on("mouseup", function (event) {
    y.multiselect_table = null;
});

$(document).on("click", "td.css_mr_sel", function (event) {
    return false;
});


//C9918
$(document).on("click", ".css_bulk_select", function (event) {
    var select = $(this).hasClass("all"),
        key_array;

    y.multiselect_table = $(this).parents("table");
    key_array = y.bulk.getKeyArray();
    // if (select) {
    //     if (!!$(this).parent("tfood").find("span.css_list_control")) {
    //         y.addMessage("Only the visible rows have been selected", "W");
    //     }
    // }

    $(this).parents("table").children("tbody").children("tr").each(function () {
        y.bulk.updateRowSelection(key_array, $(this), select);
    });

    $(this).parent().children("a").each(function () {
        if ($(this).hasClass("disabled") && select) {
            $(this).removeClass("disabled");
        } else if (!select && !$(this).hasClass("disabled") && key_array.length === 0 && !$(this).hasClass("css_bulk_select")) {
            $(this).addClass("disabled");
        }
    });
    y.bulk.setKeyArray(key_array);
    y.multiselect_table = null;
});
//end C9918


/** end Bulk */

/*------------------------------------------------------Resize End---------------------------------------------------*/
//This creates an inferred 'resize end' event based on a delay in response to resize
//Resize triggers multiple times while the user is resizing. We only want these items to occur when resizing has stopped for performance reasons
//http://stackoverflow.com/questions/5489946/jquery-how-to-wait-for-the-end-of-resize-event-and-only-then-perform-an-ac
y.r_time = new Date();
y.r_timeout = false;
y.r_delta = 200;
$(window).resize(function() {
  y.r_time = new Date();
  if (y.r_timeout === false) {
      y.r_timeout = true;
      setTimeout(y.handleResizeEnd,y.r_delta);
  }
});
y.handleResizeEnd = function () {
  if (new Date() - y.r_time < y.r_delta) {
      setTimeout(y.handleResizeEnd, y.r_delta);
  } else {
      //Code executed at implied resize end
      y.r_timeout = false;
      y.updateMenu();
      y.positionLeftBar();
  }
};

/*---------------------------------------------Web Videos via MediaElement.js-------------------------------------------*/
//C8574
$(document).on("initialize", function (event, target, opts) {
  target.find(".css_webvideo").each(function () {
      //Original File
//      y.checkScript("/cdn/mediaelement/build/mediaelement-and-player.min.js");
      //Amended File to fix an IE7/8 issue
      y.checkScript("/cdn/mediaelement/build/mediaelement-and-player-rsl-fix.js");
      y.checkStyle("/cdn/mediaelement/build/mediaelementplayer.css");
      $(this).mediaelementplayer({plugins: ['flash'], pluginPath: "/cdn/mediaelement/build/",
          enablePluginSmoothing: true, features: ['playpause','progress','current','duration','fullscreen']});
  });
});

$(document).on("click", ".css_bulk_non_modal", function (event) {

    if ($(this).hasClass("disabled")) {
        return false;
    }

    if ($(this).hasClass("css_bulk")) {
        $(this).attr("href", $(this).attr("href") + "&selected_keys=" + $(this).siblings(":input").val());
        $(this).siblings(":input").val("");
    }
});
