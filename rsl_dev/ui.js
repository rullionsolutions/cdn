/*jslint browser: true */
/*global $, console, confirm, formatDate, Highcharts */
"use strict";

var x = {};

x.ui = {
    id: "x.ui",
    active: true,
    default_page: "home",
    arrow_entity: "&#10148;",
    reload_count:  0,
    script_loaded: []
};


x.ui.clone = function (id) {
    var obj = Object.create(this);
    obj.id  = id;
    return obj;
};

x.ui.bindToHTML = function (skin, default_page, selectors) {
    this.skin         = skin;
    this.default_page = default_page;
    this.selectors    = selectors;
    this.checkSelector("target");
    this.checkSelector("content");
    this.checkSelector("messages");
    this.checkSelector("links");
    this.checkSelector("tabs");
    this.checkSelector("buttons");
    this.checkSelector("unisrch");
    this.checkSelector("datetime");
    this.checkSelector("copyright");
    $(selectors.target).addClass("css_load_target");
    $(selectors.target).data("ui", this);
};

// each selector provided should reference exactly one element in the HTML
x.ui.checkSelector = function (selector) {
    var count = $(this.selectors[selector]).length;
    if (typeof this.selectors[selector] === "string" && count !== 1) {
        throw new Error(this.id + ", invalid selector: " + selector + ", elements found: " + count);
    }
};

x.ui.debug = function (msg) {
    console.log("DEBUG: " + this.id + ", " + msg);
};

x.ui.setURL = function (url) {
    this.debug("ignoring setURL()");
};

x.ui.setTitle = function (title) {
    this.debug("ignoring setTitle()");
};

x.ui.setDescription = function (descr) {
    this.debug("ignoring setDescription()");
};

x.ui.setContent = function (data) {
    $(this.selectors.content).html(data);
};

x.ui.setLoadContent = function (data) {
    this.setContent(data);
    this.moveSessionMarkup();
    this.moveMessageMarkup();
    this.movePageMarkup();
};

x.ui.setTabs = function (tabs) {
    this.debug("ignoring setTabs()");
};

x.ui.setLinks = function (data) {
    $(this.selectors.links).html(data);
};

x.ui.setButtons = function (data) {
    $(this.selectors.buttons).html(data);
};

x.ui.setNavLinks = function (search_page, prev_key, next_key) {
    this.debug("ignoring setNavLinks()");
};

x.ui.clearMessages = function () {
    $(this.selectors.messages).empty();
    this.highest_msg_level = "";
};

x.ui.setHighestMsgLevel = function (msg_type) {
    if (msg_type === "E") {
        this.highest_msg_level = "E";
    } else if (msg_type === "W") {
        if (this.highest_msg_level !== "E") {
            this.highest_msg_level = "W";
        }
    } else if (!this.highest_msg_level) {
        this.highest_msg_level = msg_type;
    }
};

x.ui.reportMessage = function (msg) {
//    var css_class = "alert";
    if (typeof msg.type !== "string") {
        msg.type = "E";
    }
    this.setHighestMsgLevel(msg.type);
//    css_class += this.getMessageClass(msg.type);
    this.getMessageTypeBox(msg.type).append("<div data-msg-type='" + msg.type + "'>" + msg.text + "</div>");
//    $(this.selectors.messages).append("<div class='" + css_class + "'>" + msg.text + "</div>");
//    .effect( "pulsate", { times: 2 }, 500 );
};

x.ui.getMessageClass = function (msg_type) {
    if (msg_type === 'E') {
        return "alert-danger";
    }
    if (msg_type === 'W') {
        return "alert-warning";
    }
    if (msg_type === 'I') {
        return "alert-info";
    }
    return "";
};

x.ui.getMessageTypeBox = function (msg_type) {
    var css_class = this.getMessageClass(msg_type),
        elmt = $(this.selectors.messages).children("." + css_class);

    if (elmt.length === 0) {
        $(this.selectors.messages).append("<div class='alert " + css_class + "'></div>");
        elmt = $(this.selectors.messages).children("." + css_class);
    }
    return elmt;
};

x.ui.reportMessageHTML = function (html) {
    var that = this;
    $(this.selectors.messages).append(html);
    $(this.selectors.messages).children().each(function () {
        var msg_type = $(this).attr("data-msg-type");
        that.setHighestMsgLevel(msg_type);
        $(this).addClass("alert " + that.getMessageClass(msg_type));
    });
};

x.ui.decomposeURL = function (url) {
    var temp = $('<a>', { href: url } )[0],
        parts = {
            protocol : temp.protocol,
            hostname : temp.hostname,
            port     : temp.port,
            pathname : temp.pathname,
            query    : temp.search,
            hash     : temp.hash
        },
        path = parts.pathname.split("/");

    parts.skin     = path.pop();
    parts.pathname = path.join("/");
    // parts will contain protocol, hostname, port, pathname, search, hash
    // function checkPart(part_name, regex) {
    //     var match = regex.exec(url);
    //     if (match) {
    //         parts[part_name] = match[1];
    //         url              = match[2];
    //     }
    // }
    // checkPart("protocol", new RegExp("^([a-z]+)\\:/{0,2}(.*)$"));
    // checkPart("username", new RegExp("^([\\w\\d\\.]+)@(.*)$"));
    // checkPart("hostname", new RegExp("^([\\w\\d\\.]+)(.*)$"));
    // checkPart("path"    , new RegExp("^([\\w\\d\\./]+/)(.*)$"));
    // checkPart("skin"    , new RegExp("^([\\w\\d\\.]+)(.*)$"));
    // checkPart("query"   , new RegExp("^\\?([^#]+)(.*)$"));
    // checkPart("fragment", new RegExp("^#(.*)(.*)$"));

    if (parts.query) {
        parts.params = this.splitParams(parts.query);
    }
    return parts;
};

x.ui.splitParams = function (str) {
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q,
        out = {};

    if (typeof str === "string") {
        str = str.substr(str.indexOf("?") + 1);         // find query string
        // if (str.charAt(0) === "?") {            // remove initial '?' if present
        //     str = str.substr(1);
        // }
        q = str;
        e = r.exec(q);
        while (e) {
            out[d(e[1])] = d(e[2]);
            e = r.exec(q);
        }
    }
    return out;
};

x.ui.addParamToURL = function (url, param_id, param_val) {
    var started_query = (!url || (url.indexOf("?") > -1));
    return (started_query ? "&" : "?") + param_id + "=" + encodeURIComponent(param_val);
};

x.ui.joinParams = function (obj) {
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

x.ui.simpleURLParams = function (obj) {
    var out = {};
    if (obj.page_id) {
        out.page_id  = obj.page_id;
    }
    if (obj.page_key) {
        out.page_key = obj.page_key;
    }
    return out;
};

x.ui.sameSimpleURL = function (skin, page_id, page_key) {
    return (!skin || skin === this.skin) &&
           (page_id  === this.page_id) &&
           (page_key === this.page_key || (!page_key && !this.page_key));
};

x.ui.getLocal = function (elem) {
    var target = elem && $(elem).parents(".css_load_target").first();
    if (target && target.length > 0) {
        return target.data("ui");
    }
    return x.ui.main;
};

x.ui.open = function (closeable) {
    this.debug("ignoring open()");
};

x.ui.close = function () {
    this.debug("ignoring close()");
};

x.ui.load = function (query_string, reload_opts) {
    var params = this.splitParams(query_string);
    reload_opts = reload_opts || {};
    this.page_id  = params.page_id = params.page_id || this.default_page;
    this.page_key = params.page_key;
    this.debug("load(" + query_string + "); skin: " + this.skin + ", page_id: " + this.page_id + ", page_key: " + this.page_key);
    query_string = this.joinParams(this.simpleURLParams(this));
    this.setURL(query_string);
    this.open(reload_opts.closeable);
    this.performAjax(params, reload_opts);
};

x.ui.reload = function (override_params, reload_opts) {
    var params = this.collectControlParams(this.selectors.content),
        param;

    reload_opts = reload_opts || {};
    this.reload_count += 1;
    for (param in override_params) {
        if (override_params.hasOwnProperty(param)) {
            params[param] = override_params[param];
        }
    }
    params.page_id  = params.page_id  || this.page_id;
    params.page_key = params.page_key || this.page_key;
    if (!params.page_key) {
        delete params.page_key;
    }
    this.performAjax(params, reload_opts);
};

x.ui.redirectAttribute = function (elmt, attr_id) {
    var url = $(elmt).attr(attr_id || "href"),
        section_id,
        reload_opts = {},
        keylist = [];

    if (url && url !== "#") {             // no-op urls
        section_id = $(elmt).parents("div.css_section").attr("id");
        if (section_id) {
            url += this.addParamToURL(url, "refer_section_id", section_id);
        }
        if ($(elmt).attr("target") === "_blank") {
            reload_opts.open_new_window = true;
        }
        if ($(elmt).hasClass("css_force_load")) {
            reload_opts.force_load = true;
        }
        if ($(elmt).hasClass("css_bulk")) {
            $(elmt).parents("table").eq(0).find("tr.css_mr_selected").each(function () {
                keylist.push($(this).attr("data-key"));
            });
            url += this.addParamToURL(url, "selected_rows", keylist.join(","));
        }
        this.redirect(url, reload_opts);
    }
};

x.ui.redirect = function (url, reload_opts) {
    var url_parts;
    if (!url) {
        url = this.skin;
    }
    if (this.page_id) {
        url += this.addParamToURL(url, "refer_page_id" , this.page_id);
    }
    if (this.page_key) {
        url += this.addParamToURL(url, "refer_page_key", this.page_key);
    }
    url_parts   = this.decomposeURL(url);
    reload_opts = reload_opts || {};
    this.processReloadOpts(reload_opts, url_parts);
//    this.debug("redirect(" + url + "), changing_simple_url: " + changing_simple_url);
    if (url_parts.skin === "modal") {
        reload_opts.closeable = true;
        x.ui.modal.load(url_parts.query, reload_opts);
    } else if (reload_opts.open_new_window) {
        window.open(url);
    } else if (reload_opts.force_load) {
        if (this.prompt_message && !confirm(this.prompt_message)) {
            return;
        }
        this.expecting_unload = true;
        window.location = url;
    } else {
        this.reload(url_parts.params, reload_opts);
    }
};


x.ui.processReloadOpts = function (reload_opts, url_parts) {
    var param,
        changing_simple_url = url_parts.params &&
            !this.sameSimpleURL(url_parts.skin, url_parts.params.page_id, url_parts.params.page_key);

    for (param in url_parts.params) {
        if (url_parts.params.hasOwnProperty(param) && param.indexOf("reload_opt") === 0) {
            reload_opts[param.substr(11)] = url_parts.params[param];
        }
    }
    if (typeof reload_opts.open_new_window !== "boolean" && url_parts.protocol === "mailto") {
        reload_opts.open_new_window = true;
    }
    if (typeof reload_opts.force_load      !== "boolean" && changing_simple_url) {
        reload_opts.force_load = true;
    }
};


x.ui.performAjax = function (params, reload_opts) {
    var that = this;
    if (!this.active) {
        return;
    }
    this.start_load = new Date();
    this.scroll_top = reload_opts.scroll_top || $(this.getScrollElement()).scrollTop();
    if (!reload_opts.keep_messages) {
        this.clearMessages();
    }
    this.deactivate();

    this.debug("performAjax(" + params.page_id + ":" + params.page_key + ")");
    $.ajax({ url: "dyn/?mode=exchange", type: "POST", data: $.param(params),
        //CL-Blanking this request header allows IOS6 Safari and Chrome 24+ to work (May benefit other webkit based browsers)
        //These headers were also blanked when this fix was initially added - Authorization, If-None-Match
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back, text_status, xml_http_request) {
            if (xml_http_request.status === 204) {      // "our" redirection...
                that.prompt_message = null;
                that.redirect(xml_http_request.getResponseHeader("Location"), reload_opts);
            } else {
                that.setLoadContent(data_back);
                if (that.page_skin !== that.skin) {
                    window.location = that.page_skin + window.location.search;
                } else {
                    that.activate();
                }
            }
        },
        error: function (xml_http_request, text_status) {
            var error_text = xml_http_request.getResponseHeader("X-Response-Message");
            if (!error_text) {
                if (xml_http_request.status === 0) {
                    error_text = "server unavailable";
                } else {
                    error_text = "[" + xml_http_request.status + "] " + xml_http_request.statusText;
                }
            }
            if (xml_http_request.status === 401) {
                if (that.default_guest_id) {
                    that.guestLogin(that.default_guest_id, params, reload_opts);
                } else {
                    x.ui.modal.promptLogin(params);
                }
            } else {
                that.reportMessage({ type: 'E', text: error_text });
                that.setContent("<a href='./?page_id=" + that.default_page + "'>return to home</a>");
                that.activate();
            }
        }
    });
};

x.ui.getScrollElement = function () {
    return this.selectors.content;
};

x.ui.activate = function () {
    var that = this;
    this.debug("activate()");
    this.active = true;
    $(this.selectors.target).removeClass("css_inactive");
    $(this.selectors.target).css("cursor", "default");
    $(this.selectors.target).find(":input.css_was_enabled").removeAttr("disabled");

    if (!this.session || this.session.is_guest) {
        $(".css_not_logged_in").removeClass("css_not_logged_in");
    } else {
        $(    ".css_logged_in").removeClass(    "css_logged_in");
        $(".css_accnt").text((this.session.chameleon ? "[" + this.session.chameleon + "] " : "" ) + this.session.nice_name);
    }

    if (this.session && this.session.help_article) {
        $("a#css_page_helpw").each(function () {
            var url = $(this).attr("href").match(/(.*)page_key=/);
            if (url && url.length > 1) {
                $(this).attr("href", url[1] + "page_key=" + that.session.help_article);
            }
        });
    }

    this.loadMenu();
//    this.activateFields();
    this.debug("triggering [activateUI] in x.ui.activate()");
    $(this.selectors.target).trigger('activateUI');
    if (this.highest_msg_level === "E" || this.highest_msg_level === "W") {
        this.scroll_top = 0;
    }
    $(this.getScrollElement()).scrollTop(this.scroll_top);
};

x.ui.deactivate = function () {
    this.active = false;
    $(this.selectors.target).   addClass("css_inactive");
    $(this.selectors.target).css("cursor", "progress");
    $(this.selectors.target).find(":input:enabled").each(function () {
        $(this).addClass("css_was_enabled");
        $(this).attr("disabled", "disabled");
    });
};

x.ui.collectControlParams = function (target_selector) {
    var params = { challenge_token: this.challenge_token };
    $(target_selector).find(".css_edit").each(function () {
        var field = x.field.getFieldObject(this);
        params[field.control_id] = field.getValue();
    });
    return params;
};

x.ui.moveSessionMarkup = function () {
    var that = this;
    that.session = { roles: {}, logged_in: false };
    $(this.selectors.target).find("#css_payload_session_data").each(function () {
        that.session.id             =  $(this).attr("data-session-id");
        that.session.chameleon      =  $(this).attr("data-chameleon");
        that.session.is_guest       = ($(this).attr("data-is-guest") === "true");
        that.session.logged_in      = !that.session.is_guest;
        that.session.home_page_url  =  $(this).attr("data-home-page-url");
        that.session.help_article   =  $(this).attr("data-help-article");
        that.session.server_purpose =  $(this).attr("data-server-purpose");
    });
    $(this.selectors.target).find("#css_payload_session_data > #css_payload_user_data").each(function () {
        that.session.user_id   = $(this).attr("data-user-id");
        that.session.user_name = $(this).attr("data-user-name");
        that.session.nice_name = $(this).text();
    });
    $(this.selectors.target).find("#css_payload_session_data > #css_payload_user_role_data").each(function () {
        var role_id = $(this).attr("data-role-id");
        that.session.roles[role_id] = $(this).text();
    });
    if (this.session.chameleon) {
        $("#css_cham_out").removeClass("css_hide");
    } else if (this.session.roles.sysmgr) {
        $("#css_cham_in" ).removeClass("css_hide");
        $("#css_cham_in > input").change(function () {
            window.location = "dyn/?mode=chameleonIn&mimic_user_id=" + $(this).val();
        });
    }
    if (that.session && that.session.server_purpose && that.session.server_purpose.indexOf("prod") !== 0) {
        $('div#css_content').addClass("css_test");
    }
    if (this.session.is_guest && this.session.user_id !== x.ui.main.default_guest_id) {
        this.logout();
    }
};


x.ui.moveMessageMarkup = function () {
   var that = this;
    // $(this.selectors.target).find("#css_payload_messages > div").each(function (msg) {
        // that.reportMessage({ type: $(this).attr("data-msg-type"), text: $(this).html() });
    // });
    // this.reportMessageHTML();

    $(this.selectors.target).find("#css_payload_messages > div").each(function () {
        var msg_type = $(this).attr("data-msg-type"),
            new_parent = that.getMessageTypeBox(msg_type);

        that.setHighestMsgLevel(msg_type);
        that.debug("server message: " + msg_type + ", " + $(this).text());
        $(new_parent).append(this);
    });

};

x.ui.movePageMarkup = function () {
    var that = this;
    $(this.selectors.target).find("#css_payload_page_details").each(function () {
        that.page_id      = $(this).attr("data-page-id");
        that.page_skin    = $(this).attr("data-page-skin");
        that.area_id      = $(this).attr("data-area-id");
        that.challenge_token = $(this).attr("data-challenge-token");
        that.prompt_message  = $(this).attr("data-prompt-message");
        that.setTitle(      $(this).attr("data-page-title"));
        that.setDescription($(this).attr("data-page-description"));
        that.setNavLinks(   $(this).attr("data-search-page"),
                            $(this).attr("data-prev-key"),
                            $(this).attr("data-next-key"));
    });
    that.setLinks  ($(this.selectors.target).find("#css_payload_page_links   > *"));
    that.setTabs   ($(this.selectors.target).find("#css_payload_page_tabs    > *"));
    that.setButtons($(this.selectors.target).find("#css_payload_page_buttons > *"));
};

x.ui.moveTaskMarkup = function () {
    $(this.selectors.target).find("#css_payload_tasks > div").each(function () {
        var module_id = $(this).attr("id"),
            target_node = $("ul#css_menu_container li.css_menu_area_" + module_id + " > ul.dropdown-menu");

        if (target_node.length > 0) {
            $(this).children("li").detach().appendTo(target_node);
//                    target_node.parent().addClass("css_cntr_tasks");
        }
    });

    $("ul#css_menu_container > li").each(function () {
        var tasks_underdue = $(this).find("ul > li.css_task"        ).length,
            tasks_overdue  = $(this).find("ul > li.css_task_overdue").length;

        if (tasks_overdue > 0) {
            $(this).children("a").append(" <span class='badge badge-important' title='Overdue workflow tasks assigned to you'>" + tasks_overdue  + "</span>");
        }
        if (tasks_underdue > 0) {
            $(this).children("a").append(" <span class='badge badge-info' title='Workflow tasks assigned to you that are not yet overdue'>" + tasks_underdue + "</span>");
        }
    });
};

x.ui.listColumnChooser = function (span) {
    $(span).parent().children("div.css_list_choose_cols").toggleClass("css_hide");
};

x.ui.filterColumnButtons = function (button_container, filter_text) {
    var pattern = new RegExp(filter_text, "i");

    button_container.children("button").each(function () {
        if (pattern.test($(this).text())) {
            $(this).removeClass("css_hide");
        } else {
            $(this).   addClass("css_hide");
        }
    });

    //Join Button Group
    button_container.children("div.btn-group").each(function () {
        var button = $($(this).children("button")[0]);
        if (pattern.test(button.text())) {
            $(this).removeClass("css_hide");
        } else {
            $(this).   addClass("css_hide");
        }
    });
};

$(document).on("keyup", ".css_list_cols_filter > :input", function () {
    x.ui.filterColumnButtons($(this).parent().parent(), $(this).val());
});


//--------------------------------------------------------- dynamic load resources ---------------------------------------------
x.ui.checkScript = function (src) {
    var that = this;
    if (this.script_loaded[src] === undefined) {
        $.ajax({ url: src, dataType: "script", cache: true, async: false, type: "GET",
            // No beforeSend IOS6 fix
            error: function(XHR, descr, exception) {
                that.reportMessage({ type: 'E' , text: exception + " trying to get " + src });
                that.script_loaded[src] = false;
            },
            success: function() {
                that.script_loaded[src] = true;
            }
        });
    }
};

x.ui.checkStyle = function (src) {
    var style;
    if (this.script_loaded[src] === undefined) {
        style = document.createElement("link");
        style.setAttribute("rel" , "stylesheet");
        style.setAttribute("type", "text/css");
        style.setAttribute("href", src);
        if (style !== undefined) {
            document.getElementsByTagName("head")[0].appendChild(style);
            this.script_loaded[src] = true;
        }
    }
};

x.ui.unisrch = function (selector) {
    var that = this,
        map;

    $(selector).typeahead({
        minLength: 2,        // min chars typed to trigger typeahead
        source: function (query, process) {
            $.get("dyn/?mode=unisrch&q=" + query, function (data) {
                var inp = data.split("\n"),
                    out = [],
                    res,
                    str,
                    i;
                map = {};
                for (i = 0; i < inp.length; i += 1) {
                    if (inp[i]) {
                        res = inp[i].split("|");
                        if (res.length > 3) {
                            str = res[3] + " [" + res[0] + "] " + res[1];
                            map[str] = "?page_id=" + res[2] + "&page_key=" + res[0];
                            out.push(str);
                        }
                    }
                }
                process(out);
            });
        },
        updater: function (item) {
            if (map[item]) {
                that.redirect(map[item]);
            }
        }
    });
};

x.ui.updateDate = function (selector) {
    var that = this;
    x.ui.checkScript("/cdn/mattkruse.com/date.js");
    $(selector).text(formatDate(new Date(), "E d NNN yyyy HH:mm:ss"));
    setTimeout(function () { that.updateDate(selector); }, 1000);
};

x.ui.setCopyrightMsg = function (selector) {
    $(selector).html("&#169; 2009-"+String((new Date()).getFullYear()).slice(-2)
        +" Rullion Solutions Ltd");
};




//--------------------------------------------------------- x.ui.main ----------------------------------------------------------
x.ui.main = x.ui.clone("x.ui.main");


x.ui.main.bindToHTML = function (skin, default_page, selectors) {
    x.ui.bindToHTML.call(this, skin, default_page, selectors);
    this.unisrch(this.selectors.unisrch);
    this.updateDate(this.selectors.datetime);
    this.setCopyrightMsg(this.selectors.copyright);
};

x.ui.main.setURL = function (url) {
    url = url.substr(url.indexOf("?") + 1);
    this.debug("setURL(): " + url);
    $("a#css_page_print")
        .removeClass("css_hide")
        .attr("href", "dyn/?reload_opt_open_new_window=true&mode=renderPrint&" + url);
    $("a#css_page_excel")
        .removeClass("css_hide")
        .attr("href", "dyn/?reload_opt_open_new_window=true&mode=renderExcel&" + url);
    $("a#css_page_pdf")
        .removeClass("css_hide")
        .attr("href", "dyn/?reload_opt_open_new_window=true&mode=renderPDF&"   + url);
};

x.ui.main.setTitle = function (title) {
    $("span.css_page_header_title").html(title);
    document.title = title;
};

x.ui.main.setDescription = function (descr) {
    if (descr) {
        $("p.css_page_header_descr").text(descr);
        $("p.css_page_header_descr").removeClass("css_hide");
    } else {
        $("p.css_page_header_descr").   addClass("css_hide");
    }
};

x.ui.main.setTabs = function (data) {
    // var that = this;
    $("ul.css_page_tabs").html(data);
    if ($("ul.css_page_tabs > li").length > 0) {        // at least one tab shown...
        $("ul.css_page_tabs").removeClass("css_hide");
        $("div#css_body").addClass("css_body_tabs_above");
    }
    // $("ul#css_page_tabs > li").click(function (event) {
    //     that.load({ page_tab: $(event.currentTarget).attr("id") });
    // });
};

x.ui.main.setNavLinks = function (search_page, prev_key, next_key) {
    if (search_page) {
        $("#css_nav_search")
            .removeClass("css_hide")
            .attr("href", "?page_id=" + search_page);
    }
    if (prev_key) {
        $("#css_nav_prev")
            .removeClass("css_hide")
            .attr("href", "?page_id=" + this.page_id + "&page_key=" + prev_key);
    }
    if (next_key) {
        $("#css_nav_next")
            .removeClass("css_hide")
            .attr("href", "?page_id=" + this.page_id + "&page_key=" + next_key);
    }
};

x.ui.main.getScrollElement = function () {
    return window;
};



//--------------------------------------------------------- x.ui.modal ---------------------------------------------------------
x.ui.modal = x.ui.clone("x.ui.modal");


x.ui.modal.setTitle = function (title) {
    $("#css_modal #css_modal_title").html(title);
};


x.ui.modal.open = function (closeable) {
    // $("#css_modal .modal-header > h3").html("Loading...");
    // $("#css_modal .modal-messages"   ).empty();
    // $("#css_modal .modal-body"       ).html("");
    if (closeable) {
        $("#css_modal .modal-header > button").removeClass("css_hide");
    } else {
        $("#css_modal .modal-header > button").   addClass("css_hide");
    }
    $("#css_modal").modal({ show: true, backdrop: (closeable || "static"), keyboard: closeable });
};

x.ui.modal.close = function () {
    $("#css_modal").modal('hide');
};

x.ui.modal.setSize = function (size) {
    if (size !== "lg" && size !== "md" && size !== "sm") {
        throw new Error("invalid size: " + size);
    }
    $("#css_modal").removeClass("modal-lg");
    $("#css_modal").removeClass("modal-sm");
    if (size !== "md") {
        $("#css_modal").addClass("modal-" + size);
    }
    // TB3...
    // $("#css_modal .modal-dialog").removeClass("modal-lg");
    // $("#css_modal .modal-dialog").removeClass("modal-sm");
    // if (size !== "md") {
    //     $("#css_modal .modal-dialog").addClass("modal-" + size);
    // }
};



//--------------------------------------------------------- menu ---------------------------------------------------------------
x.ui.loadMenu = function () {
    var that = this,
        elmt_container = $("#css_menu_container");

    this.debug("loadMenu(); session: " + this.session + ", length(elmt_container): " + elmt_container.length);
    if (!this.session || this.session.is_guest || elmt_container.length === 0) {
        return;
    }
    $.ajax({
        type: "GET", dataType: "html", url: "dyn/?mode=menu&session=" + this.session.id, cache: true,    // cache to the session
        // No IOS6 fix
        success: function (data) {
            that.debug("menu returned");
            elmt_container.empty();
            elmt_container.append(data);
            elmt_container.children().children().unwrap();

            that.moveTaskMarkup();
            // if (y.page.area) {
            //     $("li.css_menu_area_" + y.page.area).addClass("active");
            // }
            // if (y.page.id) {
            //     $("li.css_menu_page_" + y.page.id  ).addClass("active");
            // }

            // y.checkScript("/cdn/jquery.shortcuts/jquery.shortcuts.min.js");    //http://www.stepanreznikov.com/js-shortcuts/
            // Ctrl+M highlights the first menu item - Better shortcut?
            // $.Shortcuts.add({
            //     type: 'down', mask: 'Ctrl+M',
            //     handler: function () {
            //         $("div#css_menu_replace > ul.nav > li:first > a").focus();
            //     }
            // });
            // $.Shortcuts.start();
        },
        error: function (xml_http_request, text_status) {
            that.reportMessage({ type: 'E', text: "[" + xml_http_request.status + "] " + xml_http_request.statusText });
        }
    });
};

x.ui.modal.loadMenu = function () {
    return undefined;
};

x.ui.openHelp = function () {
    var article = this.session && (this.session.help_article || (!this.session.is_guest && "help_other"));
    article = article || "help_guest";
    window.open("guest.html?page_id=pb_article_show&page_key=" + article);
};


//--------------------------------------------------------- login --------------------------------------------------------------
x.ui.guestLogin = function (guest_id, params, reload_opts) {
    var that = this;
    if (this.reload_count > 2) {
        this.reportMessage({ type: 'E', text: "Sorry, this device is not currently supported" });
        return;
    }
    $.ajax({ url: "dyn/?mode=guestLogin&guest_id=" + guest_id, type: "POST", timeout: x.server_timeout, cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
            if (data_back.session && data_back.session.user_id === guest_id) {
                that.reload_count += 1;
//                if(top !== self && document.cookie.indexOf(data_back.jsessionid) === -1){
//                    x.jsessionid = data_back.jsessionid;
//                }
                that.active = true;
                that.reload(params, reload_opts);
            }
        }
    });
};


x.ui.promptLogin = function (params) {
    var that = this;
    $.ajax({ url: "login/?mode=login", type: "GET", cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data) {
            if (typeof data === "object" && data.action === "normal_login") {           //
                x.ui.main.redirect(window.location.search, { force_load: true });          // force full page load
            } else {
                x.ui.main.setTitle("Log-in");
                that.setTitle("Log-in");
                that.setLoadContent(data);
                that.open(false);         // not closeable
                that.setSize("sm");
                that.activate();
            }
        },
        error: function (xml_http_request, text_status) {
            that.clearMessages();
            that.reportMessage({ type: 'E', text: "Server not responding at promptLogin - " + text_status + "<br/>" + xml_http_request.responseText });
            that.activate();
        }
    });
};

// Function needs re-factoring...
x.ui.login = function () {
    var params;
    if (!this.active) {
        return;
    }

    this.reload_count  += 1;
    this.post_login_url = window.location.search;
    this.deactivate();
    params = this.getLoginParameters();
    if (params) {                       // params undefined if not all provided
        this.loginPhaseOne(params);
    } else {
        this.activate();
    }
};

x.ui.getLoginParameters = function () {
    var params = this.collectControlParams($(this.selectors.content));

    if (!params.j_username || !params.j_password) {
        this.clearMessages();
        this.reportMessage({ type: this.reload_count === 1 ? 'I' : 'E', text: "Please enter a user id and password" });
        return;
    }
    return params;
};

x.ui.loginPhaseOne = function (params) {
    var that = this;
    $.ajax({ url: "login/?mode=login", type: "POST", data: $.param(params), cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function(data_back) {
            that.loginPhaseTwo(params, data_back);
        }, error: function (xml_http_request, text_status) {
            that.clearMessages();
            that.reportMessage({ type: 'E', text: "Server not responding at loginPhaseOne - " + text_status + "<br/>" + xml_http_request.responseText });
            that.activate();
        }
    });
};


x.ui.loginPhaseTwo = function (params, data) {
//    var that = this;
    if (typeof data === "object" && data.action === "normal_login") {
        x.ui.main.redirect(this.post_login_url, { force_load: true });          // force full page load
    } else {
        this.loginPhaseThree(params, data);
    }
};

x.ui.loginPhaseThree = function (params, data) {
    var that = this;
    $.ajax({ url: "j_security_check", type: "POST", data: $.param(params),
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back, text_status, xml_http_request) {
           that.loginPhaseFour(params, data_back);
        }, error: function (xml_http_request, text_status) {
            that.clearMessages();
            that.reportMessage({ type: 'E', text: "Server not responding at loginPhaseThree - " + text_status + "<br/>" + xml_http_request.responseText });
            that.activate();
        }
    });
};

x.ui.loginPhaseFour = function (params, data) {
    if (typeof data === "object" && data.action === "normal_login") {
        x.ui.main.redirect(this.post_login_url, { force_load: true });          // force full page load
    } else {
        // what circumstances bring us here?
        this.reload_count  += 1;
        this.clearMessages();
        this.reportMessage({ type: 'E', text: "Invalid user id and password" });
        this.promptLogin(params);
    }
};


//--------------------------------------------------------- logout -------------------------------------------------------------
x.ui.logout = function () {
    var that = this;
    if (this.prompt_message && !confirm(this.prompt_message)) {
        return;
    }
    this.deactivate();
    this.prompt_message = null;
    //CL - GET doesn't work in IE
    $.ajax({ url: "dyn/?mode=logout", type: "POST",
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back, text_status, xml_http_request) {
            that.redirect(that.skin, { force_load: true });
        }
    });
};


/*
 *                                                                                                                            *
 *                                                                                                                            *
 *     jQuery Event Bindings                                                                                                  *
 *                                                                                                                            *
 *                                                                                                                            *
 *                                                                                                                            *
 */

/*
$(window).bind("beforeunload", function (a, b, c, d) {
    if (!x.ui.main.expecting_unload && x.ui.main.session.logged_in) {
        return x.ui.main.unload_message || "You are navigating away from the application, which will log you out";
    }
});
*/

// Button clicks, col heading clicks
$(document).on("click", ".css_cmd", function (event) {
    var confirm_text = $(this).data("confirm-text");
    if (confirm_text) {
        if (!confirm(confirm_text)) {
            return;
        }
    }
    if (!this.onclick) {         // imgs don't have hrefs
        x.ui.getLocal(this).reload({ page_button: $(this).attr("id") });
    }
});

// Row clicks
$(document).on("click", "[url]", function (event) {
    // Avoid redirecting if clicked an anchor or button...
    if ($(event.target).is("a")    || $(event.target).parents("a")   .length > 0) {
        return;
    }
    if ($(event.target).is(".btn") || $(event.target).parents(".btn").length > 0) {
        return;
    }

    x.ui.getLocal(this).redirectAttribute(this, "url");
});

// Anchor clicks
$(document).on("click", "a[href]", function (event) {
    x.ui.getLocal(this).redirectAttribute(this, "href");
    return false;
});

// Tab clicks
$(document).on("click", "ul.css_page_tabs > li", function (event) {
    x.ui.getLocal(this).reload({ page_tab: $(this).attr("id") });
});

/*---------------------submit on enter key if .css_button_main specified - deactivated for the moment---------------------------*/
$(document).on("keyup", function (event) {
    var node = event.target || event.srcElement,
        ui = x.ui.getLocal(this),
        button;

//    ui.last_key_pressed = event.keyCode;
    if (event.keyCode === 13) {                     // enter key pressed
        if (node && ($(node).attr("type") === "text" || $(node).attr("type") === "password")) {
            button = $(this).parents("form").find(".css_button_main");
            if (button.length === 0) {
                button = $(".css_button_main");
            }
            if (button.length > 0) {
                button.click();
            }
        }
        event.preventDefault();                         // prevent accidental press of logout, etc, in IE
    }
    return false;
});


$(document).on("keydown", "div.css_edit > input", function (event) {
    if (event.which === 13) {
        event.preventDefault();
    }
});




//--------------------------------------------------------- multi-row selection --------------------------------------------------
$(document).on("mousedown", "td.css_mr_sel"  , function(event) {
    var ui = x.ui.getLocal(this);
    ui.multiselect_table = $(this).parent("tr").parent("tbody").parent("table");
    ui.mouse_deselect    = $(this).parent("tr").hasClass("css_mr_selected");
    ui.mouseoverRow($(this).parent());
    return false;
});

$(document).on("mouseover", "td.css_mr_sel"  , function(event) {
    var ui = x.ui.getLocal(this);
    if (ui.multiselect_table) {
        ui.mouseoverRow($(this).parent());
    }
});

$(document).on("mouseup",                      function(event) {
    var ui = x.ui.getLocal(this),
        slct_elem;

    if (!ui.multiselect_table) {
        return;
    }
    slct_elem = ui.multiselect_table.find("tr.css_mr_actions > td > input");
    if (JSON.parse(slct_elem.val() || "[]").length > 0) {
        ui.multiselect_table   .addClass("css_mr_selecting");
        ui.multiselect_table.find("tr.css_mr_actions > td > a.btn").removeClass("disabled");
    } else {
        ui.multiselect_table.removeClass("css_mr_selecting");
        ui.multiselect_table.find("tr.css_mr_actions > td > a.btn").   addClass("disabled");
    }
    ui.multiselect_table = null;
});

$(document).on("click", "td.css_mr_sel"     , function (event) {
    return false;
});

x.ui.mouseoverRow = function (row) {
    var slct_elem = this.multiselect_table.find("tr.css_mr_actions > td > input"),
        array = JSON.parse(slct_elem.val() || "[]"),
        key = row.attr("data-key");

    if (this.mouse_deselect) {
        row.removeClass("css_mr_selected");
        if (array.indexOf(key) > -1) {
            array.splice(array.indexOf(key), 1);
            slct_elem.val(JSON.stringify(array));
        }

    } else {
        row   .addClass("css_mr_selected");
        if (array.indexOf(key) === -1) {
            array.push(key);
            slct_elem.val(JSON.stringify(array));
        }
    }
};



//--------------------------------------------------------- charts -------------------------------------------------------------
$(document).on("activateUI", function (event) {
    $(this).find(".css_section_Chart").each(function () {
        x.ui.getLocal(this).activateChart.call($(this));
    });
});

x.ui.activateChart = function () {
    var json = $(this).find("span.css_hide").html(),
        obj  = $.parseJSON(json),
        new_obj,
        enable_regression = false,
        i;

    if (obj.library === "flot") {
        x.ui.checkScript("/cdn/jquery.flot/jquery.flot.min.js");
        x.ui.checkScript("/cdn/jquery.flot/jquery.flot.stack.min.js");
        $(this).find("div.css_chart").css("width" , obj.options.width  || "900px");
        $(this).find("div.css_chart").css("height", obj.options.height || "400px");
        $.plot($(this).find("div.css_chart"), obj.series, obj.options);
    } else if (obj.library === "highcharts") {
        x.ui.checkScript("/cdn/highcharts-3.0.10/highcharts.js");
        x.ui.checkScript("/cdn/highcharts-3.0.10/highcharts-more.js");
        x.ui.checkScript("/cdn/highcharts-3.0.10/exporting.js");
        x.ui.checkScript("highcharts_defaults.js");
        new_obj = obj.options;
        new_obj.series = obj.series;
        for (i = 0; i < new_obj.series.length; i += 1) {
            if (!enable_regression && new_obj.series[i].regression) {
                enable_regression = true;
            }
            new_obj.series[i].events = { click: this.pointClickHandler };
        }
        new_obj.chart.renderTo = "css_chart_" + $(this).attr("id");

        if (enable_regression) {
            x.ui.debug(enable_regression);
            x.ui.checkScript("/cdn/highcharts-3.0.10/highcharts-regression.js");
        }
        obj = new Highcharts.Chart(new_obj);
    //} else if (obj.library === "google") {
    }
};

x.ui.pointClickHandler = function (event2) {
    if (event2.point && event2.point.url) {
        x.ui.main.redirect(event2.point.url.replace(/&amp;/g, "&"));
    }
};


$(document).on("activateUI", function (event) {
    $(this).find(".css_section_DotGraph").each(function () {
        var elem = $(this).children("div.css_diagram"),
            text = elem.text();

        x.ui.getLocal(this).checkScript("/cdn/viz/viz.js");
        /*jslint newcap: true */
        elem.html(Viz(text, "svg"));
    });
});


//--------------------------------------------------------- search filters -------------------------------------------------------
$(document).on("activateUI", function (event) {
    $(this).find("table.css_search_filters tr").each(function () {
        var tr_elem    = $(this),
            oper_field = tr_elem.find(".css_filter_oper :input"),
            json_str   = tr_elem.find(".css_filter_val .css_render_data").eq(0).text(),
            json_obj   = (json_str && JSON.parse(json_str));

        function adjustOperator(input) {
            if ($(input).val()) {
                if (oper_field.val() === "" && json_obj && json_obj.auto_search_oper) {
                    oper_field.val(json_obj.auto_search_oper);
                }
            } else {
                oper_field.val("");
            }
            adjustBetween();
        }
        function adjustBetween() {
            if (json_obj && oper_field.val() === json_obj.extd_filter_oper) {
                tr_elem.find(".css_filter_val > :gt(0)").removeClass("css_hide");
            } else {
                tr_elem.find(".css_filter_val > :gt(0)").   addClass("css_hide");
            }
        }
        if (tr_elem.attr("data-advanced-mode") === "false") {
            tr_elem.find(".css_filter_oper :input").attr("disabled", "disabled");
        }
        tr_elem.find(".css_filter_val  :input").change( function () { adjustOperator(this); });
        tr_elem.find(".css_filter_oper :input").change( function () { adjustBetween(); });
        adjustBetween();
    });
});

//To show up in Chrome debugger...
//@ sourceURL=style/ui.js