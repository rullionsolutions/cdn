if (y.page.social_links) {
    $(".css_share_links").empty();
    $("div#css_left_bar .css_share_links").append("<p>Share to...  </p>");
    $("div#css_top_bar .css_share_links").append("<p>Share to...  </p>");
    for (i = 0; y.page.social_links && i < y.page.social_links.length; i += 1) {
        link = y.page.social_links[i];
        addl = "href='" + link.url + "'" + (link.target ? " target='" + link.target + "'" : "");
        
        addl += ">"+/* + link.label + " " + y.arrow_entity + */"</a>";
        classes = "btn "+link.target;
        if (link.open_in_modal === true) {
            classes += " css_open_in_modal";
        }
        
        $("div#css_left_bar .css_share_links").append("<a class='" + classes+ "' " + addl);
        $("div#css_top_bar  .css_share_links").append("<a class='" + classes + "'           " + addl);
    }
}
