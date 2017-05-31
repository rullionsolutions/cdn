(function () {
    var highest = 0;
    var divs = [];

    $(".css_section_DashboardSection").each(function () {
        var h;
        $(this).removeAttr("style");
        $(this).height("auto");
        h = $(this).outerHeight();
        if (h > highest) {
            highest = h;
        }
        divs.push([
            $(this),
            h,
        ]);
    });
    divs.forEach(function (d) {
        var b;
        $(d[0]).height(highest);
        b = $("#" + $(d[0]).attr("id") + "> div > .btn");
        if (b) {
            console.log(highest + ", " + d[1]);
            b.css("margin-top", highest - d[1]);
        }
    });
}());
