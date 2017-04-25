y.facebook_app_id = "986331034712589";
y.google_client_id = "846812482710";

y.socialLogin = function (post_data, login_event, login_fail_event) {
    var request_page = window.location.search;
    function postLogin(data_back) {
        y.clearMessages();
        if (typeof data_back === "string") {        // Login failed
            $(".css_not_logged_in").removeClass("css_not_logged_in");
            y.addMessage("Sorry, the user and password entered are not valid", "E");
            $("div#css_body").trigger("activate",
                [
                    $("div#css_body"),
                    { load_mode: "main", },
                ]
            );
        } else {
            if (data_back.msg) {
                y.clearMessages();
                y.addMessage(data_back.msg, data_back.type);
            }
            if (!data_back.redirect) {
                if (typeof login_fail_event === "function") {
                    login_fail_event();
                }
            } else if (data_back.redirect) {
                if (typeof login_event === "function") {
                    login_event();
                }
                window.location = y.getRedirectURL(data_back, request_page);
            }

        }
    }

    $.ajax({ url: y.getAjaxURL("jsp/main.jsp", "mode=socialLogin"),
      type: "POST",
      data: post_data,
      timeout: y.server_timeout,
      cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function(data_back) {
            postLogin(data_back);
        },
        error: function (xml_http_request, text_status) {
            y.clearMessages();
            y.addMessage("Server not responding #3 - " + text_status + "<br/>" + xml_http_request.responseText);
            $("div#css_body").trigger("activate",
                [
                    $("div#css_body"),
                    { load_mode: "main", },
                ]
            );
        },
    });
};

