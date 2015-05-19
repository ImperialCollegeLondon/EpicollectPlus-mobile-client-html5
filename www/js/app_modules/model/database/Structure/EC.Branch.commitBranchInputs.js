/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Branch
 *
 */

var EC = EC || {};
EC.Branch = ( function(module) {"use strict";

        var self;
        var deferred;

        //track inputs IDs
        var branch_inputs_IDs = [];

        //we need to keep track of the input option @ref to be linked with whatever ID it gets upon being entered to the the db
        var branch_input_option_index = 0;

        //store inputs object
        var branch_inputs;

        var branch_forms_with_media = [];
        var branch_forms_IDs = [];

        //Transaction to save all the inputs for each form to database
        var _commitBranchInputsTX = function(tx) {

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

            //loop input array, one element per form . Each element contains an input list and the @num attribute
            for ( i = 0, iLength = branch_inputs.length; i < iLength; i++) {

                //get the database ID for the current form
                current_form_num = branch_inputs[i].num;
                for ( j = 0, jLength = branch_forms_IDs.length; j < jLength; j++) {

                    if (branch_forms_IDs[j].num === current_form_num) {

                        //exit loop as soon as we get a match
                        current_form_id = branch_forms_IDs[j].id;
                        break;
                    }
                }//j for

                //loop each input for the current element(form) and commit it
                for ( k = 0, kLength = branch_inputs[i].input_list.length; k < kLength; k++) {

                    input_type = branch_inputs[i].input_list[k].type;
                    input_ref = branch_inputs[i].input_list[k].ref;

                    query = "";
                    query += 'INSERT INTO ec_branch_inputs (';
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
                    query += 'has_double_check) ';
                    query += 'VALUES ("';
                    query += current_form_id + '", "';
                    query += branch_inputs[i].input_list[k].label + '", "';
                    query += branch_inputs[i].input_list[k].default_value + '", "';
                    query += input_type + '", "';
                    query += input_ref + '", "';
                    query += branch_inputs[i].input_list[k].position + '", "';
                    query += branch_inputs[i].input_list[k].is_primary_key + '", "';
                    query += branch_inputs[i].input_list[k].is_genkey + '", "';
                    query += branch_inputs[i].input_list[k].regex + '", "';
                    query += branch_inputs[i].input_list[k].max_range + '", "';
                    query += branch_inputs[i].input_list[k].min_range + '", "';
                    query += branch_inputs[i].input_list[k].is_required + '", "';
                    query += branch_inputs[i].input_list[k].is_title + '", "';
                    query += branch_inputs[i].input_list[k].has_jump + '", "';
                    query += branch_inputs[i].input_list[k].jumps + '", "';
                    query += branch_inputs[i].input_list[k].has_advanced_jump + '", "';
                    query += branch_inputs[i].input_list[k].datetime_format + '", "';

                    query += branch_inputs[i].input_list[k].has_double_check + '");';

                    //keep track of current input @ref
                    branch_inputs_IDs.push({
                        ref : input_ref,
                        form_id : current_form_id,
                        form_num : current_form_num
                    });

                    tx.executeSql(query, [], _commitBranchInputsSQLSuccess, self.errorCB);

                }//for each input

            }// for each form

        };

        /* Callback called each time an input executeSql is successful
         *
         * here the input ID (geerated from the query when entering the input) is linked to its input @ref
         */
        var _commitBranchInputsSQLSuccess = function(the_tx, the_result) {

            //link each row ID to its input
            branch_inputs_IDs[branch_input_option_index].id = the_result.insertId;
            branch_input_option_index++;

            console.log("executeSql SUCCESS INPUTS");

        };

        var _commitBranchInputsSuccessCB = function() {

            branch_forms_IDs.length = 0;
            branch_inputs.length = 0;
            branch_forms_with_media.length = 0;

            deferred.resolve(branch_inputs_IDs);
            
        };

        module.commitBranchInputs = function(the_branch_inputs, the_branch_forms_ids) {

            self = this;
            deferred = new $.Deferred();
            branch_inputs = the_branch_inputs;
            branch_forms_IDs = the_branch_forms_ids;

            EC.db.transaction(_commitBranchInputsTX, self.errorCB, _commitBranchInputsSuccessCB);

            return deferred.promise();
        };

        return module;

    }(EC.Branch));
