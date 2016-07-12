/*jslint browser: true */
/*global x, $, window, console, confirm, formatDate, Highcharts */


//--------------------------------------------------------- login --------------------------------------------------------------
x.ui.guestLogin = function (guest_id, params, reload_opts) {
    "use strict";
    var that = this;
    if (this.reload_count > 2) {
        this.reportMessage({ type: 'E', text: "Sorry, this device is not currently supported" });
        return;
    }
    $.ajax({ url: "jsp/guest.jsp?mode=guestLogin&guest_id=" + guest_id, type: "POST", timeout: x.server_timeout, cache: false,
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


x.ui.promptLogin = function (/*params*/) {
    "use strict";
    var that = this;
    $.ajax({ url: "jsp/login.jsp", type: "GET", cache: false,
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
                that.setButtons(
                    "<button id='login' class='btn btn-primary' onclick='x.ui.modal.login()'>Log-in</button>" +
                    "<a class='btn' href='guest.html?page_id=ac_pswd_forgotten'>Forgotten Password</a>" +
                    "<a class='btn' href='guest.html?page_id=ac_user_request_choose'>Request a User Account</a>");
                that.open(false);         // not closeable
                // that.setSize("sm");
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
    "use strict";
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
    "use strict";
    var params = this.collectControlParams($(this.selectors.content));

    if (!params.j_username || !params.j_password) {
        this.clearMessages();
        this.reportMessage({ type: this.reload_count === 1 ? 'I' : 'E', text: "Please enter a user id and password" });
        return;
    }
    return params;
};

x.ui.loginPhaseOne = function (params) {
    "use strict";
    var that = this;
    $.ajax({ url: "jsp/login.jsp", type: "POST", data: $.param(params), cache: false,
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
    "use strict";
//    var that = this;
    if (typeof data === "object" && data.action === "normal_login") {
        x.ui.main.redirect(this.post_login_url, { force_load: true });          // force full page load
    } else {
        this.loginPhaseThree(params, data);
    }
};

x.ui.loginPhaseThree = function (params /*, data*/) {
    "use strict";
    var that = this;
    $.ajax({ url: "j_security_check", type: "POST", data: $.param(params),
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
           that.loginPhaseFour(params, data_back);
        }, error: function (xml_http_request, text_status) {
            that.clearMessages();
            that.reportMessage({ type: 'E', text: "Server not responding at loginPhaseThree - " + text_status + "<br/>" + xml_http_request.responseText });
            that.activate();
        }
    });
};

x.ui.loginPhaseFour = function (params, data) {
    "use strict";
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
    "use strict";
    var that = this;
    if (this.prompt_message && !confirm(this.prompt_message)) {
        return;
    }
    this.deactivate();
    this.prompt_message = null;
    //CL - GET doesn't work in IE
    $.ajax({ url: "jsp/main.jsp?mode=logout", type: "POST",
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (/*data_back*/) {
            that.redirect(that.skin, { force_load: true });
        }
    });
};




/*------------------------------------------------------------Ping--------------------------------------------------------------*/
x.ui.main.ping_interval = 5000;            // in ms
x.ui.main.ping_timeout  = 5000;            // in ms
x.ui.main.ping_failures = 0;

x.ui.main.ping = function () {
    "use strict";
    setTimeout(x.ui.main.ping, x.ui.main.ping_interval);
    x.ui.main.pingInternal();       // call on x.ui.main to enable 'this'
};

x.ui.main.pingInternal = function () {
    "use strict";
    var that = this,
        url_params;

    if (!this.session || this.session.is_guest || !this.session.ping_mechanism) {
        return;
    }
    url_params = "&visit_id=" + this.session.id + "." + this.session.visits;
    if (this.page_active && this.time_stamps. pre_render && this.time_stamps.pre_post) {
        url_params +=   "&post_interval=" + (this.time_stamps. pre_render.getTime() - this.time_stamps.pre_post  .getTime());
    }
    if (this.page_active && this.time_stamps. pre_render && this.time_stamps.post_render) {
        url_params += "&render_interval=" + (this.time_stamps.post_render.getTime() - this.time_stamps.pre_render.getTime());
        this.time_stamps = {};
    }
    $.ajax({ url: "jsp/main.jsp?mode=ping" + url_params, type: "GET", timeout: this.ping_timeout, dataType: "json", cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data_back) {
            if (that.ping_failures > 0) {
                that.clearMessages();
                that.addMessage("And we're back!", 'I');
            }
            that.ping_failures = 0;
            if (typeof data_back === "string" || data_back.logged_out) {
                window.location = that.skin;
            } else if (data_back.logout) {
                that.logout();
            }
        },
        error: function (ignore /*xml_http_request*/, text_status) {
            that.clearMessages();
            that.ping_failures += 1;
            if (text_status === "parsererror") {            // logged out, so response is log-in page
                window.location = that.skin;
            } else if (that.ping_failures < 20) {
                that.addMessage("Server gone away, retrying...", 'W');
            } else {
                that.addMessage("Server gone for good. Giving up. Please try later", 'E');
            }
        }
    });
};

x.ui.main.ping();           // run ping always


//--------------------------------------------------------- menu ---------------------------------------------------------------
x.ui.loadMenu = function () {
    "use strict";
    var that = this,
        elmt_container = $("#css_menu_container");

    this.debug("loadMenu(); session: " + this.session + ", length(elmt_container): " + elmt_container.length);
    if (!this.session || this.session.is_guest || elmt_container.length === 0) {
        return;
    }
    $.ajax({
        type: "GET", dataType: "html", url: "jsp/main.jsp?mode=menu&session=" + this.session.id, cache: true,    // cache to the session
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
        error: function (xml_http_request /*, text_status*/) {
            that.reportMessage({ type: 'E', text: "[" + xml_http_request.status + "] " + xml_http_request.statusText });
        }
    });
};

x.ui.modal.loadMenu = function () {
    "use strict";
    return undefined;
};



x.ui.openHelp = function () {
    "use strict";
    var article;
    if (this.session) {
        article = this.session.help_article;
        if (!article && !this.session.is_guest) {
            article = "help_other";
        }
    }
    article = article || "help_guest";
    window.open("guest.html?page_id=pb_article_show&page_key=" + article);
};



x.ui.unisrch = function (selector) {
    "use strict";
    var that = this,
        map;

    $(selector).typeahead({
        minLength: 2,        // min chars typed to trigger typeahead
        source: function (query, process) {
            $.get("jsp/main.jsp?mode=unisrch&q=" + query, function (data) {
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
    "use strict";
    var that = this;
    x.ui.checkScript("/cdn/mattkruse.com/date.js");
    $(selector).text(formatDate(new Date(), "E d NNN yyyy HH:mm:ss"));
    setTimeout(function () { that.updateDate(selector); }, 1000);
};

x.ui.setCopyrightMsg = function (selector) {
    "use strict";
    $(selector).html("&#169; 2009-"+String((new Date()).getFullYear()).slice(-2)
        +" Rullion Solutions Ltd");
};



x.ui.moveSessionMarkup = function () {
    "use strict";
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
            window.location = "jsp/main.jsp?mode=chameleonIn&mimic_user_id=" + $(this).val();
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
    "use strict";
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
    "use strict";
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
    "use strict";
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
    "use strict";
    $(span).parent().children("div.css_list_choose_cols").toggleClass("css_hide");
};

x.ui.filterColumnButtons = function (button_container, filter_text) {
    "use strict";
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
    "use strict";
    x.ui.filterColumnButtons($(this).parent().parent(), $(this).val());
});



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
$(document).on("click", ".css_cmd", function (/*event*/) {
    "use strict";
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
    "use strict";
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
$(document).on("click", "a[href]", function (/*event*/) {
    "use strict";
    x.ui.getLocal(this).redirectAttribute(this, "href");
    return false;
});

// Tab clicks
// $(document).on("click", "ul#css_page_tabs > li", function (/*event*/) {
//     "use strict";
//     x.ui.getLocal(this).reload({ page_tab: $(this).attr("id") });
// });

/*---------------------submit on enter key if .css_button_main specified - deactivated for the moment---------------------------*/
$(document).on("keyup", function (event) {
    "use strict";
    var node = event.target || event.srcElement,
        // ui = x.ui.getLocal(this),
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
    "use strict";
    if (event.which === 13) {
        event.preventDefault();
    }
});




//--------------------------------------------------------- multi-row selection --------------------------------------------------
$(document).on("mousedown", "td.css_mr_sel"  , function(/*event*/) {
    "use strict";
    var ui = x.ui.getLocal(this);
    ui.multiselect_table = $(this).parent("tr").parent("tbody").parent("table");
    ui.mouse_deselect    = $(this).parent("tr").hasClass("css_mr_selected");
    ui.mouseoverRow($(this).parent());
    return false;
});

$(document).on("mouseover", "td.css_mr_sel"  , function(/*event*/) {
    "use strict";
    var ui = x.ui.getLocal(this);
    if (ui.multiselect_table) {
        ui.mouseoverRow($(this).parent());
    }
});

$(document).on("mouseup",                      function(/*event*/) {
    "use strict";
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

$(document).on("click", "td.css_mr_sel"     , function (/*event*/) {
    "use strict";
    return false;
});

x.ui.mouseoverRow = function (row) {
    "use strict";
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
$(document).on("activateUI", function (/*event*/) {
    "use strict";
    $(this).find(".css_section_Chart").each(function () {
        x.ui.getLocal(this).activateChart.call($(this));
    });
});

x.ui.activateChart = function () {
    "use strict";
    var json = $(this).find("span.css_hide").html(),
        obj  = $.parseJSON(json),
        new_obj,
        enable_regression = false,
        i;

    if (obj.library === "flot") {
        x.ui.main.checkScript("/cdn/jquery.flot/jquery.flot.min.js");
        x.ui.main.checkScript("/cdn/jquery.flot/jquery.flot.stack.min.js");
        $(this).find("div.css_chart").css("width" , obj.options.width  || "900px");
        $(this).find("div.css_chart").css("height", obj.options.height || "400px");
        $.plot($(this).find("div.css_chart"), obj.series, obj.options);
    } else if (obj.library === "highcharts") {
        x.ui.main.checkScript("/cdn/highcharts-3.0.0/highcharts.js");
        x.ui.main.checkScript("/cdn/highcharts-3.0.0/highcharts-more.js");
        x.ui.main.checkScript("/cdn/highcharts-3.0.0/exporting.js");
        x.ui.main.checkScript("style/highcharts_defaults.js");
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
            x.ui.main.debug(enable_regression);
            x.ui.main.checkScript("/cdn/highcharts-3.0.0/highcharts-regression.js");
        }
        obj = new Highcharts.Chart(new_obj);
    //} else if (obj.library === "google") {
    }
};

x.ui.pointClickHandler = function (event2) {
    "use strict";
    if (event2.point && event2.point.url) {
        x.ui.main.redirect(event2.point.url.replace(/&amp;/g, "&"));
    }
};


$(document).on("activateUI", function (/*event*/) {
    "use strict";
    $(this).find(".css_section_DotGraph").each(function () {
        var elem = $(this).children("div.css_diagram"),
            text = elem.text();

        x.ui.getLocal(this).checkScript("/cdn/viz/viz.js");
        /*jslint newcap: true */
        elem.html(Viz(text, "svg"));
    });
});


//--------------------------------------------------------- search filters -------------------------------------------------------
$(document).on("activateUI", function (/*event*/) {
    "use strict";
    $(this).find("table.css_search_filters tr").each(function () {
        var tr_elem    = $(this),
            oper_field = tr_elem.find(".css_filter_oper :input"),
            json_str   = tr_elem.find(".css_filter_val .css_render_data").eq(0).text(),
            json_obj   = (json_str && JSON.parse(json_str));

        function adjustBetween() {
            if (json_obj && oper_field.val() === json_obj.extd_filter_oper) {
                tr_elem.find(".css_filter_val > :gt(0)").removeClass("css_hide");
            } else {
                tr_elem.find(".css_filter_val > :gt(0)").   addClass("css_hide");
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
        tr_elem.find(".css_filter_val  :input").change( function () { adjustOperator(this); });
        tr_elem.find(".css_filter_oper :input").change( function () { adjustBetween(); });
        adjustBetween();
    });
});
