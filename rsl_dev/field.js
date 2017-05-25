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
*       <div class='form-group' ...             -- form-group in TB3
*
* Subclasses are identified by additional class in the above, css_type_...
* This div may then contain...
*       <label>
*       <span class='form-control-static'>      -- uneditable text content

*/


x.field = {
    id: "x.field",
    // min_parts_expected: 1,          // fewest input controls anticipated per field } set either null
    // max_parts_expected: 1,          //   most input controls anticipated per field } to bypass check
    log_level: 2,       // debug
};


x.field.clone = function (id) {
    var obj = Object.create(this);
    obj.id  = id;
    return obj;
};


x.field.info = function (msg) {
    if (this.log_level <= 4) {
        console.log("INFO : " + this.id + ", " + msg);
    }
};

x.field.debug = function (msg) {
    if (this.log_level <= 2) {
        console.log("DEBUG: " + this.id + ", " + msg);
    }
};

x.field.trace = function (msg) {
    if (this.log_level <= 0) {
        console.log("TRACE: " + this.id + ", " + msg);
    }
};


x.field.instantiate = function (elem) {
    var obj = Object.create(this);
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
x.field.radio_buttons = x.field.clone("x.field.radio_buttons");
x.field.richtext      = x.field.clone("x.field.richtext");


// Note: 'elem' should be div.form-group
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
    if (x.field.last_focused_input && x.field.edit_fields[x.field.last_focused_input]) {
        x.field.debug("setting focus on " + x.field.last_focused_input);
        x.field.edit_fields[x.field.last_focused_input].focus();
    }
});


x.field.getFieldObject = function (elem) {
    var field_object = $(elem).data("field_object"),
        json_str;

    x.field.trace("getFieldObject() " + elem);
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
        } else if ($(elem).hasClass("css_type_radio_buttons")) {
            field_object = x.field.radio_buttons.instantiate(elem);
        } else if ($(elem).hasClass("css_richtext")) {
            field_object = x.field.richtext     .instantiate(elem);
        } else {
            field_object = x.field              .instantiate(elem);
        }
        $(elem).data("field_object", field_object);
        json_str = $(elem).find(".css_render_data").text();
        field_object.server_data = json_str ? $.parseJSON(json_str) : {};
    }
    return field_object;
};


x.field.activate = function () {
    this.trace("activate()");
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


x.field.activateEditable = function () {
    this.trace("activateEditable()");
    this.client_messages = $(this.elem).find("span.css_client_messages");
    this.server_messages = $(this.elem).find("span.css_server_messages");
    this.setValue(this.getInitialValue());
    // maskedinput-1.4.1 NOT WORKING.... Mismatched anonymous define() module: function ($) {
    // if (this.server_data.input_mask) {
    //     x.ui.main.checkScript("/cdn/jquery.maskedinput1.4.1/jquery.maskedinput.js");
    //     $(this.elem).find(":input:eq(0)").mask(this.server_data.input_mask);
    // }
};


x.field.activateUneditable = function () {
    return undefined;
};


// The 'internal value' (that which should be sent back to the server) is stored as property 'curr_value'
// It is initially set in activateEditable() using: setValue(getInitialValue())
// The 'change' browser event updates it as a result of user input, using: setValue(getControlValue())
// Values are collected and sent to the server by looping over editable fields and calling getValue() on each


x.field.isBlank = function () {
    return !this.getValue();
};


x.field.getValue = function () {
    return this.curr_value;
};


x.field.getInitialValue = function () {
    return this.getControlValue();
};


x.field.getControlValue = function () {
    var val = "";
    var delim = "";
    var parts = 0;

    this.trace("getControlValue()");
    $(this.elem).find(":input").each(function () {
        var part_val;
        parts += 1;
        if ($(this).filter(":checkbox, :radio").not(":checked").length > 0) {
            return;
        }
        part_val = $(this).val();
        if (part_val) {
            val += delim + part_val;
            delim = "|";
        }
    });

    if (typeof this.server_data.min_parts_expected === "number"
            && parts < this.server_data.min_parts_expected) {
        throw new Error("too few  control parts - found: " + parts + ", min expected: " +
            this.server_data.min_parts_expected + " for " + this.control_id);
    }
    if (typeof this.server_data.max_parts_expected === "number"
            && parts > this.server_data.max_parts_expected) {
        throw new Error("too many control parts - found: " + parts + ", max expected: " +
            this.server_data.max_parts_expected + " for " + this.control_id);
    }
    return val;
};


x.field.setValue = function (val) {
    this.curr_value = val;
};


x.field.setValueOnChange = function (val) {
    this.setValue(val);
};


$(document).on("change", ".css_edit :input", function (event) {
    x.field.getFieldObject($(this).parents(".css_edit")).changeImmediate();
});


$(document).on("focus", ".css_edit :input", function (event) {
    var field_obj = x.field.getFieldObject($(this).parents(".css_edit"));
    field_obj.debug("[focus]");
    x.field.last_focused_input = field_obj.control_id;
});


x.field.changeImmediate = function () {
    var new_val = this.getControlValue();
    var that = this;
    this.debug("changeImmediate()");
    if (new_val === this.getValue()) {
        return;         // no action
    }
    this.setValueOnChange(new_val);
    this.performValidation();
    setTimeout(function () {            // allow focus event on next field to occur if relevant
        that.changeTimed(event);
    }, 0);
};


x.field.changeTimed = function (event) {
    this.debug("changeTimed()");
    if ($(this.elem).hasClass("css_reload")) {
        this.ui.last_focus_field_before_reload = this.control_id;
        this.ui.reload({ page_button: this.control_id });
    }
};


x.field.focus = function () {
    $(this.elem).find(":input:eq(0)").focus();
};


x.field.performValidation = function () {
    this.debug("performValidation()");
    this.client_messages.empty();
    this.validate();
    this.renderFieldMessages();
};


x.field.validate = function () {
    var val = this.getValue();
    var regex;

    this.trace("validate()");
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
    this.client_messages.append("<span data-msg-type='" + msg_type + "'>" + msg_text + "</span>");
};


x.field.renderFieldMessages = function () {
    this.debug("renderFieldMessages()");

    // success/warning/errors icon aren't positioned properly...
    // $(this.elem).children("span.form-control-feedback").remove();

    if ($(this.elem).find("span[data-msg-type='E']").length > 0) {
        $(this.elem).removeClass("has-success");
        $(this.elem).removeClass("has-warning");
        $(this.elem).addClass("has-error");
        // if (this.after_first_validation) {
        //     $(this.elem).append("<span class='glyphicon glyphicon-remove form-control-feedback' aria-hidden='true'></span>");
        // }
    } else if ($(this.elem).find("span[data-msg-type='W']").length > 0) {
        $(this.elem).removeClass("has-success");
        $(this.elem).removeClass("has-error");
        $(this.elem).addClass("has-warning");
        // if (this.after_first_validation) {
        //     $(this.elem).append("<span class='glyphicon glyphicon-warning-sign form-control-feedback' aria-hidden='true'></span>");
        // }
    } else {
        $(this.elem).removeClass("has-warning");
        $(this.elem).removeClass("has-error");
        if (this.after_first_validation) {
            $(this.elem).addClass("has-success");
            // $(this.elem).append("<span class='glyphicon glyphicon-ok form-control-feedback' aria-hidden='true'></span>");
        }
    }
    if (this.client_messages.find("span").length > 0) {
        this.client_messages.removeClass("css_hide");
    } else {
        this.client_messages.addClass("css_hide");
    }
    if (this.server_messages.find("span").length > 0) {
        this.server_messages.removeClass("css_hide");
    } else {
        this.server_messages.addClass("css_hide");
    }

    this.after_first_validation = true;
};


//--------------------------------------------------------- attributes ---------------------------------------------------------
// x.field.attributes.max_parts_expected = null;


//--------------------------------------------------------- autocompleter ------------------------------------------------------
x.field.autocompleter.activateEditable = function () {
    var that = this;
    x.field.activateEditable.call(this);
    if (this.input_elmt) {
        return;
    }
    this.input_elmt = $(this.elem).find("input[type='text']");
    this.curr_value = this.server_data.curr_id;
    this.curr_label = this.input_elmt.val();
    this.values_map = {};
    this.labels_map = {};
    this.trace("activateEditable() on " + this.control_id + " as " + this.id);

    if (this.input_elmt.val()) {           // ensure existing value passes validation
        this.values_map[this.curr_value] = this.curr_label;
        this.labels_map[this.curr_label] = this.curr_value;
    }

    x.ui.main.checkScript("/cdn/typeahead-v0.11.1/typeahead.bundle.js");
    // x.ui.main.checkStyle("style/typeaheadjs.css");

    this.input_elmt.typeahead({
        minLength: (this.server_data.autocompleter_min_length || 2),       // min chars typed to trigger typeahead
        items: (this.server_data.autocompleter_max_rows || 10),
    }, {
        source: function (query, syncResult, asyncResult) {
            that.source(query, asyncResult);
        },
    });

    this.input_elmt.bind("typeahead:select", function(ev, item) {
        console.log('Selection: ' + item);
        return that.updater(item);
    });

    // a matching value is filled in by the system (arrow right)
    this.input_elmt.bind("typeahead:autocomplete", function(ev, item) {
        console.log('Selection: ' + item);
        return that.updater(item);
    });

    // this.input_elmt.focus(function (event2) {
//        that.curr_value = that.input_elmt.val();
    // });
    // If the item is chosen with the mouse, blur event fires BEFORE updater, but with keyboard it is opposite way around
    // Worse, when choosing with mouse, it seems we cannot tell at blur that an updater call is coming afterwards
    // Hack solution uses setTimeout() to execute after updater
    this.input_elmt.blur(function (event2) {
        if (event2.relatedTarget && $(event2.relatedTarget).parents("ul.typeahead").length > 0) {
            that.debug("blur event expecting click event to come, exiting...");
            return;
        }
        that.setValueFromLabel(that.input_elmt.val());
    });
};


x.field.autocompleter.source = function (query, asyncResult) {
    var that = this;
    $.ajax({ dataType: "json", url: "dyn/", data: {
            mode: "autocompleter",
            field: this.control_id,
            q: query,
        },
        beforeSend: function (xhr) {        // IOS6 fix
            xhr.setRequestHeader('If-Modified-Since', '');
        },
        success: function (data, status_text) {
            var out = [];
            that.values_map = {};
            that.labels_map = {};
            //create typeahead dataset
            $.each(data.results, function (i, obj) {
                out.push(obj.value);
                /*jslint nomen: true */
                that.values_map[obj._key] = obj.value;
                that.labels_map[obj.value] = obj._key;
            });
            asyncResult(out);
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
    if (this.labels_map[label]) {         // picked a value from the list
        this.setValue(this.labels_map[label], true);
    } else {                // free-text
        this.setValue(label, false);
    }
    this.performValidation();
};


// ignore this call - wait to be set by updater()
x.field.autocompleter.setValueOnChange = function (val) {
    // this.setValue(val);
};


// x.field.autocompleter.getValue = function () {
//     return this.curr_value;
// };

/*
x.field.autocompleter.setValue = function (val, picked_from_list) {
    if (this.curr_value === val) {
        return;
    }
    this.valid = true;
    this.curr_value = val;
    if (val !== "" && !picked_from_list) {
        this.valid = false;
    }
    this.debug("setting " + this.control_id + " to " + val);
    this.performValidation();

    if ($(this.elem).hasClass("css_reload")) {
        this.ui.last_focus_field_before_reload = this.control_id;
        this.ui.reload({ page_button: this.control_id });
    }
};
*/

// taken care of in setValue() above...
// x.field.autocompleter.change = function (event) {};


x.field.autocompleter.validate = function () {
    x.field.validate.call(this);
    this.curr_label = this.values_map[this.curr_value];
    if (this.curr_value && !this.curr_label) {
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
    // this.valid = true;
    this.debug("setting " + this.control_id + " to " + val);
    this.curr_value = val;
    // this.performValidation();
};


//--------------------------------------------------------- date ---------------------------------------------------------------
x.field.date.activateEditable = function () {
    var dp_settings = {
        format: "dd/mm/yy",          // 2-digit year
        autoclose: true,
        assumeNearbyYear: +50
    };

    x.field.activateEditable.call(this);

    if (this.server_data.min) {
        dp_settings.startDate = new Date(this.server_data.min);
    }
    if (this.server_data.max) {
        dp_settings.endDate = new Date(this.server_data.max);
    }
    $(this.elem).find(":input:eq(0)").datepicker(dp_settings);
};


//--------------------------------------------------------- datetime -----------------------------------------------------------

x.field.datetime.activateEditable = function () {
    var dp_settings = {
        format: "DD/MM/YY HH:mm",          // 2-digit year
    };

    x.field.activateEditable.call(this);
    // x.ui.main.checkStyle( "/color_admin_v2.2/admin/template_content_html/assets/plugins/bootstrap-eonasdan-datetimepicker/build/css/bootstrap-datetimepicker.min.css");
    // x.ui.main.checkScript("/color_admin_v2.2/admin/template_content_html/assets/plugins/bootstrap-daterangepicker/moment.js");
    // x.ui.main.checkScript("/color_admin_v2.2/admin/template_content_html/assets/plugins/bootstrap-eonasdan-datetimepicker/build/js/bootstrap-datetimepicker.min.js");

    $(this.elem).find(":input:eq(0)").datetimepicker(dp_settings);

};


$(document).on("dp.change", ".css_edit :input", function (event) {
    x.field.getFieldObject($(this).parents(".css_edit")).changeImmediate();
});


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
// x.field.dropdown.activateEditable   = function () {
//     var radio_buttons = $(this.elem).find("label").length;
//     x.field.activateEditable.call(this);
//     if (radio_buttons > 0) {
//         this.min_parts_expected = radio_buttons;
//         this.max_parts_expected = radio_buttons;
//     }
// };


//--------------------------------------------------------- file ---------------------------------------------------------------
x.field.file.activateEditable = function () {
    var that = this;
    x.field.activateEditable.call(this);
    if (this.activated) {
        return;
    }
    this.activated  = true;
    this.curr_value = this.server_data.curr_id;
    this.file_title = this.server_data.curr_file_title;
    this.trace("activateEditable() on " + this.control_id + " as " + this.id);

    x.ui.main.checkStyle( "/cdn/jquery.fileuploader/fileuploader.css");
    x.ui.main.checkScript("/cdn/jquery.fileuploader/fileuploader.js");
    //y.checkStyle("/cdn/jquery.fineuploader-3.3.0/fineuploader-3.3.0.css");
    //y.checkScript("/cdn/jquery.fineuploader-3.3.0/jquery.fineuploader-3.3.0.js");

    this.addFileRemover();

    new qq.FileUploader({
        element: $(this.elem).find("div.css_file_replace_target")[0],
        action: "dyn/?mode=fileup&field_control=" + this.control_id,
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
            "<a target='_blank' href='dyn/" + this.file_title + "?mode=filedown&id=" +
            this.file_id + "'>" + this.file_title + "</a></span></li>");
    //      "<a href='javascript:y.remoteModal(\"jsp/main.jsp?mode=context&page_id=ac_file_context&page_key=" +
    //      existing_id + "\")'>" + existing_title + "</a></span></li>");
        this.addFileRemover();
    }
    this.performValidation();
};


// x.field.file.getValue = function () {
//     return this.file_id;
// };


x.field.file.clear = function () {
    $(this.elem).find("ul.qq-upload-list").empty();
    this.curr_value = null;
    this.file_title = "";
};


x.field.file.uploadSubmitted = function () {
    this.clear();
    // this.ui.deactivate();
    x.ui.main.active = false;       // prevent ajax submission during upload
};


x.field.file.uploadCancelled = function () {
    // this.ui.activate();
    x.ui.main.active = true;        // allow ajax submission agaim
};


x.field.file.uploadCompleted = function (file_id) {
    this.curr_value = file_id;
    this.performValidation();
    this.addFileRemover();
    // this.ui.activate();
    // calling activate() re-initializes the fields, which loses the values of file field objects...
    x.ui.main.active = true;        // allow ajax submission agaim
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
    var str_val = this.getValue();
    var match = str_val.match(/^[-,\d\.]*$/);
    var num;
    var message;
    var type;

    x.field.validate.call(this);
    if (str_val && (!match || match.length < 1)) {
        this.addMessage('E', "invalid number");
    } else {
        num = parseFloat(str_val, 10);
        if (typeof this.server_data.min === "number" && num < this.server_data.min) {
            type = "E";
            message = this.server_data.min_message
                .replace("{{min}}", this.server_data.min);
        } else if (typeof this.server_data.soft_min === "number" && num < this.server_data.soft_min) {
            type = "W";
            message = this.server_data.soft_min_message
                .replace("{{min}}", this.server_data.soft_min);
        } else if (typeof this.server_data.max === "number" && num > this.server_data.max) {
            type = "E";
            message = this.server_data.max_message
                .replace("{{max}}", this.server_data.max);
        } else if (typeof this.server_data.soft_max === "number" && num > this.server_data.soft_max) {
            type = "W";
            message = this.server_data.soft_max_message
                .replace("{{max}}", this.server_data.soft_max);
        } else {
            return;
        }
        message = message.replace("{{val}}", str_val);
        this.addMessage(type, message);
    }
};


//--------------------------------------------------------- radio_buttons ------------------------------------------------------
// x.field.radio_buttons.activateEditable = function () {
//     var radio_buttons = $(this.elem).find("div.radio").length + $(this.elem).find("label.radio-inline").length;
//     if (radio_buttons > 0) {
//         this.min_parts_expected = radio_buttons;
//         this.max_parts_expected = radio_buttons;
//     }
//     x.field.activateEditable.call(this);
// };


//--------------------------------------------------------- richtext -----------------------------------------------------------
x.field.richtext.activateEditable = function () {
    var that = this;
    x.field.activateEditable.call(this);
    this.trace("activateEditable()");
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
