var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    var input;

    module.getInputs = function () {
        return this.inputs;
    };

    module.setInputs = function (the_inputs, the_has_jumps_flag, the_has_location_flag) {

        this.inputs = the_inputs;
        //set flag to indicate if this form has or not any jumps
        window.localStorage.form_has_jumps = (the_has_jumps_flag) ? 1 : 0;
        window.localStorage.form_has_location = (the_has_location_flag) ? 1 : 0;
    };

    module.getPrimaryKeyRefPosition = function () {

        var i;
        var iLenght = this.inputs.length;

        //look for the position of the primary key
        for (i = 0; i < iLenght; i++) {
            if (parseInt(this.inputs[i].is_primary_key, 10) === 1) {
                return this.inputs[i].position;
            }
        }
    };

    module.getJumpDestinationPosition = function (the_ref) {

        var i;
        var iLenght = this.inputs.length;
        var ref = the_ref;

        //look for the position of the specified ref
        for (i = 0; i < iLenght; i++) {
            if (ref === this.inputs[i].ref) {
                return this.inputs[i].position;
            }
        }
    };

    module.getInputAt = function (the_position) {
        return this.inputs[the_position - 1];
    };

    module.updateFormCompletion = function (the_position, the_length) {

        var ratio = Math.ceil(100 * (the_position - 1) / the_length);
        var percentage_bar = $('div.ui-grid-b.input-nav-tabs div.input-progress-bar div.progress.progress_tiny');
        var percentage_txt = $('div.ui-grid-b.input-nav-tabs div.input-progress-bar span.form-completion-percent');

        percentage_txt.text(ratio + '%');
        percentage_bar.css('width', ratio + '%');

    };



    return module;

}(EC.Inputs));
