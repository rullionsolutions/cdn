"use strict";

$(document).ready( function() {
    y.updateDate();
    y.load($("div#css_body"), y.queryParams(), { main_page: true });

    $("#css_login_toggle_left").click(function() {
        $("#css_login_block_top").toggle();
        y.update_iframe();
    });
});

$(document).on("loadSuccess", function (e, target, params, opts, data_back) {
     if (y.page && y.page.id === y.dashboard_page) {
         $("#welcome_dashboard").show();
         $("#welcome"          ).hide();
         $(".css_accnt").text((y.session.chameleon ? "[" + y.session.chameleon + "] " : "" ) + y.session.user_name.split(",")[1]);
     }
     if (y.page && y.page.id === y.application_page) {
        $("#welcome").hide();
     }
     if (y.page && y.page.tasks && y.page.tasks > 0) {
         $(".task_count").show();
         $(".task_count").html(y.page.tasks);
     }
});