$(document).ready(function () {
    $("#css_page_print").find(".css_chart").each(function() {
        var json,
            obj,
            new_obj;

        json = $(this).find("span.css_hide").text();
        obj  = $.parseJSON(json);
        new_obj = obj.options;
        new_obj.series = obj.series;
	for (var i in new_obj.series) {
            new_obj.series[i].animation = false;
        }
        new_obj.chart.renderTo = $(this).attr("id");
        new Highcharts.Chart(new_obj);
    });
});
