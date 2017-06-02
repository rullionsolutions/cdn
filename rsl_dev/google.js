var googleUser = {};

function attachSignin(element) {
    auth2.attachClickHandler(element, {},
        function (googleUser) {
            x.ui.socialLogin({
                user_id: googleUser.getBasicProfile().getId(),
                token: googleUser.getAuthResponse().id_token,
                source: "google",
            });
        }, function (error) {
            x.ui.reportMessage({
                text: "Failed to login to Google",
                type: "E",
            });
        }
    );
}

function initGoogle() {
    $(".css_page_links").append("<a id='googleBtn' class='btn btn-social btn-google'><span class='fa fa-google'></span> Sign in with Google</a>");
    gapi.load("auth2", function () {
        auth2 = gapi.auth2.init({
            client_id: x.ui.google_client_id + ".apps.googleusercontent.com",
            cookiepolicy: "single_host_origin",
        });
        attachSignin(document.getElementById("googleBtn"));
    });
}

(function () {
    initGoogle();
}());

$(document).on("initialize", function (e, target, opts) {
    initGoogle();
});
