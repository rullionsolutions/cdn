/* global gapi, $ */
"use strict";

(function(w,d,s,g,js,fs){
  g=w.gapi||(w.gapi={});g.analytics={q:[],ready:function(f){this.q.push(f);}};
  js=d.createElement(s);fs=d.getElementsByTagName(s)[0];
  js.src='https://apis.google.com/js/platform.js';
  fs.parentNode.insertBefore(js,fs);js.onload=function(){g.load('analytics');};
}(window,document,'script'));

// TODO Fix apparent race conditionin events when switching tabs
function renderCharts() {
    $(".analytics-chart").each(function (index) {
        var chart = new gapi.analytics.googleCharts.DataChart({
            query: $(this).data("query"),
            chart: $(this).data("chart"),
        });
        chart.execute();
    });
}

// TODO Look into another way to sort this out, having multiple calls to this feels messy, but
// alternatively, including the GA specific stuff in the master.js event binding does too...
$(document).on("loadSuccess", function () {
    $("ul#css_page_tabs > li").click(renderCharts);
});

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
});
