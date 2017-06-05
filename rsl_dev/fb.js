window.fbAsyncInit = function () {
    FB.init({
        appId: x.ui.facebook_app_id,
        cookie: true,  // enable cookies to allow the server to access
        xfbml: true,  // parse social plugins on this page
        version: "v2.8", // use graph api version 2.8
    });
};

(function (d, s, id) {
    var js;
    var fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, "script", "facebook-jssdk"));

function initFB() {
    $(".css_page_links").append("<a class='btn btn-social btn-facebook' onclick='FBLogin();'><span class='fa fa-facebook'></span> Sign in with Facebook</a>");
}

(function () {
    initFB();
}());

$(document).on("initialize", function (e, target, opts) {
    initFB();
});

function reRequestPermissions() {
    bootbox.confirm("To be able to create you an account we need access to your basic information and email", function (confirm) {
        if (confirm) {
            FB.login(statusChangeCallback, {
                scope: "email,public_profile",
                info_fields: "email,name",
                auth_type: "rerequest",
            });
        }
    });
}

function checkRequest(r) {
    FB.api("/me/permissions", function (response) {
        var declined = [];
        response.data.forEach(function (resp) {
            if (resp.status === "declined") {
                declined.push(resp.permission);
            }
        });

        if (declined.length > 0) {
            reRequestPermissions();
        } else if (declined.length === 0) {
            x.ui.main.socialLogin({
                user_id: r.authResponse.userID,
                token: r.authResponse.accessToken,
                source: "fb",
            }, function () {
                FB.AppEvents.logEvent("loginSuccess");
            }, function () {
                FB.AppEvents.logEvent("loginFail");
            });
        }
    });
}

function statusChangeCallback(response) {
    if (response.status === "connected") {
        checkRequest(response);
    } else {
        x.ui.main.clearMessages();
        x.ui.main.reportMessage({
            text: "Failed to login to Facebook",
            type: "E",
        });
    }
}

function FBLogin() {
    FB.login(statusChangeCallback, {
        scope: "email,public_profile",
        info_fields: "email,name",
    });
}
