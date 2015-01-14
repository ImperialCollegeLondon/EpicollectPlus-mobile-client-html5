/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Hierarchy
 *
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {
        "use strict";

        var self;
        var deferred;

        //track inputs IDs
        var inputs_IDs = [];

        //we need to keep track of the input option @ref to be linked with
        // whatever ID it gets after being entered to the the db
        var input_option_index;

        //store inputs object
        var inputs;

        var forms_with_media = [];
        var forms_IDs = [];

        //Transaction to save all the inputs for each form to database
        var _commitInputsTX = function(tx) {

            var i;
            var j;
            var k;
            var iLength;
            var jLength;
            var kLength;
            var current_form_num;
            var current_form_id;
            var input_list;
            var input_type;
            var input_ref;
            var query;

            //loop input array, one element per form . Each element contains an
            // input list and the @num attribute
            for ( i = 0, iLength = inputs.length; i < iLength; i++) {

                //get the database ID for the current form
                current_form_num = inputs[i].num;
                for ( j = 0, jLength = forms_IDs.length; j < jLength; j++) {

                    if (forms_IDs[j].num === current_form_num) {

                        //exit loop as soon as we get a match
                        current_form_id = forms_IDs[j].id;
                        break;
                    }
                }

                //loop each input for the current element(form) and commit it
                kLength = inputs[i].input_list.length;
                for ( k = 0; k < kLength; k++) {

                    input_type = inputs[i].input_list[k].type;
                    input_ref = inputs[i].input_list[k].ref;

                    query = 'INSERT INTO ec_inputs (';
                    query += 'form_id, ';
                    query += 'label, ';
                    query += 'default_value, ';
                    query += 'type, ';
                    query += 'ref, ';
                    query += 'position, ';
                    query += 'is_primary_key, ';
                    query += 'is_genkey, ';
                    query += 'regex, ';
                    query += 'max_range, ';
                    query += 'min_range, ';
                    query += 'is_required, ';
                    query += 'is_title, ';
                    query += 'has_jump, ';
                    query += 'jumps, ';
                    query += 'has_advanced_jump, ';
                    query += 'datetime_format, ';
                    query += 'branch_form_name, ';
                    query += 'has_double_check) ';
                    query += 'VALUES (';
                    //parameterized query (webSQL only allows '?' http://www.w3.org/TR/webdatabase/)
                    //
                    query += '?,';
                    //current_form_id
                    //
                    query += '?,';
                    //label
                    //
                    query += '?,';
                    //default_value
                    //
                    query += '?,';
                    //type
                    //
                    query += '?,';
                    //ref
                    //
                    query += '?,';
                    //position
                    //
                    query += '?,';
                    //is_primary_key
                    //
                    query += '?,';
                    //is_gen_key
                    //
                    query += '?,';
                    //regex
                    //
                    query += '?,';
                    //max_range
                    //
                    query += '?,';
                    //min_range
                    //
                    query += '?,';
                    //is_required
                    //
                    query += '?,';
                    //is_title
                    //
                    query += '?,';
                    //has_jump
                    //
                    query += '?,';
                    //jumps
                    //
                    query += '?,';
                    //has_advanced_jump
                    //
                    query += '?,';
                    //datetime_format
                    //
                    query += '?,';
                    //branch_form_name
                    //
                    query += '?);';
                    //has_double_check

                    //keep track of current input @ref
                    inputs_IDs.push({
                        ref : input_ref,
                        form_id : current_form_id,
                        form_num : current_form_num,
                        id : ""//fill this after INSERT
                    });

                    tx.executeSql(query, [//
                    current_form_id, //
                    inputs[i].input_list[k].label, //
                    inputs[i].input_list[k].default_value, //
                    input_type, //
                    input_ref, //
                    inputs[i].input_list[k].position, //
                    inputs[i].input_list[k].is_primary_key, //
                    inputs[i].input_list[k].is_genkey, //
                    inputs[i].input_list[k].regex, //
                    inputs[i].input_list[k].max_range, //
                    inputs[i].input_list[k].min_range, //
                    inputs[i].input_list[k].is_required, //
                    inputs[i].input_list[k].is_title, //
                    inputs[i].input_list[k].has_jump, //
                    inputs[i].input_list[k].jumps, //
                    inputs[i].input_list[k].has_advanced_jump, //
                    inputs[i].input_list[k].datetime_format, //
                    inputs[i].input_list[k].branch_form_name, //
                    inputs[i].input_list[k].has_double_check//

                    ], _commitInputsSQLSuccess, _errorCB);

                }//for each input
            }// for each form

        };

        /* Callback called each time an input executeSql is successful
         *
         * here the input ID (geerated from the query when entering the input) is
         * linked to its input @ref
         */
        var _commitInputsSQLSuccess = function(the_tx, the_result) {

            //link each row ID to its input
            inputs_IDs[input_option_index].id = the_result.insertId;
            input_option_index++;

            console.log("executeSql SUCCESS HIERARCHY INPUTS");

        };

        var _commitInputsSuccessCB = function() {

            deferred.resolve(inputs_IDs);

            forms_with_media.length = 0;
            inputs.length = 0;

        };

        var _errorCB = function(the_tx, the_result) {

            console.log(EC.Utils.TRANSACTION_ERROR);
            console.log(the_tx);
            console.log(the_result);
        };

        module.commitInputs = function(the_inputs_object, the_forms_ids) {

            self = this;
            deferred = new $.Deferred();
            inputs = the_inputs_object;
            forms_IDs = the_forms_ids;

            inputs_IDs = [];
            forms_with_media = [];
            input_option_index = 0;

            EC.db.transaction(_commitInputsTX, _errorCB, _commitInputsSuccessCB);

            return deferred.promise();

        };

        return module;

    }(EC.Hierarchy));
