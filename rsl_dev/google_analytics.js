/* global gapi, $, google */
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
        var variable_data = {};

        if ($("#ga-date-start") && $("#ga-date-end")) {
            variable_data.query = {
                // TODO this method introduces an out-by-one error due to daylight savings
                // (getDate returns a jsDate at midnight local time, toISOString outputs UTC)
                "start-date": $("#ga-date-start > input").datepicker("getDate").toISOString().slice(0, 10),
                "end-date": $("#ga-date-end > input").datepicker("getDate").toISOString().slice(0, 10),
            };
        }
        chart.set(variable_data).execute();
    });
    $(".analytics-rt").each(function (index) {
        var that = this;
        gapi.client.analytics.data.realtime.get($(this).data("query")).execute(function (results) {
            var data;
            var chart;
            var data_query = $(that).data("query");
            var data_chart = $(that).data("chart");
            var minute;

            if (data_chart && results.rows && results.rows.length > 0) {
                data = new google.visualization.DataTable();
                data.addColumn("number", data_query.dimensions);
                data.addColumn("number", data_query.metrics);

                function getValsPerMinute(minute) {
                    var result;
                    results.rows.forEach(function (row) {
                        if (parseInt(row[0], 10) === minute) {
                            result = [
                                minute,
                                parseInt(row[1], 10),
                            ];
                        }
                    });
                    if (!result) {
                        result = [
                            minute,
                            0,
                        ];
                    }
                    return result;
                }
                for (minute = 0; minute < 30; minute += 1) {
                    data.addRow(getValsPerMinute(minute));
                }

                switch (data_chart.type) {
                    case "BAR":
                        // Column is just a vertical bar
                        chart = new google.visualization.ColumnChart(document.getElementById(data_chart.container));
                        break;
                    default:
                        break;
                }
                chart.draw(data, data_chart.options);
            } else {
                $(that).text(results.totalResults);
            }
        });
    });
}

gapi.analytics.ready(function () {
    if ($(".analytics.rt")) {
        google.charts.load("current", {
            packages: [
                "corechart",
            ],
        });
    }

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
    $("#ga-date-start > input").change(renderCharts);
    $("#ga-date-end > input").change(renderCharts);
});
