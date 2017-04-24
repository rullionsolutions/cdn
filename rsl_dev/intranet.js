"use strict";

y.skin = "intranet.html";
y.default_guest = "guest_int";
y.default_page = "ss_job_search_int";
y.dashboard_page = "ss_dashboard_int";
y.application_page = "ss_applications_int";

// iframe code start
/**
* use to override parents title
* full title has format 'y.iframe_title - page_title'
*/
// y.iframe_title = "Internal Careers Site";

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-36505379-1']);
_gaq.push(['_setDomainName', 'rullionsolutions.com']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

/** y.login
* @override postLogin else
*/
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
            window.location = y.skin + "?page_id=ss_dashboard_int";
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

