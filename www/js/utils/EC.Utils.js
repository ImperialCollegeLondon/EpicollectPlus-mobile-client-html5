/*jslint vars: true, nomen: true devel: true, plusplus: true, bitwise: true*/
/*global $, jQuery, cordova, Connection, LocalFileSystem*/

var EC = EC || {};
EC.Utils = EC.Utils || {};
EC.Utils = ( function() {
        "use strict";

        var UUID;
        var project = {};
        var forms = [];

        //UUID is the phone ID set by Phonegap (see Phonegap docs)
        var setPhoneUUID = function(the_uuid) {
            this.UUID = the_uuid;
            console.log('device UUID: ' + this.UUID);
        };

        var getPhoneUUID = function() {
            return this.UUID;
        };

        //return a v4 GUID
        var _generateGUID = function() {
            var d = new Date().getTime();
            var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return guid;
        };

        //auto gen key is based ion GUID v4
        var getGenKey = function() {
            //auto generate a unique key in the form <guid>_<timestamp>
            return _generateGUID();
        };

        //return UNIX Epoch timestamp (seconds, 10 digits)
        var getTimestamp = function() {
            return Math.floor((new Date().getTime()) / 1000);
        };

        //open db based on platform
        var openDatabase = function() {

            if (EC.Utils.isChrome()) {
                console.log('chrome websql db init');
                //Chrome Chrome
                return window.openDatabase("epicollect", "1.0", "Epicollect", 5 * 1024 * 1024);

            }

            console.log('native SQLite db init');

            //native implementation via SQLite plugin
            return window.sqlitePlugin.openDatabase({
                name : "epicollect"
            });
            //return window.sqlitePlugin.openDatabase({name: "epicollect",
            // bgType: 0});

        };

        //check if the environment is the Chrome browser (using feature detection
        // http://goo.gl/x4jcS) so we will have to trigger deviceready manually
        // and also NOT call any Phonegap functions
        var isChrome = function() {
            var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
            return !!window.chrome && !isOpera;
        };

        //check if there is a internet connection
        var hasConnection = function() {

            var connection_type;

            //return immediately if testing in the Chrome
            if (EC.Utils.isChrome()) {
                return true;
            }

            if (navigator.network) {

                connection_type = navigator.network.connection.type;
                console.log(JSON.stringify(connection_type));
                return (connection_type === Connection.NONE || connection_type === Connection.UNKNOWN) ? false : true;
            }
        };

        var sleep = function(milliseconds) {

            var i;
            var start = new Date().getTime();
            for ( i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                    break;
                }
            }
        };

        /*
         * Parse the specified date format(Timestamp mask) to POSIX standards
         * (DateBox)
         */
        var parseTimestampDate2Posix = function(the_format, the_type) {

            var format = the_format;
            var type = the_type;
            var elements;
            var formatted_elements = [];
            var i;
            var iLength;

            //split format based on its type
            elements = (type === "date") ? format.split('/') : format.split(':');

            iLength = elements.length;
            for ( i = 0; i < iLength; i++) {

                switch(elements[i]) {

                    case "dd":
                        formatted_elements.push("%d");
                        break;

                    case "MM":
                        formatted_elements.push("%m");
                        break;

                    case "yyyy":
                        formatted_elements.push("%Y");
                        break;

                    case "YYYY":
                        formatted_elements.push("%Y");
                        break;

                    //hours in 24 format
                    case "HH":
                        formatted_elements.push("%H");
                        break;

                    //hours in 12 format
                    case "hh":
                        formatted_elements.push("%I");
                        break;

                    case "mm":
                        formatted_elements.push("%M");
                        break;

                    case "ss":
                        formatted_elements.push("%S");
                        break;
                }//switch

            }//for

            return (type === "date") ? formatted_elements.join("/") : formatted_elements.join(":");

        };

        /** Parse a JS date according to the specified format.
         *  On Android, date is returned by the datePicker Phonegap plugin in the
         * form of yyyy/mm/dd
         *  and it is converted to a javascript date
         *
         *  @param {the_date} a JS Date object
         *  @param {the_format} the format to parse the date to for presentation
         *  Returns the formatted string
         */
        var parseDate = function(the_date, the_format) {

            var date = the_date;
            var format = the_format;
            var day = date.getDate();
            var month = date.getMonth() + 1;
            //months start from 0
            var year = date.getFullYear();

            var format_parts = format.split("/");
            var parsed_date_parts = [];
            var i;
            var iLength = format_parts.length;

            for ( i = 0; i < iLength; i++) {

                switch (format_parts[i]) {

                    case "dd":
                        parsed_date_parts.push(day);
                        break;
                    case "MM":
                        parsed_date_parts.push(month);
                        break;
                    case "yyyy":
                        parsed_date_parts.push(year);
                        break;
                }

            }

            return parsed_date_parts.join("/");

        };

        /**
         * Parse an iOS input type="date" value according to the specified
         * format.
         * The HTML5 date input specification [1] refers to the RFC3339
         * specification [2], which specifies a full-date     format equal to:
         * yyyy-mm-dd
         * Returns the formatted string
         */
        var parseIOSDate = function(the_ios_date, the_format) {

            var date = the_ios_date;
            var date_parts = date.split("-");
            var format = the_format;
            var day = date_parts[2];
            var month = date_parts[1];
            var year = date_parts[0];

            var format_parts = format.split("/");
            var parsed_date_parts = [];
            var i;
            var iLength = format_parts.length;

            for ( i = 0; i < iLength; i++) {

                switch (format_parts[i]) {

                    case "dd":
                        parsed_date_parts.push(day);
                        break;
                    case "MM":
                        parsed_date_parts.push(month);
                        break;
                    case "yyyy":
                        parsed_date_parts.push(year);
                        break;
                }

            }

            return parsed_date_parts.join("/");

        };

        //Parse time according to the specified format. Returns the formatted
        // time string
        var parseTime = function(the_date, the_format) {

            var date = the_date;
            var format = the_format;
            var hours24 = date.getHours();
            var hours12 = ((hours24 + 11) % 12) + 1;
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();

            var format_parts = format.split(":");
            var parsed_date_parts = [];
            var i;
            var iLength = format_parts.length;

            var _addZero = function(num) {
                return (num >= 0 && num < 10) ? "0" + num : num;
            };
            for ( i = 0; i < iLength; i++) {
                switch (format_parts[i]) {
                    case "hh":
                        parsed_date_parts.push(hours12);
                        break;
                    case "HH":
                        parsed_date_parts.push(_addZero(hours24));
                        break;
                    case "mm":
                        parsed_date_parts.push(_addZero(minutes));
                        break;
                    case "ss":
                        parsed_date_parts.push(_addZero(seconds));
                        break;
                }
            }
            return parsed_date_parts.join(":");
        };

        /**
         * Parse time according to the specified format.
         * @param {the_ios_time} time in the form HH:mm:ss
         * @para, {the_format} format to display time
         * Returns the formatted time string
         */
        var parseIOSTime = function(the_ios_time, the_format) {

            var time = the_ios_time;
            var format = the_format;

            var time_parts = time.split(":");

            var hours24 = parseInt(time_parts[0], 10);
            var hours12 = ((hours24 + 11) % 12) + 1;
            var minutes = parseInt(time_parts[1], 10);
            var seconds = parseInt(time_parts[2], 10);

            var format_parts = format.split(":");
            var parsed_date_parts = [];
            var i;
            var iLength = format_parts.length;

            var _addZero = function(num) {
                return (num >= 0 && num < 10) ? "0" + num : num;
            };
            for ( i = 0; i < iLength; i++) {
                switch (format_parts[i]) {
                    case "hh":
                        parsed_date_parts.push(hours12);
                        break;
                    case "HH":
                        parsed_date_parts.push(_addZero(hours24));
                        break;
                    case "mm":
                        parsed_date_parts.push(_addZero(minutes));
                        break;
                    case "ss":
                        parsed_date_parts.push(_addZero(seconds));
                        break;
                }
            }
            return parsed_date_parts.join(":");
        };

        var setProject = function(the_project) {

            this.project = the_project;
        };

        var getProject = function() {

            return this.project;
        };

        var setForms = function(the_forms) {

            this.forms = the_forms;

            window.localStorage.forms = JSON.stringify(this.forms);

        };

        /*
         * form tree is defined by @num sequence, i.e form num=2 is always the
         * child of form num=1 and so on
         *
         * @return an object { parent: <id>, pname: <parent name>, child: <id>,
         * cname: <child name>} with an id of 0 if parent or
         * child is not applicable
         */
        var getParentAndChildForms = function(the_form_id) {

            //get forms object if it is not defined
            this.forms = this.forms || JSON.parse(window.localStorage.forms);

            var form_id = parseInt(the_form_id, 10);
            var i;
            var iLength = this.forms.length;
            var parent_form_id;
            var parent_form_name;
            var child_form_id;
            var child_form_name;

            for ( i = 0; i < iLength; i++) {

                //get current form num
                if (parseInt(this.forms[i]._id, 10) === form_id) {

                    if (i - 1 === -1) {
                        //return 0 if this is the top parent form in the tree
                        parent_form_id = 0;
                        parent_form_name = "";

                    } else {
                        parent_form_id = this.forms[i - 1]._id;
                        parent_form_name = this.forms[i - 1].name;
                    }

                    if (i + 1 === iLength) {

                        child_form_id = 0;
                        child_form_name = "";

                    } else {
                        //return 0 if this is the bottom child in the tree
                        child_form_id = this.forms[i + 1]._id;
                        child_form_name = this.forms[i + 1].name;
                    }

                    return {
                        parent : parent_form_id,
                        pname : parent_form_name,
                        child : child_form_id,
                        cname : child_form_name
                    };

                }

            }//for

        };

        /*
         * Parse location string returning a json object with all the properties
         * in the form property: value
         *
         * Also remove any new line or carriage return from the values
         *
         * if the value is skipped, return an object with empty properties
         */
        var parseLocationString = function(the_string) {

            var string = the_string;
            var object = {};
            var temp_array = string.split(",");

            if (temp_array[0] === EC.Const.SKIPPED) {
                object.Latitude = "";
                object.Longitude = "";
                object.Altitude = "";
                object.Accuracy = "";
                object.Bearing = "";

            } else {
                object.Latitude = temp_array[0].replace("Latitude: ", "").replace(/(\r\n|\n|\r)/gm, "");
                object.Longitude = temp_array[1].replace("Longitude: ", "").replace(/(\r\n|\n|\r)/gm, "");
                object.Altitude = temp_array[2].replace("Altitude: ", "").replace(/(\r\n|\n|\r)/gm, "");
                object.Accuracy = temp_array[3].replace("Accuracy: ", "").replace(/(\r\n|\n|\r)/gm, "");
                object.Bearing = temp_array[5].replace("Bearing: ", "").replace(/(\r\n|\n|\r)/gm, "");
            }

            return object;
        };

        //test is astring is a valid URL
        var isURL = function(the_string) {

            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            return regexp.test(the_string);

        };

        var isValidEmail = function(the_email) {
            var re = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/;
            return re.test(the_email);
        };

        var getForms = function() {

            return this.forms;

        };

        var isGPSEnabled = function() {

            var is_gps_enabled = true;
            var deferred = new $.Deferred();

            function _onGpsChecked(isEnabled) {
                console.log("gps is " + isEnabled);

                if (!isEnabled) {
                    deferred.reject();
                } else {
                    deferred.resolve();
                }

            }

            if (!EC.Utils.isChrome()) {

                switch(window.device.platform) {

                    case EC.Const.ANDROID:
                        window.diagnostic.isGpsEnabled(_onGpsChecked);
                        break;

                    case EC.Const.IOS:

                        //TODO: resolve until we have a way to get this via
                        // Cordova, maybe allowing location at the beginning is
                        // enough
                        deferred.resolve();
                        break;

                }

            }

            return deferred.promise();

        };

        //execute a function passing its full namespaced name (and window as
        // context) form_tr
        //http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
        var executeFunctionByName = function(functionName, context /*, args */) {

            var i;
            var args = Array.prototype.slice.call(arguments).splice(2);
            var namespaces = functionName.split(".");
            var func = namespaces.pop();
            for ( i = 0; i < namespaces.length; i++) {
                context = context[namespaces[i]];
            }
            return context[func].apply(this, args);
        };

        /*
         * When jumps are defined in the xml they are a comma separated list of
         * values like:
         *
         * ecplus_University_ctrl16,1,ecplus_University_ctrl16,!1
         *
         * odd item is identifier to jump to
         * even element is the INDEX of the value (starting from 1) that trigger
         * the jump for RADIO and DROPDOWN
         * for CHECKBOX, the even element is  bizzarely the VALUE that trigger
         * the jump (not the INDEX). Go figure
         * the "!" will define the jump logic (is/is not)
         * END means the end off the form
         * ALL means jump always
         *
         */
        var parseJumpString = function(the_jump_string) {

            var raw_jumps;
            var parsed_jumps = [];
            var i;
            var iLength;
            var obj;

            raw_jumps = the_jump_string.split(',');
            iLength = raw_jumps.length;

            for ( i = 0; i < iLength; i += 2) {

                obj = {};

                //even element is a jump destination, as @ref
                obj.jump_to = raw_jumps[i];

                if (raw_jumps[i + 1].charAt(0) === "!") {

                    obj.jump_when = EC.Const.JUMP_VALUE_IS_NOT;
                    obj.jump_value = raw_jumps[i + 1].substr(1);

                } else {

                    switch(raw_jumps[i + 1]) {

                        case EC.Const.JUMP_ALWAYS:
                            obj.jump_when = EC.Const.JUMP_ALWAYS;
                            obj.jump_value = "";
                            break;

                        case EC.Const.JUMP_FIELD_IS_BLANK:
                            obj.jump_when = EC.Const.JUMP_FIELD_IS_BLANK;
                            obj.jump_value = "";
                            break;

                        default:
                            obj.jump_when = obj.jump_when = EC.Const.JUMP_VALUE_IS;
                            obj.jump_value = raw_jumps[i + 1];

                    }

                }

                parsed_jumps.push(obj);

            }

            return parsed_jumps;

        };

        var getLocalFormID = function(the_form_name) {

            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var iLength = forms.length;
            var name = the_form_name;

            for ( i = 0; i < iLength; i++) {

                if (forms[i].name === name) {
                    return forms[i]._id;
                }

            }

        };

        var isFormGenKeyHidden = function() {

            var forms = JSON.parse(window.localStorage.forms);
            var form_id = parseInt(window.localStorage.form_id, 10);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (parseInt(forms[i]._id, 10) === form_id) {
                    return parseInt(forms[i].is_genkey_hidden, 10);
                }

            }

        };

        var isBranchFormGenKeyHidden = function() {

            var form = JSON.parse(window.localStorage.branch_form);

            return form.is_genkey_hidden;

        };

        var getLocalInputID = function(the_ref) {

            var inputs = JSON.parse(window.localStorage.local_input_ids);
            var i;
            var iLength = inputs.length;
            var ref = the_ref;

            for ( i = 0; i < iLength; i++) {

                if (inputs[i].ref === ref) {

                    return inputs[i]._id;

                }

            }
        };

        var getFormPrimaryKeyRef = function(the_form_id) {

            var form_id = parseInt(the_form_id, 10);
            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (forms[i]._id === form_id) {

                    return forms[i].key;
                }
            }

        };

        var projectHasBranches = function() {

            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var iLength = forms.length;
            var has_branches = false;

            for ( i = 0; i < iLength; i++) {

                if (parseInt(forms[i].has_branches, 10) === 1) {
                    has_branches = true;
                }
            }
            return has_branches;

        };

        var getFormParentPrimaryKeyRef = function(the_form_id) {

            var form_id = parseInt(the_form_id, 10);
            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (forms[i]._id === form_id) {

                    return forms[i - 1].key;
                }
            }

        };

        var getFormByID = function(the_form_id) {

            var form_id = parseInt(the_form_id, 10);
            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (parseInt(forms[i]._id, 10) === form_id) {

                    return forms[i];
                }
            }

        };

        var getEntriesCount = function() {

            var i;
            var iLength;
            var forms = JSON.parse(window.localStorage.forms);
            var count = 0;

            for ( i = 0; i < iLength; i++) {

                count += parseInt(forms[i].entries, 10);

            }

            return count;

        };

        var getParentFormByChildID = function(the_child_form_id) {

            var form_id = parseInt(the_child_form_id, 10);
            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (forms[i]._id === form_id) {

                    return forms[i - 1];
                }
            }

        };

        var updateFormsObj = function(the_form_id) {

            var forms = JSON.parse(window.localStorage.forms);
            var form_id = parseInt(the_form_id, 10);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (forms[i]._id === form_id) {

                    //increase entries counter
                    forms[i].entries = forms[i].entries + 1;
                    break;
                }
            }

            window.localStorage.forms = JSON.stringify(forms);

        };

        var getChildrenForms = function(the_form_id) {

            var forms = JSON.parse(window.localStorage.forms);
            var form_id = parseInt(the_form_id, 10);
            var i;
            var iLength = forms.length;

            for ( i = 0; i < iLength; i++) {

                if (forms[i]._id === form_id) {

                    //return all the elements after the current index
                    return forms.slice(i + 1, iLength + 1);
                }
            }
        };

        var changeHashNavigationDirection = function(the_hash, the_new_direction) {

            var hash = the_hash.split("&");
            var direction = hash[hash.length - 1].split("=");

            direction[direction.length - 1] = the_new_direction;

            hash[hash.length - 1] = direction[0] + "=" + direction[1];

            console.log(hash);

            return hash.join("&");

        };

        //check if a value is in the array, return true on success
        var inArray = function(the_array, the_value, is_case_sensitive) {

            if (!the_array) {
                return false;
            }

            function findWord(array, word) {
                return -1 < array.map(function(item) {
                    return item.toLowerCase();
                }).indexOf(word.toLowerCase());
            }

            //case sensitive search
            if (is_case_sensitive) {
                return (the_array.indexOf(the_value) !== -1);
            }

            // case not sensitive search
            return findWord(the_array, the_value);
        };

        /*
         * Get app version name based on platform
         *
         * Since on iOS the native implementation returns a value too late, we
         * use a deferred object and a promise
         */
        var getVersionName = function() {

            var version_name;
            var deferred = new $.Deferred();

            switch(window.device.platform) {

                case EC.Const.ANDROID:
                    window.plugins.version.getVersionName(function(the_version_name) {
                        //do something with version_name
                        console.log(the_version_name);
                        version_name = the_version_name;

                        deferred.resolve(version_name);

                    }, function(the_errorMessage) {
                        //do something with errorMessage
                        console.log(the_errorMessage);
                        version_name = the_errorMessage;

                        deferred.resolve(version_name);

                    });
                    break;

                case EC.Const.IOS:

                    cordova.getAppVersion(function(the_version_name) {
                        console.log("iOS app version " + the_version_name);
                        version_name = the_version_name;
                        deferred.resolve(version_name);
                    });

                    break;

                default:
                    version_name = "N/A";
                    deferred.resolve(version_name);
            }

            return deferred.promise();

        };
        
        //set Chrome base URL for debugging (absolute path to index.html)

        var getPageBaseURI = function() {

            var base_uri;

            //if we are testing with Chrome Chrome/browser on the iMac (replace based on your dev environment if needed)
            if (EC.Utils.isChrome()) {
               
                base_uri = window.localStorage.BASE_URI;
               
            } else {

                switch(window.device.platform) {

                    case "Android":

                        //@debug on: old android platforms need jsHybugger to run
                        // as a service, newer platform do not
                        //check if the phone is running anything less than 4.4.*
                        // KitKat then request pages via the service if needed
                        console.log("kitkat regex: " + EC.Const.PRE_KITKAT_REGEX.test(window.device.version));
                        if (EC.Const.DEBUG === 1 && !(EC.Const.PRE_KITKAT_REGEX.test(window.device.version) || EC.Const.LOLLIPOP_REGEX.test(window.device.version) )) {

                            base_uri = "content://jsHybugger.org/file:///android_asset/www/";

                        } else {

                            //@debug off
                            base_uri = EC.Const.ANDROID_ASSETS_ABS_PATH;
                        }

                        break;

                    case "iOS":

                        base_uri = EC.Const.IOS_ASSETS_ABS_PATH;
                        break;

                }
            }
            return base_uri;
        };

        var isValidValue = function(the_input, the_value, the_clone_value) {

            var self = this;

            //store validation details in object.
            var validation = {
                is_valid : true,
                message : ""
            };

            var input = the_input;
            var value = the_value;
            var pattern;
            var clone_value = the_clone_value;

            //return immediately if input is branch
            if (input.type === EC.Const.BRANCH) {
                return validation;
            }

            //return immediately if input is integer value is not an integer but
            // a float (user can enter the dot, depending on the native keyboard
            // layout)
            if (input.type === EC.Const.INTEGER) {

                //check if number value is integer, not float
                if (parseFloat(value) !== parseInt(value, 10) && value !== "") {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation("invalid_integer");

                    return validation;
                }
            }

            /** for iOS only: it is currently NOT possible to show a keyboard
             * with only numbers and the dot "." to input decimal values
             *  therefore the full keyboard is shown and we need to sanitise the
             * input against wrong chars
             *
             */
            if (input.type === EC.Const.DECIMAL) {

                //check if value is a decimal value (http://goo.gl/Q4J4cU)
                if (!self.isNumber(value)) {

                    if (value !== "") {
                        validation.is_valid = false;
                        validation.message = EC.Localise.getTranslation("invalid_decimal");

                        return validation;
                    }

                }
            }

            //if the value is a primary key, check that is does not contain the
            // char set as ENTRY_ROOT_PATH_SEPARATOR
            if (input.is_primary_key === 1 && value.indexOf(EC.Const.ENTRY_ROOT_PATH_SEPARATOR) !== -1) {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation("pk_reserved_char") + EC.Const.ENTRY_ROOT_PATH_SEPARATOR;

                return validation;

            }

            //check if the input needs to match a regular expression
            if (input.regex !== "") {

                if (!value.match(input.regex)) {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation("invalid_regex") + input.regex;

                    return validation;
                }
            }

            //check if the value has a double check. In that case 'value' will
            // contain 2 values to match
            if (parseInt(input.has_double_check, 10) === 1) {

                if (value !== clone_value) {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation("values_unmatched");

                    return validation;
                }
            }

            //check if the value is within the max range
            if (input.max_range !== "") {

                //use parseFloat as it can be an integer or a decimal value
                if (parseFloat(value) > parseFloat(input.max_range)) {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation("out_of_range");

                    return validation;
                }
            }

            //check if the value is within the min range
            if (input.min_range !== "") {

                //use parseFloat as it can be an integer or a decimal value
                if (parseFloat(value) < parseFloat(input.min_range)) {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation("out_of_range");

                    return validation;
                }
            }

            //check the user did not entered the reserved word _skipp3d_
            if (input.value === EC.Const.SKIPPED) {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation("reserved_keyword");

                return validation;

            }

            //check if the input is required
            if (parseInt(input.is_required, 10) === 1) {

                //if the input is a dropdown, radio or checkbox, check for
                // NO_OPTION_SELECTED label
                if (input.type === EC.Const.DROPDOWN || input.type === EC.Const.RADIO || input.type === EC.Const.CHECKBOX) {

                    if (value === EC.Const.NO_OPTION_SELECTED) {

                        validation.is_valid = false;
                        validation.message = EC.Localise.getTranslation("field_required");

                        return validation;
                    }

                } else {

                    if (value === "") {

                        validation.is_valid = false;
                        validation.message = EC.Localise.getTranslation("field_required");

                        return validation;
                    }

                }
            }

            return validation;
        };

        // get iOS app root path (www)
        var setIOSRootPath = function() {

            function onSuccess(fileSystem) {

                var documents_path;

                //get absolute path on iOS 8, there is a bug in Cordova 3.7 see
                // http://goo.gl/lUIqyl
                if (window.device.platform === EC.Const.IOS && parseFloat(window.device.version) >= 8) {

                    documents_path = fileSystem.toURL();

                    EC.Const.IOS_ASSETS_ABS_PATH = documents_path.replace("file:////", "file:///private/");

                    EC.Const.IOS_ASSETS_ABS_PATH += "www/";

                    console.log("iOS 8+ root www - " + EC.Const.IOS_ASSETS_ABS_PATH);

                } else {

                    /* Very imp!!!! they changed the property from 'fullPath'
                     * (Cordova  2.9) to 'nativeURL' somewhere in time!!!!
                     */
                    
                    console.log(fileSystem);
                    
                    documents_path = fileSystem.root.nativeURL;

                    documents_path = documents_path.replace("Documents/", "");
                    
                    //IOS_ASSETS_ABS_PATH : "Epicollect5 64bit.app/www/" -> we ned to append this 
                    EC.Const.IOS_ASSETS_ABS_PATH = documents_path + EC.Const.IOS_ASSETS_ABS_PATH;
                     
                    console.log("iOS root www - " + EC.Const.IOS_ASSETS_ABS_PATH);

                }

            }

            function onError(error) {

                console.log(JSON.stringify(error));
            }
            
            //on iOS 8, get the Directory Entry using new method
            if (window.device.platform === EC.Const.IOS && parseFloat(window.device.version) >= 8) {
                window.resolveLocalFileSystemURL(cordova.file.applicationDirectory, onSuccess, onError);
            } else {
                
                //on other platforms, use legacy method
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
            }

        };

        var setIOSPersistentStoragePath = function() {

            function onSuccess(fileSystem) {

                EC.Const.IOS_APP_PRIVATE_URI = fileSystem.root.nativeURL;

                /*remove "file://" from path: images from iOS application folder
                 * will need the "file://"
                 * to be loaded, but audio and video files will not:
                 * http://stackoverflow.com/questions/24205331/mp3-audio-playback-not-working-with-cordova-3-5-on-ios
                 */
                EC.Const.IOS_APP_PRIVATE_URI = EC.Const.IOS_APP_PRIVATE_URI.slice(7);

                console.log("iOS Documents path - " + EC.Const.IOS_APP_PRIVATE_URI);
            }

            function onError(error) {
                console.log(JSON.stringify(error));
            }


            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
        };

        var setMediaDirPaths = function() {

            switch(window.device.platform) {

                case EC.Const.ANDROID:
                    EC.Const.PHOTO_DIR = "/files/images/";
                    EC.Const.AUDIO_DIR = "/files/audios/";
                    EC.Const.VIDEO_DIR = "/files/videos/";
                    break;
                case EC.Const.IOS:
                    EC.Const.PHOTO_DIR = "images/";
                    EC.Const.AUDIO_DIR = "audios/";
                    EC.Const.VIDEO_DIR = "videos/";
                    break;

            }

        };

        /**
         *
         * @param {Object} the_filenames an array mapping filenames against their
         * timestamps
         * @param {Object} the_current_filename The filename to look the
         * timestamp for
         *
         * get the filename for a photo saved in persistent storage on iOS.
         * Cordova Camera API returns an image URI like <cdv_photo_001.jpg> on
         * iOS tmp folder
         * but we save the file using the timestamp in the Documents folder, as
         * wee do on Android
         * (where the timestamp is used as file name by default).
         */
        var getIOSFilename = function(the_filenames, the_current_filename) {

            var i;
            var filenames = the_filenames;
            var current_filename = the_current_filename;
            var iLength = filenames.length;

            for ( i = 0; i < iLength; i++) {
                if (filenames[i].filename === current_filename) {
                    return filenames[i].timestamp;
                }
            }
        };

        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        function getParameterByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        var mapLabelToValue = function(the_value, the_inputs) {

            function _getInputByRef(the_ref, the_inputs) {

                var inputs = the_inputs;
                var i;
                var iLength = inputs.length;

                for ( i = 0; i < iLength; i++) {

                    if (inputs[i].ref === the_ref) {
                        return inputs[i];
                    }
                }
            }

            function _getCheckboxLabels(the_value, the_current_input) {

                var value_as_array = the_value.value.split(',');
                var current_input = the_current_input;
                var i;
                var j;
                var iLength = value_as_array.length;
                var jLength = current_input.options.length;
                var labels = [];
                for ( i = 0; i < iLength; i++) {
                    for ( j = 0; j < jLength; j++) {

                        if (current_input.options[j].value === value_as_array[i].trim()) {
                            labels.push(current_input.options[j].label);
                        }

                    }
                }

                return labels;

            }

            function _getDropdownOrRadioLabel(the_value, the_current_input) {

                var i;
                var current_input = the_current_input;
                var value = the_value;
                var iLength = current_input.options.length;

                for ( i = 0; i < iLength; i++) {
                    if (current_input.options[i].value === value.value.trim()) {
                        return current_input.options[i].label;
                    }
                }
            }

            var value = the_value;
            var ref = value.ref;
            var inputs = the_inputs;
            var current_input = _getInputByRef(ref, inputs);
            var mapped_label;

            switch(value.type) {

                //value.value will be an array
                case EC.Const.CHECKBOX:
                    //for checkboxes, mapped_label will be a csv
                    mapped_label = _getCheckboxLabels(value, current_input);
                    break;

                //value.value will be string
                case EC.Const.DROPDOWN:

                    mapped_label = _getDropdownOrRadioLabel(value, current_input);
                    break;

                //value.value will be string
                case EC.Const.RADIO:

                    mapped_label = _getDropdownOrRadioLabel(value, current_input);
                    break;

            }

            return mapped_label;

        };

        return {

            setForms : setForms,
            getForms : getForms,
            getPhoneUUID : getPhoneUUID,
            setPhoneUUID : setPhoneUUID,
            getGenKey : getGenKey,
            getParentAndChildForms : getParentAndChildForms,
            getTimestamp : getTimestamp,
            hasConnection : hasConnection,
            openDatabase : openDatabase,
            isChrome : isChrome,
            projectHasBranches : projectHasBranches,
            parseTimestampDate2Posix : parseTimestampDate2Posix,
            parseDate : parseDate,
            parseIOSDate : parseIOSDate,
            parseTime : parseTime,
            parseIOSTime : parseIOSTime,
            parseLocationString : parseLocationString,
            parseJumpString : parseJumpString,
            isURL : isURL,
            isNumber : isNumber,
            sleep : sleep,
            isGPSEnabled : isGPSEnabled,
            executeFunctionByName : executeFunctionByName,
            getLocalInputID : getLocalInputID,
            getLocalFormID : getLocalFormID,
            isValidEmail : isValidEmail,
            getFormPrimaryKeyRef : getFormPrimaryKeyRef,
            getFormParentPrimaryKeyRef : getFormParentPrimaryKeyRef,
            getFormByID : getFormByID,
            getEntriesCount : getEntriesCount,
            isFormGenKeyHidden : isFormGenKeyHidden,
            isBranchFormGenKeyHidden : isBranchFormGenKeyHidden,
            getParentFormByChildID : getParentFormByChildID,
            updateFormsObj : updateFormsObj,
            getChildrenForms : getChildrenForms,
            changeHashNavigationDirection : changeHashNavigationDirection,
            inArray : inArray,
            getVersionName : getVersionName,
            getPageBaseURI : getPageBaseURI,
            isValidValue : isValidValue,
            setIOSRootPath : setIOSRootPath,
            setMediaDirPaths : setMediaDirPaths,
            setIOSPersistentStoragePath : setIOSPersistentStoragePath,
            getIOSFilename : getIOSFilename,
            getParameterByName : getParameterByName,
            mapLabelToValue : mapLabelToValue
        };

    }());

