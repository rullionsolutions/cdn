/* global window, document, $, console, confirm, setTimeout, formatDate, Highcharts, URI, google,
Viz */

"use strict";

var x = {};

x.ui = {
    id: "x.ui",
    active: true,
    default_page: "home",
    arrow_entity: "&#10148;",
    reload_count: 0,
    script_loaded: [],
    log_level: 2,       // debug
};


x.ui.clone = function (id) {
    var obj = Object.create(this);
    obj.id = id;
    return obj;
};

x.ui.bindToHTML = function (skin, default_page, selectors) {
    this.skin = skin;
    this.default_page = default_page;
    this.selectors = selectors;
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

    this.checkScript("/cdn/medialize/URI.js");
};

// each selector provided should reference exactly one element in the HTML
x.ui.checkSelector = function (selector) {
    var count = $(this.selectors[selector]).length;
    if (typeof this.selectors[selector] === "string" && count !== 1) {
        throw new Error(this.id + ", invalid selector: " + selector + ", elements found: " + count);
    }
};

x.ui.info = function (msg) {
    if (this.log_level <= 4) {
        console.log("INFO : " + this.id + ", " + msg);
    }
};

x.ui.debug = function (msg) {
    if (this.log_level <= 2) {
        console.log("DEBUG: " + this.id + ", " + msg);
    }
};

x.ui.trace = function (msg) {
    if (this.log_level <= 0) {
        console.log("TRACE: " + this.id + ", " + msg);
    }
};

x.ui.setURL = function () {
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
    this.moveTaskMarkup();
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


// ---------------------------------------------------------------------------- Messages
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
    // var text_parts;
    if (typeof msg.type !== "string") {
        msg.type = "E";
    }
    // if (!msg.title) {
    //     text_parts = this.splitTextIntoTitleAndRemainder(msg.text);
    //     msg.title = text_parts.title;
    //     msg.text = text_parts.remainder;
    // }
    this.setHighestMsgLevel(msg.type);
    msg.time = "";
    msg.icon = this.getMessageIcon(msg.type);
    msg.class_name = this.getMessageClass(msg.type);
    // msg.sticky = true;
    $.gritter.add(msg);
};

x.ui.getMessageClass = function (msg_type) {
    if (msg_type === "E") {
        return "bg-red";
    }
    if (msg_type === "W") {
        return "bg-orange";
    }
    if (msg_type === "I") {
        return "bg-green";
    }
    return "";
};

x.ui.getMessageTypeBox = function (msg_type) {
    var css_class = this.getMessageClass(msg_type);
    var elmt = $(this.selectors.messages).children("." + css_class);
    if (elmt.length === 0) {
        $(this.selectors.messages).append("<div class='alert " + css_class + "'></div>");
        elmt = $(this.selectors.messages).children("." + css_class);
    }
    return elmt;
};

x.ui.getMessageIcon = function (msg_type) {
    var icon;
    if (msg_type === "I") {
        icon = "fa fa-2x fa-smile-o";
    } else if (msg_type === "W") {
        icon = "fa fa-2x fa-meh-o";
    } else if (msg_type === "E") {
        icon = "fa fa-2x fa-frown-o";
    }
    return icon;
};


/*
x.ui.reportMessageHTML = function (html) {
    var that = this;
    $(this.selectors.messages).append(html);
    $(this.selectors.messages).children().each(function () {
        var msg_type = $(this).attr("data-msg-type");
        that.setHighestMsgLevel(msg_type);
        $(this).addClass("alert " + that.getMessageClass(msg_type));
    });
};
*/

// ---------------------------------------------------------------------------- Parameters
x.ui.splitParams = function (str) {
    var e;
    var a = /\+/g;  // Regex for replacing addition symbol with a space
    var r = /([^&=]+)=?([^&]*)/g;
    var d = function (s) { return decodeURIComponent(s.replace(a, " ")); };
    var q;
    var out = {};

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

x.ui.setThisURIParams = function () {
    var uri = URI(window.location.href);
    var params = this.splitParams(uri.fragment());
    this.uri_scheme = uri.scheme();
    this.uri_authority = uri.authority();
    this.uri_appname = uri.segment()[0];
    this.uri_skin = uri.filename();
    this.uri_page_id = params.page_id;
    this.uri_page_key = params.page_key;
};

x.ui.getURIFromParams = function (params) {
    var uri = URI(window.location.href);
    uri.filename(params.skin || this.skin || "index.html");
    delete params.skin;
    Object.keys(params).forEach(function (param) {
        if (!params[param]) {
            delete params[param];
        }
    });
    uri.fragment($.param(params));
    this.debug("getURIFromParams(" + JSON.stringify(params) + ") -> " + uri.href());
    return uri;
};

x.ui.isExternalURI = function (uri) {
    var scheme = uri.scheme();
    var authority = uri.authority();
    var app_name = uri.segment()[0];
    this.debug("isExternalURI(" + this.uri_scheme + " =? " + scheme + ", " + this.uri_authority + " =? "
        + authority + ", " + this.uri_appname + " =? " + app_name + ", " + uri);
    if (!uri.is("url")) {
        return true;
    }
    if (uri.is("relative")) {
        return false;
    }
    return ((scheme && scheme !== this.uri_scheme)
        || (authority && authority !== this.uri_authority)
        || (app_name && app_name !== this.uri_appname));
};

x.ui.sameSimpleURL = function (skin, page_id, page_key) {
    return (!skin || skin === this.skin)
           && (page_id === this.uri_page_id)
           && (page_key === this.uri_page_key || (!page_key && !this.uri_page_key));
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


// ------------------------------------------------------------------------------------- Navigation
window.onhashchange = function () {
    x.ui.main.hashChange();
};

x.ui.hashChange = function () {
    this.load(window.location.href);
};

x.ui.backwardCompatibilityQueryString = function () {
    var uri = URI(window.location.href);
    var query_string = uri.query();
    if (query_string) {
        uri.fragment(query_string);
        uri.query("");
        window.location.href = uri.href();
    }
};

x.ui.load = function (uri, reload_opts) {
    var params;
    if (typeof uri === "string") {
        uri = URI(uri);         // otherwise assume is this object already
    }
    this.info("load(" + uri + ", " + JSON.stringify(reload_opts) + ")");
    // this.setThisURIParams();
    if (this.isExternalURI(uri) || uri.pathname().indexOf("dyn/") === 0) {
        window.open(uri.href());
    }
    params = this.splitParams(uri.fragment());
    params.skin = uri.filename();
    reload_opts = reload_opts || {};
    // if (typeof reload_opts.open_new_window !== "boolean" && uri.protocol() === "mailto") {
    //     reload_opts.open_new_window = true;
    // }
    this.reload(params, reload_opts);
};

// Tab clicks
$(document).on("click", "ul.css_page_tabs > li", function (event) {
    x.ui.getLocal(this).reload({ page_tab: $(this).attr("id"), });
});

// Button clicks, col heading clicks
$(document).on("click", ".css_cmd", function (event) {
    if (!this.onclick) {         // imgs don't have hrefs
        x.ui.getLocal(this).reload({
            page_button: $(this).attr("id"),
        }, {
            confirm_text: $(this).data("confirm-text"),
        });
    }
});

x.ui.reload = function (params, reload_opts) {
    reload_opts = reload_opts || {};
    params.page_key = params.page_key || "";
    params.skin = params.skin || this.skin;
    if (!params.page_id) {
        params.page_id = this.loaded_page_id || this.default_page;
        params.page_key = this.loaded_page_key;
    }
    this.debug("reload(" + JSON.stringify(params) + ", " + JSON.stringify(reload_opts) + ")");
    if (reload_opts.confirm_text) {
        if (!confirm(reload_opts.confirm_text)) {
            return;
        }
    }
    params.selected_rows = reload_opts.selected_rows;
    delete reload_opts.selected_rows;

    // if (!this.sameSimpleURL(params.skin, params.page_id, params.page_key)
    //         || reload_opts.open_new_window
    //         || reload_opts.force_load) {
    //     this.navigateToNewPage(params, reload_opts);
    // } else
    // if (!this.sameSimpleURL(this.loaded_skin, this.loaded_page_id, this.loaded_page_key)) {
    if (params.skin !== this.loaded_skin || params.page_id !== this.loaded_page_id
            || params.page_key !== this.loaded_page_key) {
        this.loadFirstTimePage(params, reload_opts);
    } else {
        this.reloadCurrentPage(params, reload_opts);
    }
};

/*
x.ui.navigateToNewPage = function (params, reload_opts) {
    params.refer_page_id = this.uri_page_id;
    params.refer_page_key = this.uri_page_key;
    params.refer_section_id = reload_opts.refer_section_id;
    this.debug("navigateToNewPage(" + JSON.stringify(params) + ", " + JSON.stringify(reload_opts) + ")");

    if (params.skin === "modal") {
        reload_opts.closeable = true;
        x.ui.modal.open();
        x.ui.modal.performAjax(params, reload_opts);
    } else if (reload_opts.open_new_window) {
        window.open(this.getURIFromParams(params).href());
    } else if (reload_opts.force_load) {
        window.location.reload();
    } else {
        if (this.prompt_message && !confirm(this.prompt_message)) {
            return;
        }
        this.expecting_unload = true;
        this.active = true;
        window.location = this.getURIFromParams(params).href();
    }
};
*/

x.ui.loadFirstTimePage = function (params, reload_opts) {
    reload_opts.first_time_for_page = true;
    this.debug("loadFirstTimePage(" + JSON.stringify(params) + ", " + JSON.stringify(reload_opts) + ")");
    this.reload_count += 1;
    this.performAjax(params, reload_opts);
};

x.ui.reloadCurrentPage = function (override_params, reload_opts) {
    var params = this.collectControlParams(this.selectors.content);
    this.debug("reloadCurrentPage(" + JSON.stringify(override_params) + ", " + JSON.stringify(reload_opts) + ")");
    this.reload_count += 1;
    Object.keys(override_params).forEach(function (param) {
        params[param] = override_params[param];
    });
    params.selected_rows = reload_opts.selected_rows;
    this.performAjax(params, reload_opts);
};

// Row clicks
$(document).on("click", "[url]", function (event) {
    // Avoid redirecting if clicked an anchor or button...
    if ($(event.target).is("a") || $(event.target).parents("a").length > 0) {
        return;
    }
    if ($(event.target).is(".btn") || $(event.target).parents(".btn").length > 0) {
        return;
    }
    x.ui.getLocal(this).redirectAttribute(this, "url");
});

// Anchor clicks
$(document).on("click", "#css_main a[href], #css_modal a[href]", function (event) {
    x.ui.getLocal(this).redirectAttribute(this, "href");
    return false;
});

x.ui.redirectAttribute = function (elmt, attr_id) {
    var url = $(elmt).attr(attr_id || "href");
    var reload_opts = {};
    var keylist = [];

    this.debug("redirectAttribute(" + elmt + ", " + attr_id + ")");
    if (url && url !== "#") {             // no-op urls
        reload_opts.refer_section_id = $(elmt).parents("div.css_section").attr("id");
        if ($(elmt).hasClass("css_bulk")) {
            $(elmt).parents("table").eq(0).find("tr.css_mr_selected")
            .each(function () {
                keylist.push($(this).attr("data-key"));
            });
            reload_opts.selected_rows = keylist.join(",");
        }
        if ($(elmt).hasClass("css_force_load")) {
            reload_opts.force_load = true;
        }
        if ($(elmt).attr("target") === "_blank") {
            reload_opts.open_new_window = true;
        }
        this.redirect(url, reload_opts);
    }
};

x.ui.redirect = function (url, reload_opts) {
    if (!url) {
        url = this.skin;
    }
    if (typeof url === "string") {
        url = URI(url);
    }
    this.debug("redirect(" + url + ", " + JSON.stringify(reload_opts) + ")");
    if (url.filename() === "modal") {
        reload_opts.closeable = true;
        x.ui.modal.load(url, reload_opts);
    } else if (reload_opts && reload_opts.open_new_window) {
        window.open(url);
    } else {
        this.close();
        window.location.href = url;
    }
};


x.ui.performAjax = function (params, reload_opts) {
    var that = this;
    this.debug("performAjax(" + params.page_id + ":" + params.page_key + "), active? " + this.active);
    if (!this.active) {
        return;
    }
    this.start_load = new Date();
    // this.scroll_top = reload_opts.scroll_top || $(this.getScrollElement()).scrollTop();
    if (!reload_opts.keep_messages) {
        this.clearMessages();
    }
    this.deactivate();

    $.ajax({
        url: "dyn/?mode=exchange",
        type: "POST",
        data: $.param(params),
        // CL-Blanking this request header allows IOS6 Safari and Chrome 24+ to work
        // (May benefit other webkit based browsers)
        // These headers were also blanked when this fix was initially added:
        // - Authorization, If-None-Match
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back, text_status, xml_http_request) {
            that.performAjaxSuccess(data_back, xml_http_request, reload_opts);
        },
        error: function (xml_http_request, text_status) {
            that.performAjaxError(xml_http_request, text_status, params, reload_opts);
        },
    });
};

x.ui.forceLoad = function (url) {
    if (url) {
        window.location.href = url;
    }
    window.location.reload();
};

x.ui.performAjaxSuccess = function (data_back, xml_http_request, reload_opts) {
    x.ui.main.last_server_response_time = new Date();
    if (xml_http_request.status === 204) {      // "our" redirection...
        this.prompt_message = null;
        this.active = true;     // allow subsequent performAjax
        this.redirect(xml_http_request.getResponseHeader("Location"), reload_opts);
    } else {
        this.setLoadContent(data_back);
        if (this.loaded_skin && this.loaded_skin !== this.skin) {
            this.redirect(this.loaded_skin + window.location.hash);
        } else {
            this.open(reload_opts.closeable);
            this.setURL();
            this.activate();
            if (reload_opts.first_time_for_page) {
                $(this.getScrollElement()).scrollTop(0);
                $("div[data-scrollbar=true]").scrollTop(0);
            }
        }
    }
};

x.ui.performAjaxError = function (xml_http_request, text_status, params, reload_opts) {
    var error_text = xml_http_request.getResponseHeader("X-Response-Message");
    x.ui.main.last_server_response_time = new Date();
    if (!error_text) {
        if (xml_http_request.status === 0) {
            error_text = "server unavailable";
        } else {
            error_text = "[" + xml_http_request.status + "] " + xml_http_request.statusText;
        }
    }
    if (xml_http_request.status === 401) {
        if (this.default_guest_id) {
            this.guestLogin(this.default_guest_id, params, reload_opts);
        } else {
            x.ui.modal.promptLogin(params);
        }
    } else {
        this.reportMessage({
            type: "E",
            text: error_text,
        });
        this.setContent("<a href='#page_id=" + this.default_page + "'>return to home</a>");
        this.activate();
    }
};

x.ui.getScrollElement = function () {
    return this.selectors.content;
};

x.ui.activate = function () {
    // var that = this;
    this.debug("activate()");
    this.active = true;
    $(this.selectors.target).removeClass("css_inactive");
    $(this.selectors.target).css("cursor", "default");
    $(this.selectors.target).find(":input.css_was_enabled").removeAttr("disabled");
    // $(this.selectors.target).fadeIn(50);

    if (!this.session || !this.session.logged_in) {
        $(".css_not_logged_in").removeClass("css_hide");
        $(".css_logged_in").addClass("css_hide");
    } else {
        $(".css_not_logged_in").addClass("css_hide");
        $(".css_logged_in").removeClass("css_hide");
        $(".css_accnt").text(
            (this.session.chameleon ? "[" + this.session.chameleon + "] " : "")
            + this.session.nice_name);
    }

    this.loadMenu();

//    this.activateFields();
    this.debug("triggering [activateUI] in x.ui.activate()");
    $(this.selectors.target).trigger("activateUI");
    // This was just unnecessary and bad - the scroll stays where it needs to be without this
    //  and in fact this code causes a pain if the user scrolls after the Ajax is sent...
    // if (this.highest_msg_level === "E" || this.highest_msg_level === "W") {
    //     this.scroll_top = 0;
    // }
    // $(this.getScrollElement()).scrollTop(this.scroll_top);
};

x.ui.deactivate = function () {
    this.active = false;
    $(this.selectors.target).addClass("css_inactive");
    $(this.selectors.target).css("cursor", "progress");
    $(this.selectors.target).find(":input:enabled").each(function () {
        $(this).addClass("css_was_enabled");
        $(this).attr("disabled", "disabled");
    });
    // $(this.selectors.target).fadeOut(50);
};

x.ui.collectControlParams = function (target_selector) {
    var params = { challenge_token: this.challenge_token, };
    $(target_selector).find(".css_edit").each(function () {
        var field = x.field.getFieldObject(this);
        params[field.control_id] = field.getValue();
    });
    return params;
};

x.ui.moveSessionMarkup = function () {
    var that = this;
    that.session = {
        roles: {},
        logged_in: false,
    };
    $(this.selectors.target).find("#css_payload_session_data").each(function () {
        that.session.id = $(this).attr("data-session-id");
        that.session.chameleon = $(this).attr("data-chameleon");
        that.session.is_guest = ($(this).attr("data-is-guest") === "true");
        that.session.logged_in = !that.session.is_guest;
        that.session.home_page_url = $(this).attr("data-home-page-url");
        that.session.help_article = $(this).attr("data-help-article");
        that.session.server_purpose = $(this).attr("data-server-purpose");
        that.session.max_inactive_interval = parseInt($(this).attr("data-max-inactive-interval"), 10);
    });
    $(this.selectors.target).find("#css_payload_session_data > #css_payload_user_data").each(function () {
        that.session.user_id = $(this).attr("data-user-id");
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
        $("#css_cham_in").removeClass("css_hide");
        $("#css_cham_in > input").change(function () {
            window.location = "dyn/?mode=chameleonIn&mimic_user_id=" + $(this).val();
        });
    }
    if (that.session && that.session.server_purpose && that.session.server_purpose.indexOf("test") === 0) {
        $("div#header").attr("style",
            "background-image: url(/cdn/icons/test-env-bg.png); background-repeat: repeat-x;");
    }
    if (this.session.is_guest && this.session.user_id !== x.ui.main.default_guest_id) {
        this.logout();
    }
    if (this.session.max_inactive_interval) {
        setTimeout(this.nearlySessionTimeout, (this.session.max_inactive_interval - 30) * 1000);
        setTimeout(this.onSessionTimeout, this.session.max_inactive_interval * 1000);
    }
};

// These functions are bound in on every Ajax call to the server, and not cleared unless page is reloaded
// hence the need for the additional check on time elapsed since last server response
x.ui.nearlySessionTimeout = function () {
    var now_time = (new Date()).getTime();
    if (now_time > (x.ui.main.last_server_response_time.getTime()
            + ((x.ui.main.session.max_inactive_interval - 30) * 1000))) {
        x.ui.main.reportMessage({
            type: "W",
            text: "Your session will log-out in 30 seconds...",
        });
    } else {
        x.ui.debug(now_time + ", " + x.ui.main.last_server_response_time.getTime());
    }
};


x.ui.onSessionTimeout = function () {
    var now_time = (new Date()).getTime();
    if (now_time > (x.ui.main.last_server_response_time.getTime()
            + (x.ui.main.session.max_inactive_interval * 1000))) {
        x.ui.main.forceLoad();
    } else {
        x.ui.debug(now_time + ", " + x.ui.main.last_server_response_time.getTime());
    }
};


x.ui.moveMessageMarkup = function () {
    var that = this;
    $(this.selectors.target).find("#css_payload_messages > div").each(function () {
        // var type = $(this).attr("data-msg-type");
        // var link = $(this).attr("data-msg-link");
        // $(this).removeAttr("data-msg-type");
        that.reportMessage({
            title: $(this).attr("data-msg-title"),
            type: $(this).attr("data-msg-type"),
            link: $(this).attr("data-msg-link"),
            text: $(this).text(),
        });
    });
};


x.ui.movePageMarkup = function () {
    var that = this;
    $(this.selectors.target).find("#css_payload_page_details").each(function () {
        that.loaded_page_id = $(this).attr("data-page-id");
        that.loaded_page_key = $(this).attr("data-page-key");
        that.loaded_skin = $(this).attr("data-page-skin");
        that.loaded_area_id = $(this).attr("data-area-id");
        that.challenge_token = $(this).attr("data-challenge-token");
        that.prompt_message = $(this).attr("data-prompt-message");
        that.setTitle($(this).attr("data-page-title"));
        that.setDescription($(this).attr("data-page-description"));
        that.setNavLinks($(this).attr("data-search-page"),
            $(this).attr("data-prev-key"),
            $(this).attr("data-next-key"));
    });
    that.setLinks($(this.selectors.target).find("#css_payload_page_links > *"));
    that.setTabs($(this.selectors.target).find("#css_payload_page_tabs > *"));
    that.setButtons($(this.selectors.target).find("#css_payload_page_buttons > *"));
};

x.ui.moveTaskMarkup = function () {
    var target_node = $("ul#css_menu_container");
    var max_display_tasks_header = parseInt($(this.selectors.target).find("#css_payload_tasks > div#css_max_display_tasks_header").text(), 10);
    var total_task_count = parseInt($(this.selectors.target).find("#css_payload_tasks > div#css_total_task_count").text(), 10);
    // var overdue_task_count = parseInt($(this.selectors.target).find("#css_payload_tasks > div#css_overdue_task_count").text(), 10);
    var msg;

    target_node.find("li.css_task").remove();
    $(this.selectors.target).find("#css_payload_tasks > li.css_task").detach().prependTo(target_node);
    if (total_task_count === 0 || isNaN(total_task_count)) {
        msg = "no tasks";
        $("#css_task_icon_label").addClass("css_hide");
    } else {
        $("#css_task_icon_label").removeClass("css_hide");
        $("#css_task_icon_label").text(String(total_task_count));
        if (total_task_count <= max_display_tasks_header) {
            msg = total_task_count + " tasks";
        } else {
            msg = "this is the first " + max_display_tasks_header + " of " + total_task_count
                + " tasks, click <a href='#page_id=ac_wf_tasks'>here</a> to see them all";
        }
    }
    $("#css_task_message").html(msg);
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
            $(this).addClass("css_hide");
        }
    });

    // Join Button Group
    button_container.children("div.btn-group").each(function () {
        var button = $($(this).children("button")[0]);
        if (pattern.test(button.text())) {
            $(this).removeClass("css_hide");
        } else {
            $(this).addClass("css_hide");
        }
    });
};

$(document).on("keyup", ".css_list_cols_filter > :input", function () {
    x.ui.filterColumnButtons($(this).parent().parent(), $(this).val());
});


// --------------------------------------------------------- dynamic load resources ---------------
x.ui.checkScript = function (src) {
    var that = this;
    if (this.script_loaded[src] === undefined) {
        $.ajax({
            url: src,
            dataType: "script",
            cache: true,
            async: false,
            type: "GET",
            // No beforeSend IOS6 fix
            error: function (XHR, descr, exception) {
                that.reportMessage({
                    type: "E",
                    text: exception + " trying to get " + src,
                });
                that.script_loaded[src] = false;
            },
            success: function () {
                that.script_loaded[src] = true;
            },
        });
    }
};


x.ui.checkStyle = function (src) {
    var style;
    if (this.script_loaded[src] === undefined) {
        style = document.createElement("link");
        style.setAttribute("rel", "stylesheet");
        style.setAttribute("type", "text/css");
        style.setAttribute("href", src);
        if (style !== undefined) {
            document.getElementsByTagName("head")[0].appendChild(style);
            this.script_loaded[src] = true;
        }
    }
};


x.ui.unisrch = function (selector) {
    var that = this;
    var map;
    this.checkScript("/cdn/typeahead-v0.11.1/typeahead.bundle.js");
    // this.checkStyle("style/typeaheadjs.css");
    $(selector).typeahead({
        minLength: 2,        // min chars typed to trigger typeahead
    }, {
        source: function (query, syncResult, asyncResult) {
            $.get("dyn/?mode=unisrch&q=" + query, function (data) {
                var out = [];
                map = {};
                data.split("\n").forEach(function (line) {
                    var res;
                    var str;
                    if (line) {
                        res = line.split("|");
                        if (res.length > 3) {
                            str = res[3] + " [" + res[0] + "] " + res[1];
                            map[str] = "#page_id=" + res[2] + "&page_key=" + res[0];
                            out.push(str);
                        }
                    }
                });
                asyncResult(out);
            });
        },
    });

    // a matching value is specifically selected by the user (mouse click or arrow-down then enter)
    $(selector).bind("typeahead:select", function (ev, item) {
        console.log("Selection: " + item);
        if (map[item]) {
            that.redirect(map[item]);
        }
        $(selector).typeahead("val", "");
    });

    // a matching value is filled in by the system (arrow right)
    $(selector).bind("typeahead:autocomplete", function (ev, item) {
        console.log("Selection: " + item);
        if (map[item]) {
            that.redirect(map[item]);
        }
        $(selector).typeahead("val", "");
    });
};


x.ui.updateDate = function (selector) {
    var that = this;
    x.ui.checkScript("/cdn/mattkruse.com/date.js");
    $(selector).text(formatDate(new Date(), "E d NNN yyyy HH:mm:ss"));
    setTimeout(function () { that.updateDate(selector); }, 1000);
};


x.ui.setCopyrightMsg = function (selector) {
    $(selector).html("&#169; 2009-" + String((new Date()).getFullYear()).slice(-2)
        + " Rullion Solutions Ltd");
};


// --------------------------------------------------------- x.ui.main ----------------------------
x.ui.main = x.ui.clone("x.ui.main");


x.ui.main.bindToHTML = function (skin, default_page, selectors) {
    x.ui.bindToHTML.call(this, skin, default_page, selectors);
    this.unisrch(this.selectors.unisrch);
    this.updateDate(this.selectors.datetime);
    this.setCopyrightMsg(this.selectors.copyright);
};

x.ui.main.setURL = function () {
    var url = "page_id=" + this.loaded_page_id;
    if (this.page_key) {
        url += "&page_key=" + this.loaded_page_key;
    }
    this.debug("setURL(): " + url);
    $("a#css_page_print")
        .removeClass("css_hide")
        .attr("href", "dyn/?mode=renderPrint&" + url);
    $("a#css_page_excel")
        .removeClass("css_hide")
        .attr("href", "dyn/?mode=renderExcel&" + url);
    $("a#css_page_pdf")
        .removeClass("css_hide")
        .attr("href", "dyn/?mode=renderPDF&" + url);
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
        $("p.css_page_header_descr").addClass("css_hide");
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
    if (prev_key || next_key) {
        $("#css_nav_search")
            .removeClass("css_hide")
            .attr("href", "#page_id=" + search_page);
    } else {
        $("#css_nav_search")
            .addClass("css_hide");
    }
    if (prev_key) {
        $("#css_nav_prev")
            .removeClass("css_hide")
            .attr("href", "#page_id=" + this.loaded_page_id + "&page_key=" + prev_key);
    } else {
        $("#css_nav_prev")
            .addClass("css_hide");
    }
    if (next_key) {
        $("#css_nav_next")
            .removeClass("css_hide")
            .attr("href", "#page_id=" + this.loaded_page_id + "&page_key=" + next_key);
    } else {
        $("#css_nav_next")
            .addClass("css_hide");
    }
};

x.ui.main.getScrollElement = function () {
    return window;
};


// --------------------------------------------------------- x.ui.modal ---------------------------
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
        $("#css_modal .modal-header > button").addClass("css_hide");
    }
    $("#css_modal").modal({
        show: true,
        backdrop: (closeable || "static"),
        keyboard: closeable,
    });
};


x.ui.modal.close = function () {
    $("#css_modal").modal("hide");
};


x.ui.modal.setSize = function (size) {
    if (size !== "lg" && size !== "md" && size !== "sm") {
        throw new Error("invalid size: " + size);
    }
    // $("#css_modal").removeClass("modal-lg");
    // $("#css_modal").removeClass("modal-sm");
    // if (size !== "md") {
    //     $("#css_modal").addClass("modal-" + size);
    // }
    // TB3...
    $("#css_modal .modal-dialog").removeClass("modal-lg");
    $("#css_modal .modal-dialog").removeClass("modal-sm");
    if (size !== "md") {
        $("#css_modal .modal-dialog").addClass("modal-" + size);
    }
};


// --------------------------------------------------------- menu ---------------------------------
x.ui.loadMenu = function () {
    var that = this;
    var elmt_menu_marker = $("#css_menu_marker");

    this.debug("loadMenu(); session: " + this.session + ", length(elmt_menu_marker): " + elmt_menu_marker.length);
    if (!this.session || this.session.is_guest || elmt_menu_marker.length === 0) {
        return;
    }
    if (this.menu_loaded) {
        // $("#navbar-collapse-main .open").removeClass("open");
        x.sidebar.updateSidebarFromUI(this.loaded_area_id, this.loaded_page_id);
        return;
    }
    $.ajax({
        type: "GET",
        dataType: "html",
        url: "dyn/?mode=menu&session=" + this.session.id,
        cache: true,    // cache to the session
        // No IOS6 fix
        success: function (data) {
            that.debug("menu returned");
            elmt_menu_marker.parent().find(".css_menu_dyn").remove();
            elmt_menu_marker.after(data);
            elmt_menu_marker.parent().children("#css_menu_replace").children().unwrap();

            that.menu_loaded = true;

            // must called only once, when the menu is first loaded
            x.sidebar.handleSidebarMenu();
            x.sidebar.updateSidebarFromUI(this.loaded_area_id, this.loaded_page_id);
        },
        error: function (xml_http_request, text_status) {
            that.reportMessage({
                type: "E",
                text: "[" + xml_http_request.status + "] " + xml_http_request.statusText,
            });
        },
    });
};

x.ui.modal.loadMenu = function () {
    return undefined;
};

x.ui.openHelp = function () {
    var article = "help_guest";
    if (this.session) {
        if (this.session.help_article) {
            article = this.session.help_article;
        } else if (!this.session.is_guest) {
            article = "help_other";
        }
    }
    console.log("openHelp(): " + article);
    window.open("guest.html#page_id=pb_article_show&page_key=" + article);
};


// --------------------------------------------------------- login --------------------------------
x.ui.guestLogin = function (guest_id, params, reload_opts) {
    var that = this;
    this.debug("guestLogin(" + guest_id + ", " + JSON.stringify(params)
        + ", " + JSON.stringify(reload_opts) + ")");
    if (this.reload_count > 2) {
        this.reportMessage({
            type: "E",
            text: "Sorry, this device is not currently supported",
        });
        return;
    }
    $.ajax({
        url: "dyn/?mode=guestLogin&guest_id=" + guest_id,
        type: "POST",
        timeout: x.server_timeout,
        cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
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
        },
    });
};


x.ui.promptLogin = function (params) {
    var that = this;
    this.debug("promptLogin(" + JSON.stringify(params) + ")");
    $.ajax({
        url: "login/?mode=login",
        type: "GET",
        cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data) {
            if (typeof data === "object" && data.action === "normal_login") {
                x.ui.main.forceLoad();
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
            that.reportMessage({
                type: "E",
                text: "Server not responding at promptLogin - " + text_status + "<br/>" + xml_http_request.responseText,
            });
            that.activate();
        },
    });
};

// Function needs re-factoring...
x.ui.login = function () {
    var params;
    this.debug("login()");
    if (!this.active) {
        return;
    }

    this.reload_count += 1;
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
    this.debug("getLoginParameters()");
    if (!params.j_username || !params.j_password) {
        this.clearMessages();
        this.reportMessage({
            type: this.reload_count === 1 ? "I" : "E",
            text: "Please enter a user id and password",
        });
        return null;
    }
    return params;
};

x.ui.loginPhaseOne = function (params) {
    var that = this;
    this.debug("loginPhaseOne(" + JSON.stringify(params) + ")");
    $.ajax({
        url: "login/?mode=login",
        type: "POST",
        data: $.param(params),
        cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back) {
            that.loginPhaseTwo(params, data_back);
        },
        error: function (xml_http_request, text_status) {
            that.debug("loginPhaseOne() " + text_status + "<br/>" + xml_http_request.responseText);
            that.clearMessages();
            that.reportMessage({
                type: "E",
                text: "Server not responding",
            });
            that.debug("error at loginPhaseOne: " + text_status);
            that.activate();
        },
    });
};


x.ui.loginPhaseTwo = function (params, data) {
//    var that = this;
    this.debug("loginPhaseTwo(" + JSON.stringify(params) + ", " + JSON.stringify(data) + ")");
    if (typeof data === "object" && data.action === "normal_login") {
        x.ui.main.load(this.post_login_url, { force_load: true, });          // force full page load
    } else {
        this.loginPhaseThree(params, data);
    }
};

x.ui.loginPhaseThree = function (params, data) {
    var that = this;
    this.debug("loginPhaseThree(" + JSON.stringify(params) + ", " + JSON.stringify(data) + ")");
    $.ajax({
        url: "j_security_check",
        type: "POST",
        data: $.param(params),
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back, text_status, xml_http_request) {
            that.loginPhaseFour(params, data_back);
        },
        error: function (xml_http_request, text_status) {
            that.debug("loginPhaseThree() " + text_status + "<br/>" + xml_http_request.responseText);
            that.clearMessages();
            that.reportMessage({
                type: "E",
                text: "Server not responding",
            });
            that.debug("error at loginPhaseThree: " + text_status);
            that.activate();
        },
    });
};

x.ui.loginPhaseFour = function (params, data) {
    this.debug("loginPhaseFour(" + JSON.stringify(params) + ", " + JSON.stringify(data) + ")");
    if (typeof data === "object" && data.action === "normal_login") {
        x.ui.modal.close();
        x.ui.main.forceLoad(this.post_login_url);
    } else {
        this.reload_count += 1;
        this.clearMessages();
        this.reportMessage({
            type: "E",
            text: "Invalid user id and password",
        });
        this.promptLogin(params);
    }
};


// --------------------------------------------------------- logout -------------------------------
x.ui.logout = function () {
    var that = this;
    this.debug("logout(): " + this.prompt_message);
    if (this.prompt_message && !confirm(this.prompt_message)) {
        return;
    }
    this.deactivate();
    this.prompt_message = null;
    // CL - GET doesn"t work in IE
    $.ajax({
        url: "dyn/?mode=logout",
        type: "POST",
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back, text_status, xml_http_request) {
            that.forceLoad(that.skin);
        },
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

// ------------------ submit on enter key if .css_button_main specified - deactivated for the moment

$(document).on("keyup", function (event) {
    var node = event.target || event.srcElement;
    // var ui = x.ui.getLocal(this);
    var button;

//    ui.last_key_pressed = event.keyCode;
    if (event.keyCode === 13) {                     // enter key pressed
        if (node && ($(node).attr("type") === "text" || $(node).attr("type") === "password")) {
            button = $(this).parents("form").find(".css_button_main");
            if (button.length === 0) {
                button = $(".css_button_main");
            }
            if (button.length > 0) {
                $(node).blur();         // ensure change event fires before triggering the click...
                button.click();
            }
        }
        event.preventDefault();         // prevent accidental press of logout, etc, in IE
    }
    return false;
});


$(document).on("keydown", "div.css_edit > input", function (event) {
    if (event.which === 13) {
        event.preventDefault();
    }
});


// --------------------------------------------------------- multi-row selection ------------------
$(document).on("mousedown", "td.css_mr_sel", function (event) {
    var ui = x.ui.getLocal(this);
    ui.multiselect_table = $(this).parent("tr").parent("tbody").parent("table");
    ui.mouse_deselect = $(this).parent("tr").hasClass("css_mr_selected");
    ui.mouseoverRow($(this).parent());
    return false;
});

$(document).on("mouseover", "td.css_mr_sel", function (event) {
    var ui = x.ui.getLocal(this);
    if (ui.multiselect_table) {
        ui.mouseoverRow($(this).parent());
    }
});

$(document).on("mouseup", function (event) {
    var ui = x.ui.getLocal(this);
    var slct_elem;

    if (!ui.multiselect_table) {
        return;
    }
    slct_elem = ui.multiselect_table.find("tr.css_mr_actions > td > input");
    if (JSON.parse(slct_elem.val() || "[]").length > 0) {
        ui.multiselect_table.addClass("css_mr_selecting");
        ui.multiselect_table.find("tr.css_mr_actions > td > a.btn").removeClass("disabled");
    } else {
        ui.multiselect_table.removeClass("css_mr_selecting");
        ui.multiselect_table.find("tr.css_mr_actions > td > a.btn").addClass("disabled");
    }
    ui.multiselect_table = null;
});

$(document).on("click", "td.css_mr_sel", function (event) {
    return false;
});

x.ui.mouseoverRow = function (row) {
    var slct_elem = this.multiselect_table.find("tr.css_mr_actions > td > input");
    var array = JSON.parse(slct_elem.val() || "[]");
    var key = row.attr("data-key");

    if (this.mouse_deselect) {
        row.removeClass("css_mr_selected");
        if (array.indexOf(key) > -1) {
            array.splice(array.indexOf(key), 1);
            slct_elem.val(JSON.stringify(array));
        }
    } else {
        row.addClass("css_mr_selected");
        if (array.indexOf(key) === -1) {
            array.push(key);
            slct_elem.val(JSON.stringify(array));
        }
    }
};


// --------------------------------------------------------- charts -------------------------------
$(document).on("activateUI", function (event) {
    $(this).find(".css_section_Chart").each(function () {
        x.ui.getLocal(this).activateChart($(this));
    });
});

x.ui.activateChart = function (elem) {
    var json = elem.find("span.css_hide").html();
    var obj = $.parseJSON(json);
    this.activateChartLibrary[obj.library].call(this, obj, elem);
};

x.ui.activateChartLibrary = {};

x.ui.activateChartLibrary.flot = function (obj, elem) {
    this.debug("activateChart.flot()");
    x.ui.checkScript("/cdn/jquery.flot/jquery.flot.min.js");
    x.ui.checkScript("/cdn/jquery.flot/jquery.flot.stack.min.js");
    elem.find("div.css_chart").css("width", obj.options.width || "900px");
    elem.find("div.css_chart").css("height", obj.options.height || "400px");
    $.plot(elem.find("div.css_chart"), obj.series, obj.options);
};

x.ui.activateChartLibrary.highcharts = function (obj, elem) {
    var new_obj = obj.options;
    var enable_regression = false;
    var i;

    this.debug("activateChart.highcharts()");
    x.ui.checkScript("/cdn/highcharts-3.0.0/highcharts.js");
    x.ui.checkScript("/cdn/highcharts-3.0.0/highcharts-more.js");
    x.ui.checkScript("/cdn/highcharts-3.0.0/exporting.js");
    x.ui.checkScript("style/highcharts_defaults.js");
    new_obj.series = obj.series;
    for (i = 0; i < new_obj.series.length; i += 1) {
        if (!enable_regression && new_obj.series[i].regression) {
            enable_regression = true;
        }
        new_obj.series[i].events = { click: this.pointClickHandler, };
    }
    new_obj.chart.renderTo = "css_chart_" + elem.attr("id");

    if (enable_regression) {
        x.ui.debug(enable_regression);
        x.ui.checkScript("/cdn/highcharts-3.0.0/highcharts-regression.js");
    }
    obj = new Highcharts.Chart(new_obj);
};

x.ui.activateChartLibrary.google = function (obj, elem) {
    var that = this;
    this.debug("activateChart.google()");

    // x.ui.checkScript("https://www.google.com/jsapi");
    $.getScript("https://www.gstatic.com/charts/loader.js", function () {
        // Load the Visualization API and the piechart package.
        // google.load('visualization', '1.0', {'packages':['corechart']});

        // x.ui.checkScript("https://www.gstatic.com/charts/loader.js");
        google.charts.load("current", {
            packages: [
                "gantt",
            ],
        });
        google.charts.setOnLoadCallback(function () {
            var i;
            var data;
            var chart;

            for (i = 0; i < obj.series.length; i += 1) {
                that.convertDataTableForGoogle(obj.series[i].data);
                alert(JSON.stringify(obj.series[i].data));
                data = google.visualization.arrayToDataTable(obj.series[i].data);
                chart = new google.visualization.Gantt(elem.children(".css_chart")[0]);
                chart.draw(data, obj.options);
            }
        });
    });
};

x.ui.convertDataTableForGoogle = function (array) {
    var col;
    var row;
    for (col = 0; col < array[0].length; col += 1) {
        if (array[0][col].type === "date") {
            for (row = 1; row < array.length; row += 1) {
                array[row][col] = new Date(array[row][col]);
            }
        }
    }
};

x.ui.pointClickHandler = function (event2) {
    if (event2.point && event2.point.url) {
        x.ui.main.redirect(event2.point.url.replace(/&amp;/g, "&"));
    }
};


$(document).on("activateUI", function (event) {
    $(this).find(".css_section_DotGraph").each(function () {
        var elem = $(this).children("div.css_diagram");
        var text = elem.text();

        x.ui.getLocal(this).checkScript("/cdn/viz/viz.js");
        elem.html(Viz(text, "svg"));
    });
});


// --------------------------------------------------------- search filters -----------------------
$(document).on("activateUI", function (event) {
    $(this).find("table.css_search_filters tr").each(function () {
        var tr_elem = $(this);
        var oper_field = tr_elem.find(".css_filter_oper :input");
        var json_str = tr_elem.find(".css_filter_val .css_render_data").eq(0).text();
        var json_obj = (json_str && JSON.parse(json_str));

        function adjustBetween() {
            if (json_obj && oper_field.val() === json_obj.extd_filter_oper) {
                tr_elem.find(".css_filter_val > :gt(0)").removeClass("css_hide");
            } else {
                tr_elem.find(".css_filter_val > :gt(0)").addClass("css_hide");
            }
        }
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
        if (tr_elem.attr("data-advanced-mode") === "false") {
            tr_elem.find(".css_filter_oper :input").attr("disabled", "disabled");
        }
        tr_elem.find(".css_filter_val  :input").change(function () { adjustOperator(this); });
        tr_elem.find(".css_filter_oper :input").change(function () { adjustBetween(); });
        adjustBetween();
    });
});


x.ui.table = {};


$(document).on("activateUI", function (event) {
    $("table.css_list").each(function () {
        var table_obj = $(this).data("table_controller");
        if (!table_obj) {
            table_obj = Object.create(x.ui.table);
            table_obj.table_elmt = $(this);
            table_obj.initialize();
            $(this).data("table_controller", table_obj);
        }
    });
    x.ui.main.onLoadOrResize();
});


$(document).on("ready", function () {
    x.ui.main.onLoadOrResize();
});

$(window).on("resize", function () {
    x.ui.main.onLoadOrResize();
});

x.ui.main.onLoadOrResize = function () {
    var footer_height = $("#footer").height();
    $("#behind-footer-spacer").height(footer_height);
    $("table.css_list").each(function () {
        $(this).data("table_controller").onresize();
    });
};

x.ui.table.initialize = function () {
    this.id = this.table_elmt.attr("id");
    this.calcTableColWidths();
    this.addColumnPagingButtons();
    // this.onresize();
};

x.ui.table.onresize = function () {
    // don't want to include padding, so use .width()
    this.section_width = parseInt(this.table_elmt.parent().width(), 10);
    this.activateColumnPaging(
        (this.total_non_sticky_width + this.total_sticky_width) > this.section_width);
    this.applyColumnPaging();
};

x.ui.table.calcTableColWidths = function () {
    var col_index = 0;
    var that = this;
    this.total_non_sticky_width = 0;
    this.total_sticky_width = 0;
    this.first_non_sticky_col = null;
    this.last_non_sticky_col = null;
    this.show_columns = [];
    this.table_elmt.find("thead > tr > th").each(function () {
        var this_col_width = parseInt($(this).css("min-width"), 10) || 100;
        var is_sticky = $(this).hasClass("css_sticky_col");
        if (is_sticky) {
            that.total_sticky_width += this_col_width;
            that.show_columns[col_index] = true;
        } else {
            that.total_non_sticky_width += this_col_width;
            that.last_non_sticky_col = col_index;
            if (typeof that.first_non_sticky_col !== "number") {
                that.first_non_sticky_col = col_index;
            }
        }
        col_index += 1;
    });
    this.curr_first_shown_col = this.first_non_sticky_col;
};


x.ui.table.addColumnPagingButtons = function () {
    var that = this;
    if (this.table_elmt.find("tfoot > tr:last > td > div#css_column_pager").length === 0) {
        this.table_elmt.find("tfoot > tr:last > td").append("<div id='css_column_pager' class='btn-group' "
            + "style='display: inline-block; float: right; margin-right: 10px; '>"
            + "<button class='btn btn-xs btn-default' id='css_col_prev'><i class='fa fa-lg fa-caret-left'></i></button>"
            + "<button class='btn btn-xs btn-default' id='css_col_next'><i class='fa fa-lg fa-caret-right'></i></button></div>");
        this.table_elmt.find("tfoot > tr > td > div#css_column_pager > button#css_col_prev").click(function () {
            that.prevColumnPage();
        });
        this.table_elmt.find("tfoot > tr > td > div#css_column_pager > button#css_col_next").click(function () {
            that.nextColumnPage();
        });
    }
};


x.ui.table.activateColumnPaging = function (is_paging_needed) {
    if (is_paging_needed) {
        this.table_elmt.find("tfoot > tr > td > div#css_column_pager").removeClass("css_hide");
    } else {
        this.table_elmt.find("tfoot > tr > td > div#css_column_pager").addClass("css_hide");
    }
};


x.ui.table.applyColumnPaging = function () {
    var that = this;
    var col_index = 0;
    var non_sticky_width = 0;
    this.table_elmt.find("thead > tr > th").each(function () {
        var this_col_width = parseInt($(this).css("min-width"), 10) || 100;
        var is_sticky = $(this).hasClass("css_sticky_col");
        if (!is_sticky) {
            if ((col_index >= that.curr_first_shown_col)
                    && ((non_sticky_width + this_col_width)
                        <= (that.section_width - that.total_sticky_width))) {
                that.show_columns[col_index] = true;
                non_sticky_width += this_col_width;
                that.curr_last_shown_col = col_index;
            } else {
                that.show_columns[col_index] = false;
            }
        }
        col_index += 1;
    });
    this.table_elmt.find("thead > tr, tbody > tr").each(function () {
        col_index = 0;
        $(this).children().each(function () {
            var colspan = parseInt($(this).attr("colspan"), 10);
            if (isNaN(colspan)) {
                colspan = 1;
            }
            if (that.show_columns[col_index]) {
                $(this).removeClass("css_hide");
            } else {
                $(this).addClass("css_hide");
            }
            col_index += colspan;
        });
    });
};


x.ui.table.prevColumnPage = function () {
    if (this.curr_first_shown_col > this.first_non_sticky_col) {
        this.curr_first_shown_col -= 1;
        this.applyColumnPaging();
    }
};


x.ui.table.nextColumnPage = function () {
    if (this.curr_last_shown_col < this.last_non_sticky_col) {
        this.curr_first_shown_col += 1;
        this.applyColumnPaging();
    }
};
