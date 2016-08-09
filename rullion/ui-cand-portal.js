/*jslint browser: true */
/*global x, $, window, console, confirm */


//iframe code start

x.ui.updateIframe = function (target, redirect) {
    var params = {},
        hash = "",
        height1,
        height2,
        title;

//Resize iframe if present
    if (top === self) {
        //No iframe
    } else {

        if (redirect) {
            window.parent.postMessage('{"cookie_redirect":"' + redirect + '"}', "*");
            return;
        }

        if (!target) {
            target = $(".css_load_target").first();
        }

        params.page_id  = target.data("page_id" );
        params.page_key = target.data("page_key");

        if (!params.page_key) {
            delete params.page_key;
        }

        //Use helper file on client's domain to avoid cross domain problems
        height1 = 40;
        height2 = $("div#css_content").height() + 40;
        title = this.iframe_title + " - " + $("span#css_page_header_title").text();

        if (params.page_id) {
            hash += "page_id=" + params.page_id;
            if (params.page_key) {
                hash += "&page_key=" + params.page_key;
            }
        }

        $('#css_left_bar').children().each(function(){
            var add = true;

            //Don't add height if no messages
            if ($(this).hasClass('css_messages') && $(this).children().length == 0 ) {
                add = false;
            }

            if (add) {
                height1 += $(this).height();
            }
        });

        window.parent.postMessage('{"height":"' + (height1 > height2 ? height1 : height2) + '", "hash":"' + hash + '", "title":"'+title+'"}', "*");
    }
};

//Update iframe after render
$(document).on("initialize", function (e, target, opts) {
    if (opts.load_mode === "main") {
        x.ui.updateIframe(target);
    }
});

//Update iframe on window resize
$(window).resize(function(){
    x.ui.updateIframe();
});


y.handleGuestLoop = function handleGuestLoop(){
    if (top !== self && document.cookie.indexOf("JSESSIONID")) {
        var redirect = String(window.location.protocol + "//" +  window.location.host + window.location.pathname).replace(y.skin, "") + "redirect.html";
        //Redirect to cookie acceptance page
        $('body').css("cursor","default");
        $('div#css_top_bar').addClass("css_hide");
        $('div#css_page_header > h1').text("Current vacancies - Cookies required");
        $("div#css_body").empty();
        $("div#css_body").html(
             '<p>The use of this site requires cookies. Please click the button below to accept.</p></br>'
            +'<button class="btn" onclick="y.update_iframe(null,\'' + redirect + '\');">Click to Accept</button>'
        );
    }else{
        y.reportError("Sorry, this device is not currently supported");
    }
};

//Base URL for Social Media Links - if hosting iframe differs (e.g. a test site )
y.share_url = window.location.origin + "/" + window.location.pathname.split("/")[1] + "/extranet_frame.html";

//Message handler
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
// Listen to message from child IFrame window
eventer(messageEvent, function (e) {
    var p;

    try{
        p = jQuery.parseJSON(e.data);
    } catch (e) {
        p = {};
    }
    if (p.host_url) {
        y.share_url = p.host_url;
    }
    //content to iframe 'ping'
    if (p.start_ping) {
        setTimeout(y.ping_iframe,100);
    }
}, false);

//'ping' between iframe content i.e. this and the host
y.ping_iframe = function () {
    setTimeout(y.ping_iframe,100);
    y.update_iframe();
};
//iframe code end


$(document).on("loadSuccess", function (e, target, params, opts, data_back) {
     if (y.page && y.page.id === "ss_dashboard") {
         $("#welcome_dashboard").show();
         $("#welcome"          ).hide();
         $(".css_accnt").text((y.session.chameleon ? "[" + y.session.chameleon + "] " : "" ) + y.session.user_name.split(",")[1]);
     }
     if (y.page && y.page.id === "ss_applications") {
        $("#welcome").hide();
     }
     if (y.page && y.page.tasks && y.page.tasks > 0) {
         $(".task_count").show();
         $(".task_count").html(y.page.tasks);
     }
});

y.updateDashBoard = function () {
    var highest = 0,
        divs    = [];
    if ($("#alerts").innerWidth() < 553) {
        $(".control-group > .control-label").each(function () { $(this).css("float", "none");  $(this).css("text-align", "left"); $(this).css("width", "100%");})
        $(".control-group > .controls"     ).each(function () { $(this).css("margin-left", "0px"); })
    } else {
        $(".control-group > .control-label").each(function () { $(this).css("float", "left");  $(this).css("text-align", "right"); $(this).css("width", "160px");})
        $(".control-group > .controls"     ).each(function () { $(this).css("margin-left", "180px"); })
    }

    $(".css_section_DashboardSection").each(function () {
        $(this).removeAttr("style");
        $(this).height("auto");
        var h = $(this).outerHeight();
        if (h > highest) {
            highest = h;
        }
        divs.push([$(this), h]);
    });
    divs.forEach(function(d) {
        $(d[0]).height(highest);
        var b = $("#" + $(d[0]).attr("id") + "> div > .btn");
        if (b) {
            b.css("margin-top", highest-d[1]);
        }
    });
};

$(document).on("activate", function (e, target, opts) {
    if (y.page && y.page.id === "ss_dashboard") {
        y.updateDashBoard();
    }
});

$("#css_login_toggle_left").click(function () {
    $("#css_login_block_top").toggle();
});

/**
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
            window.location = y.skin + "?page_id=ss_dashboard";
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
*/
