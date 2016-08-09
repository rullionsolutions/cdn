/*jslint browser: true */
/*global x, $, confirm, formatDate, Highcharts, qq, Aloha, Viz */
"use strict";

var Aloha;

if (typeof x !== "object") {
    throw new Error("ui.js not loaded");
}
// Relies on ui.js

/*--------------------------------------------------------- Fields -------------------------------------------------------------
* The field object represents a specific instance of a field control in the UI, with markup as follows:
*       <div class='control-group' ...             -- form-group in TB3
*
* Subclasses are identified by additional class in the above, css_type_...
* This div may then contain...
*       <label>
*       <span class='form-control-static'>      -- uneditable text content

*/


x.field = {
    id: "x.field",
    min_parts_expected: 1,          // fewest input controls anticipated per field } set either null
    max_parts_expected: 1           //   most input controls anticipated per field } to bypass check
};


x.field.clone = function (id) {
    var obj = Object.create(this);
    if (!id || typeof id !== "string") {
        throw new Error("invalid id on clone()");
    }
    obj.id  = id;
    return obj;
};


x.field.debug = function (msg) {
    console.log("DEBUG: " + this.id + ", " + msg);
};


x.field.instantiate = function (elem) {
    var obj  = Object.create(this);
    obj.elem = elem;
    obj.ui   = x.ui.getLocal(elem);
    obj.control_id = $(elem).attr("id");
    obj.id   = this.id + "." + obj.control_id;
    return obj;
};


// declare all subclasses here...
x.field.attributes    = x.field.clone("x.field.attributes");
x.field.autocompleter = x.field.clone("x.field.autocompleter");
x.field.combo         = x.field.autocompleter.clone("x.field.combo");
x.field.date          = x.field.clone("x.field.date");
x.field.datetime      = x.field.clone("x.field.datetime");
x.field.dotgraph      = x.field.clone("x.field.dotgraph");
x.field.dropdown      = x.field.clone("x.field.dropdown");
x.field.file          = x.field.clone("x.field.file");
x.field.number        = x.field.clone("x.field.number");
x.field.richtext      = x.field.clone("x.field.richtext");


// Note: 'elem' should be div.control-group
$(document).on("activateUI", function () {
    x.field.debug("field.js [activateUI]");
    x.field.edit_fields = {};
    x.ui.getLocal(this).focus_next_input = true;        // focus first editable field, unless another was focused before reload
    $(this).find(".css_edit").each(function () {
        x.field.getFieldObject(this).activate();
    });
    $(this).find(".css_disp").each(function () {
        x.field.getFieldObject(this).activate();
    });
});


x.field.getFieldObject = function (elem) {
    var field_object = $(elem).data("field_object"),
        json_str;

    x.field.debug("getFieldObject() " + elem);
    if (!field_object) {
        if ($(elem).hasClass("css_type_attributes")) {
            field_object = x.field.attributes   .instantiate(elem);
        } else if ($(elem).hasClass("css_type_autocompleter")) {
            field_object = x.field.autocompleter.instantiate(elem);
        } else if ($(elem).hasClass("css_type_combo")) {
            field_object = x.field.combo        .instantiate(elem);
        } else if ($(elem).hasClass("css_type_date")) {
            field_object = x.field.date         .instantiate(elem);
        } else if ($(elem).hasClass("css_type_datetime")) {
            field_object = x.field.datetime     .instantiate(elem);
        } else if ($(elem).hasClass("css_type_dotgraph")) {
            field_object = x.field.dotgraph     .instantiate(elem);
        } else if ($(elem).hasClass("css_type_dropdown")) {
            field_object = x.field.dropdown     .instantiate(elem);
        } else if ($(elem).hasClass("css_type_file")) {
            field_object = x.field.file         .instantiate(elem);
        } else if ($(elem).hasClass("css_type_number")) {
            field_object = x.field.number       .instantiate(elem);
        } else if ($(elem).hasClass("css_richtext")) {
            field_object = x.field.richtext     .instantiate(elem);
        } else {
            field_object = x.field              .instantiate(elem);
        }
        $(elem).data("field_object", field_object);
        json_str = $(elem).find(".css_render_data").text();
        field_object.server_data = json_str ? $.parseJSON(json_str) : {};
        if (field_object.server_data.min_parts_expected) {
            field_object.min_parts_expected = field_object.server_data.min_parts_expected;
        }
        if (field_object.server_data.max_parts_expected) {
            field_object.max_parts_expected = field_object.server_data.max_parts_expected;
        }
    }
    return field_object;
};


x.field.activate = function () {
    this.debug("activate()");
    if ($(this.elem).hasClass("css_edit")) {
        if (this.edit_fields[this.control_id]) {
            throw new Error("duplicate edit field id: " + this.control_id);
        }
        this.edit_fields[this.control_id] = this;
        this.activateEditable();
        this.performValidation();
    } else {
        this.activateUneditable();
    }
};


x.field.activateEditable   = function () {
    this.debug("activateEditable()");
    this.client_messages = $(this.elem).find("span.css_client_messages").text();
    this.server_messages = $(this.elem).find("span.css_server_messages").text();
    if ($(this.elem).find("span.css_client_messages").length === 0) {
        $(this.elem).children("div.controls").append("<span class='help-block css_client_messages' />");
    }
    if (this.server_data.input_mask) {
        x.ui.main.checkScript("/cdn/jquery.maskedinput/jquery.maskedinput.min.js");
        $(this.elem).find(":input:eq(0)").mask(this.server_data.input_mask);
    }

    if (this.ui.focus_next_input) {
        $(this.elem).find(":input:eq(0)").focus();
        this.ui.focus_next_input = false;
    }
    if (this.ui.last_focus_field_before_reload === this.control_id) {
        this.ui.focus_next_input = true;
    }
};


x.field.activateUneditable = function () {
    return undefined;
};


x.field.performValidation  = function () {
    this.msg_arr = [];
    this.debug("performValidation() " + this.msg_arr);
    this.validate();
    this.renderFieldMessages();
};


x.field.validate = function () {
    var val = this.getValue(),
        regex;

    this.debug("validate()");
    if ($(this.elem).hasClass("css_mand") && this.isBlank() /*&& this.ui.reload_count > 0*/) {
        this.addMessage('E', "mandatory");
    }
    if (this.server_data.data_length && this.server_data.data_length > -1 && val && val.length > this.server_data.data_length) {
        this.addMessage('E', "field length is " + val.length + " characters, which is longer than the limit of " + this.server_data.data_length + " characters");
    }
    if (this.server_data.regex_pattern && val) {
        regex = new RegExp(this.server_data.regex_pattern);
        if (!regex.exec(val)) {
            this.addMessage('E', this.server_data.regex_label || "not valid");
        }
    }
};


x.field.addMessage = function (msg_type, msg_text) {
    this.debug("addMessage(): " + msg_text);
    this.msg_arr.push({ type: msg_type, text: msg_text });
};


x.field.renderFieldMessages = function () {
    var i,
        worst_type = (this.server_messages ? 'E' : null),
        text = "";

    this.debug("renderFieldMessages()");
    for (i = 0; i < this.msg_arr.length; i += 1) {
        text += (i > 0 ? ", " : "") + this.msg_arr[i].text;
        if (this.msg_arr[i].type === 'I' && !worst_type) {
            worst_type = 'I';
        }
        if (this.msg_arr[i].type === 'W' && worst_type !== 'E') {
            worst_type = 'W';
        }
        if (this.msg_arr[i].type === 'E') {
            worst_type = 'E';
        }
    }
    // if ($(this.elem).hasClass($(this.elem).children("span.form-control-feedback").length === 0) {
    //     $(this.elem).append("<span class='glyphicon form-control-feedback' aria-hidden='true'></span>");
    // }
        $(this.elem).removeClass("success");
        $(this.elem).removeClass("warning");
        $(this.elem).removeClass("error");
        // TB3...
        // $(this.elem).removeClass("has-success");
        // $(this.elem).removeClass("has-warning");
        // $(this.elem).removeClass("has-error");
        // $(this.elem).children("span.form-control-feedback").removeClass("glyphicon-ok");
        // $(this.elem).children("span.form-control-feedback").removeClass("glyphicon-warning-sign");
        // $(this.elem).children("span.form-control-feedback").removeClass("glyphicon-remove");
    if (worst_type === 'I') {
        $(this.elem).   addClass("success");
        // $(this.elem).   addClass("has-feedback");
        // $(this.elem).   addClass("has-success");
        // $(this.elem).children("span.form-control-feedback").   addClass("glyphicon-ok");
    } else if (worst_type === 'W') {
        $(this.elem).   addClass("warning");
        // $(this.elem).   addClass("has-feedback");
        // $(this.elem).   addClass("has-warning");
        // $(this.elem).children("span.form-control-feedback").   addClass("glyphicon-warning-sign");
    } else if (worst_type === 'E') {
        $(this.elem).   addClass("error");
        // $(this.elem).   addClass("has-feedback");
        // $(this.elem).   addClass("has-error");
        // $(this.elem).children("span.form-control-feedback").   addClass("glyphicon-remove");
    }
    if (text) {
        $(this.elem).find("span.css_client_messages").text(text);
        $(this.elem).find("span.css_client_messages").removeClass("css_hide");
    } else {
        $(this.elem).find("span.css_client_messages").   addClass("css_hide");
    }
};


x.field.isBlank = function () {
    return !this.getValue();
};


x.field.getValue = function () {
    var val = "",
        delim = "",
        parts = 0;

    this.debug("getValue()");
    $(this.elem).find(":input").each(function () {
        var part_val;
        parts += 1;
        if ($(this).filter(":checkbox, :radio").not(":checked").length > 0) {
            return;
        }
        part_val = $(this).val();
        // MUST put a pipe delimiter between EVERY input in the field, to ensure correct interpretation by the server
        // if (part_val) {
            val += delim + part_val;
            delim = "|";
        // }
    });

    if (typeof this.min_parts_expected === "number" && parts < this.min_parts_expected) {
        throw new Error("too few  control parts - found: " + parts + ", min expected: " + this.min_parts_expected + " for " + this.control_id);
    }
    if (typeof this.max_parts_expected === "number" && parts > this.max_parts_expected) {
        throw new Error("too many control parts - found: " + parts + ", max expected: " + this.max_parts_expected + " for " + this.control_id);
    }
    return val;
};


$(document).on("change", ".css_edit :input", function (event) {
    x.field.debug("field.js [change]");
    x.field.getFieldObject($(this).parents(".css_edit")).change(event);
});


x.field.change = function (event) {
    this.debug("change()");
    this.server_messages = null;
    if ($(this.elem).hasClass("css_reload")) {
        this.ui.last_focus_field_before_reload = this.control_id;
        this.ui.reload({ page_button: this.control_id });
    } else {
        this.performValidation();
    }
};

//--------------------------------------------------------- attributes ---------------------------------------------------------
x.field.attributes.max_parts_expected = null;


//--------------------------------------------------------- autocompleter ------------------------------------------------------
x.field.autocompleter.activateEditable = function () {
    var that = this;
    x.field.activateEditable.call(this);
    if (this.input_elmt) {
        return;
    }
    this.curr_value   = this.server_data.curr_id;
    this.input_elmt   = $(this.elem).find("input[type='text']");
    this.map          = {};
    this.valid        = true;
    this.modified     = false;
    this.debug("activateEditable() on " + this.control_id + " as " + this.id);

    if (this.input_elmt.val()) {           // ensure existing value passes validation
        this.map[this.input_elmt.val()] = this.curr_value;
    }

    this.input_elmt.typeahead({
        minLength: (this.server_data.autocompleter_min_length || 2),       // min chars typed to trigger typeahead
        items    : (this.server_data.autocompleter_max_rows   || 10),
        source   : function (query, process) { that.source(query, process); },
        updater  : function (item)           { return that.updater(item); }
    });

    // this.input_elmt.focus(function (event2) {
//        that.curr_value = that.input_elmt.val();
    // });
    // If the item is chosen with the mouse, blur event fires BEFORE updater, but with keyboard it is opposite way around
    // Worse, when choosing with mouse, it seems we cannot tell at blur that an updater call is coming afterwards
    // Hack solution uses setTimeout() to execute after updater
    this.input_elmt.blur(function (event2) {
        that.setValueFromLabel(that.input_elmt.val());
//        setTimeout(that.afterBlur, 5000);
    });
};


x.field.autocompleter.source = function (query, process) {
    var that = this;
    $.ajax({ dataType: "json", url: "jsp/main.jsp", data: { mode: "autocompleter", q: query, field: this.control_id },
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data, status_text) {
            var out = [];
            //create typeahead dataset
            $.each(data.results, function (i, obj) {
                out.push(obj.value);
                /*jslint nomen: true */
                that.map[obj.value] = obj._key;
            });
            process(out);
            //add extra row in case of more results
            if (data.results.length < data.meta.found_rows) {
                $(that.elem).children('ul.typeahead').append(
                    '<li style="text-align:center;">[' + data.results.length + ' of ' + data.meta.found_rows + ']</li>');
            }
        }
    });
};


x.field.autocompleter.updater = function (item) {
    this.setValueFromLabel(item);
    return item;
};


x.field.autocompleter.setValueFromLabel = function (label) {
    if (this.map[label]) {         // picked a value from the list
        this.setValue(this.map[label], true);
    } else {                // free-text
        this.setValue(label, false);
    }
};


x.field.autocompleter.getValue = function () {
    return this.curr_value;
};


x.field.autocompleter.setValue = function (val, picked_from_list) {
    if (this.curr_value === val) {
        return;
    }
    this.valid = true;
    this.modified = true;
    this.curr_value = val;
    if (val !== "" && !picked_from_list) {
        this.valid = false;
    }
    this.debug("setting " + this.control_id + " to " + val);
    this.performValidation();
};


x.field.autocompleter.afterBlur = function () {
    if (this.modified) {
        this.modified = false;
        if ($(this.elem).hasClass("css_reload")) {
            this.ui.last_focus_field_before_reload = this.control_id;
            this.ui.reload({ page_button: this.control_id });
        }
    }
};


x.field.autocompleter.validate = function () {
    x.field.validate.call(this);
    if (!this.valid) {
        this.addMessage('E', "invalid option: " + this.curr_value);
    }
};


//--------------------------------------------------------- combo --------------------------------------------------------------
x.field.combo.setValue = function (val, picked_from_list) {
    if (val !== "") {
        val = (picked_from_list ? "R" : "F") + val;
    }
    if (this.curr_value === val) {
        return;
    }
    this.valid = true;
    this.modified = true;
    this.debug("setting " + this.control_id + " to " + val);
    this.curr_value = val;
    this.performValidation();
};


//--------------------------------------------------------- date ---------------------------------------------------------------
x.field.date.activateEditable = function () {
    var dp_settings = {
            dateFormat: "dd/mm/y",          // 2-digit year
            shortYearCutoff: +50
        };

    x.field.activateEditable.call(this);
    x.ui.main.checkStyle( "/cdn/jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.css");
    x.ui.main.checkScript("/cdn/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js");
    if (this.server_data.min) {
        dp_settings.minDate = new Date(this.server_data.min);
    }
    if (this.server_data.max) {
        dp_settings.maxDate = new Date(this.server_data.max);
    }
    $(this.elem).find(":input:eq(0)").datepicker(dp_settings);
};


//--------------------------------------------------------- datetime -----------------------------------------------------------
x.field.datetime.min_parts_expected = 2;
x.field.datetime.max_parts_expected = 2;


x.field.datetime.activateEditable = function () {
    x.field.date.activateEditable.call(this);
    if (this.server_data.input_mask2) {
        x.ui.main.checkScript("/cdn/jquery.maskedinput/jquery.maskedinput.min.js");
        $(this.elem).find(":input:eq(1)").mask(this.server_data.input_mask2);
    }
};


x.field.datetime.validate = function () {
    var that = this,
        val = this.getValue().split("|"),
        j;

    if ($(this.elem).hasClass("css_mand") && this.isBlank() && this.ui.reload_count > 0) {
        this.addMessage('E', "mandatory");
    }
    function checkRegexPart(i) {
        var regex;
        if (val[i] && that.server_data["regex_pattern" + (i + 1)]) {
            regex = new RegExp(that.server_data["regex_pattern" + (i + 1)]);
            x.ui.main.debug("checkRegexPart(" + i + ") " + val[i] + ", " + that.server_data["regex_pattern" + (i + 1)]);
            if (!regex.exec(val[i])) {
                that.addMessage('E', that.server_data["regex_label" + (i + 1)] || "not valid");
            }
        }
    }
    for (j = 0; j < val.length; j += 1) {
        checkRegexPart(j);
    }
};


//--------------------------------------------------------- dotgraph -----------------------------------------------------------
x.field.dotgraph.activateEditable = function () {
    throw new Error("not implemented");
};


x.field.dotgraph.activateUneditable = function () {
    x.ui.main.checkScript("/cdn/viz/viz.js");
    this.drawGraph();
};


x.field.dotgraph.drawGraph = function () {
    var elem = $(this.elem).children("div.css_diagram"),
        text = elem.text();

    /*jslint newcap: true */
    elem.html(Viz(text, "svg"));
};


//--------------------------------------------------------- dropdown -----------------------------------------------------------
x.field.dropdown.activateEditable   = function () {
    var radio_buttons = $(this.elem).find("span.css_attr_item").length;
    x.field.activateEditable.call(this);
    if (radio_buttons > 0) {
        this.min_parts_expected = radio_buttons;
        this.max_parts_expected = radio_buttons;
    }
};


//--------------------------------------------------------- file ---------------------------------------------------------------
x.field.file.activateEditable = function () {
    var that = this;
    x.field.activateEditable.call(this);
    if (this.activated) {
        return;
    }
    this.activated  = true;
    this.file_id    = this.server_data.curr_id;
    this.file_title = this.server_data.curr_file_title;
    this.debug("activateEditable() on " + this.control_id + " as " + this.id);

    x.ui.main.checkStyle( "/cdn/jquery.fileuploader/fileuploader.css");
    x.ui.main.checkScript("/cdn/jquery.fileuploader/fileuploader.js");
    //y.checkStyle("/cdn/jquery.fineuploader-3.3.0/fineuploader-3.3.0.css");
    //y.checkScript("/cdn/jquery.fineuploader-3.3.0/jquery.fineuploader-3.3.0.js");

    this.addFileRemover();

    new qq.FileUploader({
        element: $(this.elem).find("div.css_file_replace_target")[0],
        action: "jsp/main.jsp?mode=fileup&field_control=" + this.control_id,
        allowedExtensions: this.server_data.allowed_extensions.split(","),
        onSubmit  : function (id, file_name) { that.uploadSubmitted(); },
        onCancel  : function (id, file_name) { that.uploadCancelled(); },
        onComplete: function (id, file_name, responseJSON) { that.uploadCompleted(responseJSON.file_id); },
        sizeLimit: this.server_data.size_limit || 0
    });

    // $(this.elem).append("<input type='hidden' name='" + this.control_id + "' value='" + this.init_file_id + "' />");
    // this.input_value = $(this.elem).children(":input[type='hidden']");
    if (this.file_title) {
        $(this.elem).find("ul.qq-upload-list").append(
            "<li class='qq-upload-success'><span class='qq-upload-file'>" +
            "<a target='_blank' href='jsp/main.jsp" + this.file_title + "?mode=filedown&id=" +
            this.file_id + "'>" + this.file_title + "</a></span></li>");
    //      "<a href='javascript:y.remoteModal(\"jsp/main.jsp?mode=context&page_id=ac_file_context&page_key=" +
    //      existing_id + "\")'>" + existing_title + "</a></span></li>");
        this.addFileRemover();
    }
    this.performValidation();
};


x.field.file.getValue = function () {
    return this.file_id;
};


x.field.file.clear = function () {
    $(this.elem).find("ul.qq-upload-list").empty();
    this.file_id    = null;
    this.file_title = "";
};


x.field.file.uploadSubmitted = function () {
    this.clear();
    this.ui.deactivate();
};


x.field.file.uploadCancelled = function () {
    this.ui.activate();
};


x.field.file.uploadCompleted = function (file_id) {
    this.file_id    = file_id;
    this.performValidation();
    this.addFileRemover();
    this.ui.activate();
};


x.field.file.addFileRemover = function () {
    var that = this;
    //Add an 'X' button to remove file id val - put me in a function
    $(this.elem).find("div.qq-uploader > ul.qq-upload-list > li.qq-upload-success").each(function () {
        var x_span = $('<span style="color: red; font-weight: bold; font-size: 18px; cursor:pointer;">&times;</span>');
        x_span.click(function () {
            that.clear();
            that.performValidation();
        });
        $(this).append(x_span);
    });
};


//--------------------------------------------------------- number -------------------------------------------------------------
/*  number html input type not used at the moment...
x.field.number.activateEditable = function () {
    if (typeof this.server_data.max === "number") {
        $(this).find(":input[type='number']").attr("max" , this.server_data.max);
    }
    if (typeof this.server_data.min === "number") {
        $(this).find(":input[type='number']").attr("min" , this.server_data.min);
    }
};
*/

x.field.number.validate = function () {
    var str_val = $(this.elem).find(":input").val(),
        match = str_val.match(/^[-,\d\.]*$/),
        num;

    x.field.validate.call(this);
    if (str_val && (!match || match.length < 1)) {
        this.addMessage('E', "invalid number: " + str_val);
    } else {
        num = parseFloat(str_val, 10);
        if (typeof this.server_data.min === "number" && num < this.server_data.min) {
            this.addMessage('E', str_val + " is lower than minimum value: " + this.server_data.min);
        }
        if (typeof this.server_data.max === "number" && num > this.server_data.max) {
            this.addMessage('E', str_val + " is higher than maximum value: " + this.server_data.max);
        }
    }
};


//--------------------------------------------------------- richtext -----------------------------------------------------------
x.field.richtext.activateEditable = function () {
    var that = this;
    x.field.activateEditable.call(this);
    this.debug("activateEditable()");
    if (this.input_elmt) {
        return;
    }
    this.input_elmt = $(this.elem).find("div > div.css_richtext_target");

    if (!Aloha) {
        Aloha = window.Aloha || {};
        Aloha.settings = Aloha.settings || {};
        Aloha.settings.locale = 'en';
        Aloha.settings.sidebar = { disabled: true };
        // Restore the global $ and jQuery variables of your project's jQuery
//            Aloha.settings.jQuery = window.jQuery;
//        Aloha.settings.jQuery = window.jQuery.noConflict(true);
        Aloha.settings.plugins = {
            load: "common/ui, common/format, common/list, common/link, common/paste, common/table, common/contenthandler, common/image"
        };
        Aloha.settings.contentHandler = {
            insertHtml: [ 'word', 'generic', 'oembed', 'sanitize' ],
            initEditable: [ 'sanitize' ],
            getContents: [ 'blockelement', 'sanitize', 'basic' ],
            sanitize: 'relaxed' // relaxed, restricted, basic,
        };
//        Aloha.settings.plugins.image = {
//            config: [ 'img' ], // enable the plugin
//            config: { ui: { reset: true, resize: false, crop: false, resizeable: false } }
//        };

        this.ui.checkStyle( "/cdn/alohaeditor-v0.25.2/aloha/css/aloha.css");
        this.ui.checkScript("/cdn/alohaeditor-v0.25.2/aloha/lib/require.js");
        this.ui.checkScript("/cdn/alohaeditor-v0.25.2/aloha/lib/aloha-full.min.js");

        x.field.richtext.aloha_activated = true;
    }
    Aloha.ready(function () {
//          $ = Aloha.jQuery;
//          $(textarea).aloha();
        Aloha.jQuery(that.input_elmt).aloha();
    });

    $(that.input_elmt).blur(function () {
        that.performValidation();
    });
        //Append Mandatory span tags to parent - Move to Server side??
    //  $(this).children('span.help-inline').each(function() {
    //      $(this).parent().parent().append( $('<div class="css_edit error" style="margin-left: 180px;"> </div>').append($(this)) );
    //  });
};


x.field.richtext.getValue = function () {
    return $(this.input_elmt).html();
};
