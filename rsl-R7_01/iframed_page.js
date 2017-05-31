y.update_iframe = function (target, redirect) {
    var params = {};
    var hash = "";
    var height1;
    var height2;
    var title = "";

    //Resize iframe if present
    if (top !== self) {
        if (redirect) {
            window.parent.postMessage('{"cookie_redirect":"'+redirect+'"}', "*");
            return;
        }

        if (!target) {
            target = $(".css_load_target").first();
        }

        params.page_id = target.data("page_id");
        params.page_key = target.data("page_key");

        if (!params.page_key) {
            delete params.page_key;
        }

        // Use helper file on client's domain to avoid cross domain problems
        height1 = 40;
        height2 = $("div#css_content").height() + 40;
        if (y.iframe_title) {
            title = y.iframe_title + " - " + $("span#css_page_header_title").text();
        }
        if (params.page_id) {
            hash += "page_id=" + params.page_id;
            if (params.page_key) {
                hash += "&page_key=" + params.page_key;
            }
        }

        $('#css_left_bar').children().each(function () {
            var add = true;

            // Don't add height if no messages
            if ($(this).hasClass('css_messages') && $(this).children().length == 0) {
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
        y.update_iframe(target);
    }
});

//Update iframe on window resize
$(window).resize(function () {
    y.update_iframe();
});

y.handleGuestLoop = function () {
    if (top !== self && document.cookie.indexOf("JSESSIONID")) {
        var redirect = String(window.location.protocol + "//" +  window.location.host + window.location.pathname).replace(y.skin, "") + "redirect.html";
        // Redirect to cookie acceptance page
        $('body').css("cursor","default");
        $('div#css_top_bar').addClass("css_hide");
        $('div#css_page_header > h1').text("Current vacancies - Cookies required");
        $("div#css_body").empty();
        $("div#css_body").html(
             '<p>The use of this site requires cookies. Please click the button below to accept.</p></br>'
            +'<button class="btn" onclick="y.update_iframe(null,\'' + redirect + '\');">Click to Accept</button>'
        );
    } else {
        y.reportError("Sorry, this device is not currently supported");
    }
};

// Message handler
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
// Listen to message from child IFrame window
eventer(messageEvent, function (e) {
    var p;

    try {
        p = jQuery.parseJSON(e.data);
    } catch (e) {
        p = {};
    }
    // content to iframe 'ping'
    if (p.start_ping) {
        setTimeout(y.ping_iframe, 100);
    }
}, false);

// 'ping' between iframe content i.e. this and the host
y.ping_iframe = function () {
    setTimeout(y.ping_iframe, 100);
    y.update_iframe();
};
// iframe code end
