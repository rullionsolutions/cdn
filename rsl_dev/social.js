x.ui.facebook_app_id = "986331034712589";
x.ui.google_client_id = "846812482710";

x.ui.main.socialLogin = function (post_data, login_event, login_fail_event) {
    var that = this;
    function postLogin(data_back) {
        that.clearMessages();
        if (typeof data_back === "string") {        // Login failed
            $(".css_not_logged_in").removeClass("css_not_logged_in");
            that.reportMessage({
                text: "Sorry, the user and password entered are not valid",
                type: "E",
            });
            $("div#css_body").trigger("activate",
                [
                    $("div#css_body"),
                    { load_mode: "main", },
                ]
            );
        } else {
            if (data_back.msg) {
                that.clearMessages();
                that.reportMessage({
                    type: data_back.type,
                    text: data_back.msg,
                });
            }
            if (!data_back.redirect) {
                if (typeof login_fail_event === "function") {
                    login_fail_event();
                }
            } else if (data_back.redirect) {
                if (typeof login_event === "function") {
                    login_event();
                }
                that.forceLoad(data_back.redirect);
            }
        }
    }

    $.ajax({
        url: "dyn/?mode=socialLogin",
        type: "POST",
        data: post_data,
        // timeout: y.server_timeout,
        cache: false,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back) {
            postLogin(data_back);
        },
        error: function (xml_http_request, text_status) {
            that.clearMessages();
            that.reportMessage({
                text: "Server not responding #3 - " + text_status + "<br/>" + xml_http_request.responseText,
            });
            $("div#css_body").trigger("activate",
                [
                    $("div#css_body"),
                    { load_mode: "main", },
                ]
            );
        },
    });
};

