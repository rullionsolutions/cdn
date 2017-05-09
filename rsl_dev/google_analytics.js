/* global gapi, $ */
"use strict";

(function(w,d,s,g,js,fs){
  g=w.gapi||(w.gapi={});g.analytics={q:[],ready:function(f){this.q.push(f);}};
  js=d.createElement(s);fs=d.getElementsByTagName(s)[0];
  js.src='https://apis.google.com/js/platform.js';
  fs.parentNode.insertBefore(js,fs);js.onload=function(){g.load('analytics');};
}(window,document,'script'));

function renderCharts() {
    $(".analytics-chart").each(function (index) {
        var chart = new gapi.analytics.googleCharts.DataChart({
            query: $(this).data("query"),
            chart: $(this).data("chart"),
        });
        var variable_data = {
            query: {
                "start-date": $("#ga-date-start").val(),
                "end-date": $("#ga-date-end").val(),
            },
        };
        chart.set(variable_data).execute();
    });
}

gapi.analytics.ready(function () {
    /**
     * Authorize the user with an access token obtained server side.
     */
    gapi.analytics.auth.authorize({
        serverAuth: {
            access_token: $("#analytics-auth").data("token"),
        },
    });

    renderCharts();
    $("ul#css_page_tabs > li").click(location.reload.bind(window.location));
    $("#ga-date-start").change(renderCharts);
    $("#ga-date-end").change(renderCharts);
});
