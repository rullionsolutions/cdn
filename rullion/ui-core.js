/*jslint browser: true */
/*global $, window, console, confirm, formatDate, Highcharts */

var x = {};

x.ui = {
    id: "x.ui",
    active: true,
    default_page: "home",
    arrow_entity: "&#10148;",
    reload_count:  0,
    script_loaded: [],
    time_stamps : {}
};


x.ui.clone = function (id) {
    "use strict";
    var obj = Object.create(this);
    obj.id  = id;
    return obj;
};

x.ui.bindToHTML = function (skin, default_page, selectors) {
    "use strict";
    this.skin         = skin;
    this.default_page = default_page;
    this.selectors    = selectors;
    this.checkSelector("target");
    this.checkSelector("title");
    this.checkSelector("descr");
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
    "use strict";
    var count = $(this.selectors[selector]).length;
    if (typeof this.selectors[selector] === "string" && count !== 1) {
        throw new Error(this.id + ", invalid selector: " + selector + ", elements found: " + count);
    }
};

x.ui.debug = function (msg) {
    "use strict";
    console.log("DEBUG: " + this.id + ", " + msg);
};

x.ui.setURL = function (/*url*/) {
    "use strict";
    this.debug("ignoring setURL()");
};

x.ui.setTitle = function (title) {
    "use strict";
    $(this.selectors.title).html(title);
    document.title = title;
};

x.ui.setDescription = function (descr) {
    "use strict";
    if (this.selectors.descr) {
        if (descr) {
            $(this.selectors.descr).text(descr);
            $(this.selectors.descr).removeClass("css_hide");
        } else {
            $(this.selectors.descr).   addClass("css_hide");
        }
    }
};

x.ui.setContent = function (data) {
    "use strict";
    $(this.selectors.content).html(data);
};

x.ui.setLoadContent = function (data) {
    "use strict";
    this.setContent(data);
};

x.ui.setTabs = function (/*tabs*/) {
    "use strict";
    this.debug("ignoring setTabs()");
};

x.ui.setLinks = function (data) {
    "use strict";
    $(this.selectors.links).html(data);
};

x.ui.setButtons = function (data) {
    "use strict";
    $(this.selectors.buttons).html(data);
};

x.ui.setNavLinks = function (/*search_page, prev_key, next_key*/) {
    "use strict";
    this.debug("ignoring setNavLinks()");
};

x.ui.setMessages = function (messages) {
    "use strict";
    var i;
    this.clearMessages();
    for (i = 0; messages && i < messages.length; i += 1) {
        this.reportMessage(messages[i]);
    }
};

x.ui.clearMessages = function () {
    "use strict";
    $(this.selectors.messages).empty();
    this.highest_msg_level = "";
};

x.ui.setHighestMsgLevel = function (msg_type) {
    "use strict";
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
    "use strict";
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
    "use strict";
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
    "use strict";
    var css_class = this.getMessageClass(msg_type),
        elmt = $(this.selectors.messages).children("." + css_class);

    if (elmt.length === 0) {
        $(this.selectors.messages).append("<div class='alert " + css_class + "'></div>");
        elmt = $(this.selectors.messages).children("." + css_class);
    }
    return elmt;
};

x.ui.reportMessageHTML = function (html) {
    "use strict";
    var that = this;
    $(this.selectors.messages).append(html);
    $(this.selectors.messages).children().each(function () {
        var msg_type = $(this).attr("data-msg-type");
        that.setHighestMsgLevel(msg_type);
        $(this).addClass("alert " + that.getMessageClass(msg_type));
    });
};

x.ui.decomposeURL = function (url) {
    "use strict";
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
    "use strict";
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
    "use strict";
    var started_query = (!url || (url.indexOf("?") > -1));
    return (started_query ? "&" : "?") + param_id + "=" + encodeURIComponent(param_val);
};

x.ui.joinParams = function (obj) {
    "use strict";
    var str = "",
        keys = Object.keys(obj),
        i,
        delim = "";

    for (i = 0; i < keys.length; i += 1) {
        str += delim + keys[i] + "=" + encodeURIComponent(obj[keys[i]]);
        delim = "&";
    }
    return str;
};

x.ui.simpleURLParams = function (obj) {
    "use strict";
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
    "use strict";
    return (!skin || skin === this.skin) &&
           (page_id  === this.page_id) &&
           (page_key === this.page_key || (!page_key && !this.page_key));
};

x.ui.getLocal = function (elem) {
    "use strict";
    var target = elem && $(elem).parents(".css_load_target").first();
    if (target && target.length > 0) {
        return target.data("ui");
    }
    return x.ui.main;
};

x.ui.open = function (/*closeable*/) {
    "use strict";
    this.debug("ignoring open()");
};

x.ui.close = function () {
    "use strict";
    this.debug("ignoring close()");
};

x.ui.load = function (query_string, reload_opts) {
    "use strict";
    var params = this.splitParams(query_string);
    reload_opts = reload_opts || {};
    params.page_id = params.page_id || this.default_page;
    this.page_id  = params.page_id;
    this.page_key = params.page_key;
    this.debug("load(" + query_string + "); skin: " + this.skin + ", page_id: " + this.page_id + ", page_key: " + this.page_key);
    query_string = this.joinParams(this.simpleURLParams(this));
    this.setURL(query_string);
    this.open(reload_opts.closeable);
    this.performAjaxPost(params, reload_opts);
};

x.ui.reload = function (override_params, reload_opts) {
    "use strict";
    var params = this.collectControlParams(this.selectors.content),
        keys = Object.keys(override_params),
        i;

    reload_opts = reload_opts || {};
    this.reload_count += 1;
    for (i = 0; i < keys.length; i += 1) {
        params[keys[i]] = override_params[keys[i]];
    }
    params.page_id  = params.page_id  || this.page_id;
    params.page_key = params.page_key || this.page_key;
    if (!params.page_key) {
        delete params.page_key;
    }
    this.performAjaxPost(params, reload_opts);
};

x.ui.redirectAttribute = function (elmt, attr_id) {
    "use strict";
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
    "use strict";
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
    if (url_parts.skin === "modal" || url_parts.skin === "context.html") {
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
    "use strict";
    var keys = Object.keys(url_parts.params),
        i,
        changing_simple_url = url_parts.params &&
            !this.sameSimpleURL(url_parts.skin, url_parts.params.page_id, url_parts.params.page_key);

    for (i = 0; i < keys.length; i += 1) {
        if (keys[i].indexOf("reload_opt") === 0) {
            reload_opts[keys[i].substr(11)] = url_parts.params[keys[i]];
        }
    }
    if (typeof reload_opts.open_new_window !== "boolean" && url_parts.protocol === "mailto") {
        reload_opts.open_new_window = true;
    }
    if (typeof reload_opts.force_load      !== "boolean" && changing_simple_url) {
        reload_opts.force_load = true;
    }
};


x.ui.performAjaxPost = function (params, reload_opts) {
    "use strict";
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

    this.time_stamps.pre_post = new Date();
    this.debug("performAjaxPost(" + params.page_id + ":" + params.page_key + ")");
    $.ajax({ url: "jsp/main.jsp?mode=post", type: "POST", data: $.param(params),
        //CL-Blanking this request header allows IOS6 Safari and Chrome 24+ to work (May benefit other webkit based browsers)
        //These headers were also blanked when this fix was initially added - Authorization, If-None-Match
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back /*, text_status, xml_http_request*/) {
            that.performAjaxPostSuccess(data_back, params, reload_opts);
        },
        error: function (xml_http_request /*, text_status*/) {
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

x.ui.performAjaxPostSuccess = function (data_back, params, reload_opts) {
    "use strict";
    this.page    = data_back.page;
    this.session = data_back.session;

    if (data_back.logged_out) {
        this.prompt_message = null;
        if (this.default_guest_id) {
            this.guestLogin(this.default_guest_id, params, reload_opts);
        } else {
            x.ui.modal.promptLogin(params);
        }

    } else if (this.session.is_guest && this.session.user_id !== this.default_guest_id) {
        this.logout();         // invalidates current session then redirects

    } else if (this.page.redirect_url || (this.page.skin && this.page.skin !== this.skin)) {
        if (this.page.redirect_new_window) {
            reload_opts.open_new_window = true;
        }
        this.debug("redirecting, redirect: " + this.page.redirect_url + ", page.skin: " + this.page.skin + ", this.skin: " + this.skin);
        this.redirect(this.page.redirect_url, reload_opts);        // TODO close if modal?

    } else {
        this.setTitle(this.page.title);
        this.setDescription(this.page.description);
        this.setNavLinks(this.page.entity_search_page, this.page.nav_prev_key, this.page.nav_next_key);
        this.setTabs(this.page.tabs);
        this.setLinks(this.page.links);
        this.setMessages(this.session.messages);
        this.performAjaxRender(params, reload_opts);
    }
};


x.ui.performAjaxRender = function (params /*, reload_opts*/) {
    "use strict";
    var that = this,
        url = "jsp/main.jsp?mode=render&page_id=" + params.page_id;

    if (params.page_key) {
        url += "&page_key=" + params.page_key;
    }
    this.time_stamps.pre_render = new Date();
    $.ajax( { url: url, type: "GET", timeout: (this.page && this.page.browser_timeout) || this.server_timeout,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back /*, text_status, xml_http_request*/) {
            that.time_stamps.post_render = new Date();
            that.setLoadContent(data_back);
            that.activate();
            // that.performAjaxRenderSuccess(data_back);
        },
        error: function (xml_http_request, text_status) {
            that.performAjaxError(xml_http_request, text_status);
        }
    });
};


x.ui.getScrollElement = function () {
    "use strict";
    return this.selectors.content;
};

x.ui.activate = function () {
    "use strict";
    // var that = this;
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
    "use strict";
    this.active = false;
    $(this.selectors.target).   addClass("css_inactive");
    $(this.selectors.target).css("cursor", "progress");
    $(this.selectors.target).find(":input:enabled").each(function () {
        $(this).addClass("css_was_enabled");
        $(this).attr("disabled", "disabled");
    });
};

x.ui.collectControlParams = function (target_selector) {
    "use strict";
    var params = {};
    params.challenge_token = (this.page && this.page.challenge_token);
    $(target_selector).find(".css_edit").each(function () {
        var field = x.field.getFieldObject(this);
        params[field.control_id] = field.getValue();
    });
    return params;
};


//--------------------------------------------------------- dynamic load resources ---------------------------------------------
x.ui.checkScript = function (src) {
    "use strict";
    var that = this;
    if (this.script_loaded[src] === undefined) {
        $.ajax({ url: src, dataType: "script", cache: true, async: false, type: "GET",
            // No beforeSend IOS6 fix
            error: function(xml_http_request, descr, exception) {
                that.reportMessage({ type: 'E' , text: exception + " trying to get " + src });
                that.debug(xml_http_request + ", " + descr);
                that.script_loaded[src] = false;
            },
            success: function() {
                that.script_loaded[src] = true;
            }
        });
    }
};

x.ui.checkStyle = function (src) {
    "use strict";
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


//--------------------------------------------------------- x.ui.main ----------------------------------------------------------
x.ui.main = x.ui.clone("x.ui.main");


x.ui.main.bindToHTML = function (skin, default_page, selectors) {
    "use strict";
    x.ui.bindToHTML.call(this, skin, default_page, selectors);
    if (this.selectors.unisrch) {
        this.unisrch(this.selectors.unisrch);
    }
    if (this.selectors.datetime) {
        this.updateDate(this.selectors.datetime);
    }
    if (this.selectors.copyright) {
        this.setCopyrightMsg(this.selectors.copyright);
    }
};

x.ui.main.setURL = function (url) {
    "use strict";
    url = url.substr(url.indexOf("?") + 1);
    this.debug("setURL(): " + url);
    $("a#css_page_print")
        .removeClass("css_hide")
        .attr("href", "jsp/main.jsp?reload_opt_open_new_window=true&mode=renderPrint&" + url);
    $("a#css_page_excel")
        .removeClass("css_hide")
        .attr("href", "jsp/main.jsp?reload_opt_open_new_window=true&mode=renderExcel&" + url);
    $("a#css_page_pdf")
        .removeClass("css_hide")
        .attr("href", "jsp/main.jsp?reload_opt_open_new_window=true&mode=renderPDF&"   + url);
};

x.ui.main.setTabs = function (tabs) {
    "use strict";
    var str = "",
        i;

    $(this.selectors.tabs).empty();
    for (i = 0; tabs && i < tabs.length; i += 1) {
        str = "<li id='" + tabs[i].id + "' role='presentation'";
        str += " onclick='x.ui.main.reload({ page_tab: \"" + tabs[i].id + "\" })'";
        if (tabs[i].id === this.page.page_tab) {
            str += " class='active'";
        }
        str += "><a>" + tabs[i].label + "</a></li>";
        $(this.selectors.tabs).append(str);
    }
    if (tabs && tabs.length > 0) {        // at least one tab shown...
        $("div#css_body").addClass("css_body_tabs_above");
        $(this.selectors.tabs).removeClass("css_hide");
    } else {
        $("div#css_body").removeClass("css_body_tabs_above");
        $(this.selectors.tabs).addClass("css_hide");
    }
};

x.ui.main.setLinks = function (links) {
    "use strict";
    var str = "",
        i;

    $(this.selectors.links).empty();
    for (i = 0; links && i < links.length; i += 1) {
        str = "<a class='btn btn-primary";
        if (links[i].open_in_modal) {
            str += " css_open_in_modal";
        }
        str += "' id='" + links[i].id + "' href='" + links[i].url + "'";
        if (links[i].target) {
            str += " target='" + links[i].target + "'";
        }
        if (links[i].task_info) {
            str += " title='Task for " + links[i].task_info.assigned_user_name;
            if (links[i].task_info.due_date) {
                str += " due on " + links[i].task_info.due_date;
            }
            str += "'";
        }
        str += ">" + links[i].label + " " + this.arrow_entity + "</a>";
        $(this.selectors.links).append(str);
    }
};

x.ui.main.setNavLinks = function (search_page, prev_key, next_key) {
    "use strict";
    if (search_page) {
        $("#css_nav_search")
            .removeClass("css_hide")
            .attr("href", "?page_id=" + search_page);
    } else {
        $("#css_nav_search").addClass("css_hide");
    }
    if (prev_key) {
        $("#css_nav_prev")
            .removeClass("css_hide")
            .attr("href", "?page_id=" + this.page_id + "&page_key=" + prev_key);
    } else {
        $("#css_nav_prev").addClass("css_hide");
    }
    if (next_key) {
        $("#css_nav_next")
            .removeClass("css_hide")
            .attr("href", "?page_id=" + this.page_id + "&page_key=" + next_key);
    } else {
        $("#css_nav_next").addClass("css_hide");
    }
};

x.ui.main.getScrollElement = function () {
    "use strict";
    return window;
};



//--------------------------------------------------------- x.ui.modal ---------------------------------------------------------
x.ui.modal = x.ui.clone("x.ui.modal");


x.ui.modal.open = function (closeable) {
    "use strict";
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
    "use strict";
    $("#css_modal").modal('hide');
};

x.ui.modal.setSize = function (size) {
    "use strict";
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

