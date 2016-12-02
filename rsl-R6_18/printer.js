/*global $, confirm, formatDate */
/*jslint browser: true */
"use strict";

var y = {},
    Viz,
    Highcharts;


y.setupChart = function () {
    var json,
        obj,
        new_obj,
        i,
        j,
        temp,
        date_str,
        num;

    json = $(this).find("span.css_hide").text();
    obj  = $.parseJSON(json);
    if (obj.library === "flot") {
        y.checkScript("/cdn/jquery.flot/jquery.flot.min.js");
        y.checkScript("/cdn/jquery.flot/jquery.flot.stack.min.js");
        $(this).find("div.css_chart").css("width" , obj.options.width  || "900px");
        $(this).find("div.css_chart").css("height", obj.options.height || "400px");
        $.plot($(this).find("div.css_chart"), obj.series, obj.options);
    } else if (obj.library === "highcharts") {
        y.checkScript("/cdn/highcharts-3.0.10/highcharts.js");
        y.checkScript("/cdn/highcharts-3.0.10/highcharts-more.js");
        y.checkScript("/cdn/highcharts-3.0.10/exporting.js");
        y.checkScript("rullion/highcharts_defaults.js");
        for (i = 0; i < obj.series.length; i += 1) {
            if (obj.series[i].x_type === "date") {
                for (j = 0; j < obj.series[i].data.length; j += 1) {
                    date_str = obj.series[i].data[j][0];
                    temp = date_str.split("-");
                    num = Date.UTC(parseInt(temp[0], 10), parseInt(temp[1], 10), parseInt(temp[2], 10));
    //              console.log("Series " + i + " index " + j + ", converting: " + date_str + " to " + num + " with val: " + obj.series[i].data[j][1]);
                    obj.series[i].data[j][0] = num;
                }
            }
        }
        new_obj = obj.options;
        new_obj.series = obj.series;
        new_obj.chart.renderTo = "css_chart_" + $(this).attr("id");
        new Highcharts.Chart(new_obj);
//    } else if (obj.library === "google") {
        // TODO
    }
};

