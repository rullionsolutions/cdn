/* global $, y, console */

function addAdvertToFavourites(rqmt_splr) {
    console.log(rqmt_splr);
    $.ajax({
        url: y.getAjaxURL("jsp/main.jsp", "mode=addFavourite"),
        type: "POST",
        data: {
            rqmt_splr: rqmt_splr,
        },
        timeout: (y.page && y.page.browser_timeout) || y.server_timeout,
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader("If-Modified-Since", "");
        },
        success: function (data_back) {
            try {
                data_back = JSON.parse(data_back);
                if (data_back && Object.hasOwnProperty.call(data_back, "msg")) {
                    y.clearMessages();
                    y.addMessage(data_back.msg.text, data_back.msg.type);
                }
            } catch (e) {
                y.clearMessages();
            }
        },
        error: function (xml_http_request, text_status) {
            y.reportError(xml_http_request.responseText || text_status);
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
