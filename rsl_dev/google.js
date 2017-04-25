var googleUser = {};

function attachSignin(element) {
    auth2.attachClickHandler(element, {},
        function (googleUser) {
            y.socialLogin({
                user_id: googleUser.getBasicProfile().getId(),
                token: googleUser.getAuthResponse().id_token,
                source: "google",
            });
        }, function (error) {
            y.addMessage("Failed to login to Google", "E");
            console.log(JSON.stringify(error, undefined, 2));
        }
    );
}

function initGoogle() {
    $(".css_page_links").append("<a id='googleBtn' class='btn btn-social btn-google'><span class='fa fa-google'></span> Sign in with Google</a>");
    gapi.load("auth2", function () {
        auth2 = gapi.auth2.init({
            client_id: y.google_client_id + ".apps.googleusercontent.com",
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
