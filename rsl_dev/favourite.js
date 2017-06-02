/* global $, y, console */

function addAdvertToFavourites(rqmt_splr) {
    $.ajax({
        url: "dyn/?mode=addFavourite",
        type: "POST",
        data: {
            rqmt_splr: rqmt_splr,
        },
        // timeout: (y.page && y.page.browser_timeout) || y.server_timeout,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back) {
            try {
                data_back = JSON.parse(data_back);
                if (data_back && Object.hasOwnProperty.call(data_back, "msg")) {
                    x.ui.main.clearMessages();
                    x.ui.main.reportMessage({
                        text: data_back.msg.text,
                        type: data_back.msg.type,
                    });
                    $(window).scrollTop(0);
                }
            } catch (e) {
                x.ui.clearMessages();
            }
        },
        error: function (xml_http_request, text_status) {
            x.ui.main.reportMessage({
                text: xml_http_request.responseText || text_status,
            });
        },
    });
}

(function () {
    $(".favourite_icon").each(function () {
        $(this).click(function (event) {
            event.stopPropagation();
            addAdvertToFavourites($(this).attr("rqmt_splr"));
        });
    });
}());
