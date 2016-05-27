function doSearch() {
    var params_obj = {},
        params = "",
        url = "page_id=" + (y.default_page || "ss_job_search");
    $("#quick_search").each(function(item){
        $(this).find(":input").each(function(){
            var val,
                id;
            val = $(this).val();
            if (val && val!=="") {
                id = $(this).attr("name");
                params_obj[id] = val;
                params_obj['page_button'] = "page_search";
            }
        });
    });
    params = y.joinParams(params_obj);
    url += (params ? "&"+params: "");
    url = y.getRedirectURL({}, url);
    console.log(url);
    y.loadQueryString($("div#css_body"), url, { load_mode: "main" });
}

function setupDate(field) {
    var dp_settings,
        json_obj = y.getRenderData($(field));
    y.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
    y.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
    dp_settings = {
//      showOn: "button",
//      buttonImage: "/cdn/Axialis/Png/16x16/Calendar.png",
//      buttonImageOnly: true,
        dateFormat: "dd/mm/y",          // 2-digit year
        shortYearCutoff: +50
    };
    if (json_obj.min) {
        dp_settings.minDate = new Date(json_obj.min);
    }
    if (json_obj.max) {
        dp_settings.maxDate = new Date(json_obj.max);
    }

    //$(field).datepicker(dp_settings);

    if (json_obj.input_mask) {
        y.checkScript("/cdn/jquery.maskedinput/jquery.maskedinput.min.js");
        $(field).find(":input").mask(json_obj.input_mask);
    }
}


$("#quick_search").each(function(item){
    $(this).html('<div class="accordion-heading">\
            <a class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#css_top_bar" href="#collapse_search" style="text-align:right;font-size:12pt;font-weight:bold">Quick search  <span style="vertical-align:middle" class="icon-large icon-search"></span></a>\
            </div>\
            <div class="accordion-body collapse" id="collapse_search" style="height: 0px;">\
                <div class="accordion-inner">\
                    <table class="css_search_filters"><tbody>\
                        <tr><td class="css_filter_label"><label class="control-label" for="keywords_0_filt">Advert Contains</label></td><td class="css_filter_oper_disp"></td><td class="css_filter_val"><div id="keywords_0_filt" class="css_type_text css_edit"><input id="keywords_0_filt" class="input-large" value="" name="keywords_0_filt" type="text"><span class="css_hide css_render_data">{"auto_search_oper":"KW"}</span></div></td></tr>\
                        <tr><td class="css_filter_label"><label class="control-label" for="postcode_0">Located</label></td><td class="css_filter_oper_disp"></td><td id="postcode_0" class="css_filter_val"><label class="control-label" for="postcode_0_filt2" style="position:absolute;left:-99999px;">Distance from postcode</label><input id="postcode_0_filt2" class="input-mini" value="50" name="postcode_0_filt2" type="text"><span style="vertical-align:middle;padding-left:10px;padding-right:10px;">km of postcode</span><label class="control-label" for="postcode_0_filt" style="position:absolute;left:-99999px;">Postcode</label><input id="postcode_0_filt" class="input-small" value="" name="postcode_0_filt" type="text"><span class="css_hide css_render_data">{"regex_label":"not a valid UK postcode","regex_pattern":"^[A-Z]{1,2}[0-9]{1,2}","before_validation":"toUpperCase","auto_search_oper":"LT"}</span></td>\
                        <td><button class="btn-primary btn" id="quick_search_btn">Search ➤</button></td></tr></tbody></table>\
                </div>\
        </div>');

    $(this).find("div.css_edit").each(function(){
        var json_obj = y.getRenderData($(this));

        if ($(this).hasClass("css_type_date")) {
            setupDate($(this));
        } else if (json_obj.input_mask) {
            console.log("setting up date field");
            y.checkScript("/cdn/jquery.maskedinput/jquery.maskedinput.min.js");
            $(this).find(":input").mask(json_obj.input_mask);
        }
    });
    $(this).find("#quick_search_btn").each(function(){
        $(this).click(doSearch);
    });

});


