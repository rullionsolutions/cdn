/* global $, y, console */

function addAdvertToFavourites(job_id) {
    console.log(job_id);
    $.ajax({
        url: y.getAjaxURL("jsp/main.jsp", "mode=addFavourite"),
        type: "POST",
        data: {
            job_id: job_id,
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
            var job_id = $(this).attr("job_id");
            event.stopPropagation();
            addAdvertToFavourites(job_id);
        });
    });
}());
