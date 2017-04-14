var loaded = false;
var last_hash = "";
var base = (typeof myr_src != "undefined") ? myr_src : "https://localhost:8443/sfwk_devt/";
var myr_src = base; // to support situations where is undefined
//Message handler
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
(function($){
    function changeIframeSrc() {
        last_hash = window.location.hash.replace("#", "");
        var e,
            a = /\+/g, // Regex for replacing addition symbol with a space
            r = /([^&=]+)=?([^&]*)/g,
            d = function (s) {
                return decodeURIComponent(s.replace(a, " "));
            },
            q = decodeURIComponent(window.location.hash.substring(1)),
            out = {},
            src = "";

        while (e = r.exec(q)) {
            out[d(e[1])] = d(e[2]);
        }

        if (out.page_id) {
            src += "?page_id=" + out.page_id;

            if (out.page_key) {
                src += "&page_key=" + out.page_key;
            }
        }
        for (var p in out) {
            if (p === "page_id" || p === "page_key") {
                continue;
            }
            if (src === "") {
                src += "?" + p + "=" + out[p];
            } else {
                src += "&" + p + "=" + out[p];
            }
        }
        src = base + src;
        updateIframe({
            height: 400
        }); // Minimum height
        $('iframe#myrecruiter').attr("src", src);
    }

    function updateIframe(p) {
        var iFrame = $('iframe#myrecruiter');
        if (p.cookie_redirect) {
            window.location = p.cookie_redirect + "?url=" + encodeURIComponent(window.location);
        }

        if (p.height && p.height >= 400) {
            iFrame.height(p.height);
        }
        if (typeof p.scroll === "number") {
            $(window).scrollTop(p.scroll);
        }
        if (p.hash && loaded) {
            if (p.hash !== last_hash && p.hash !== window.location.hash) {
                window.location.hash = p.hash;
                last_hash = p.hash;
                $(window).scrollTop(0); //scroll to the top on new page
            }
        }
        if (p.title) {
            document.title = p.title;
        }
    }

    // Relies upon jquery.ba-hashchange.js to detect hash change
    // Currently in style folder - move to rsl_shared at some point
    $(window).on("hashchange", function (e) {
        var new_hash = window.location.hash.replace("#", "");
        if (loaded && last_hash !== new_hash) {
            changeIframeSrc();
        }
    });

    // Listen to message from child IFrame window
    eventer(messageEvent, function (e) {
        var p = jQuery.parseJSON(e.data);
        var msg;
        updateIframe(p);
        msg = '{"host_url":"' 
            + window.location.protocol
            + "//"
            + window.location.host
            + window.location.pathname
            + '#"}';

        // Post Host URL to iframe
        $('iframe#myrecruiter')[0].contentWindow.postMessage(msg, myr_src);
    }, false);

    // Initial Load
    $(document).ready(function () {
        var $myr_frame = $('iframe#myrecruiter');
        var myr_frame_orig_src = $myr_frame.attr("src");

        if (myr_frame_orig_src) {
            myr_src = myr_frame_orig_src;
        }

        changeIframeSrc();

        $myr_frame[0].contentWindow.postMessage('{"start_ping":true}', myr_src);

        loaded = true;
    });
})(window.jQuery || window.Zepto);