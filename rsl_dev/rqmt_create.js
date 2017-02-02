y.vs_role_confirmation_message = "Are you sure you want to change the role? Changing the role will override any changes you have made to the job form";
y.afterBlur = function (modified, field, field_value, input_cntrl, prev_value, map) {
    var id = input_cntrl.attr("id");
    if (modified) {
        modified = false;
        if (field.hasClass("css_reload")) {
            if (id !== "vs_role_id") {
                y.loadLocal(field, { page_button: field_value.attr("name") });
            } else {
                bootbox.confirm(y.vs_role_confirmation_message, function (confirm) {
                    if (confirm) {
                        y.loadLocal(field, { page_button: field_value.attr("name") });
                    } else {
                        input_cntrl.val(prev_value);
                        field_value.val(map[prev_value]);
                        y.clearMessages();
                    }
                });
            }
        }
    }
    return modified;
};
