"use strict";

$(document).ready(function () {
    function handle_mail_to() {
        if (y.mailto_opened) {
            return;
        }

        y.mailto_opened = true;

        setTimeout(function () {
            var local_iframe = $("<iframe id='emailClientTrigger' target='_blank' src='" + y.page.mailto_url + "'/>");

            function closeTab() {
                if (window.close) {
                    window.close();
                }
                if (self.close) {
                    self.close();
                }
            }

            $("body").append(local_iframe);
            local_iframe.hide();

            return setTimeout(function () {
                setTimeout(closeTab, 1000);
                setTimeout(function () {
                    window.location = y.page.mailto_redirect_if_no_closed;
                }, 3000);
            }, 10);
        }, 0);
    }

    if (y.page && y.page.mailto_url) {
        handle_mail_to();
    }

    $(document).on("loadSuccess", handle_mail_to);
});
