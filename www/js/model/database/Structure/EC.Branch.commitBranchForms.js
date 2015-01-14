/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *   @module Branch
 *
 */
var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = ( function(module) {"use strict";

        var self;
        var deferred;
        //keep track of foreign keys
        var project_insertId;
        var branch_forms_IDs = [];
        //store forms
        var branch_forms;
        //we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
        var branch_form_num_index = 0;

        var _errorCB = function(the_tx, the_result) {
            console.log(the_result);
        };

        //Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
        var _commitBranchFormsTX = function(tx) {

            var i;
            var iLenght = branch_forms.length;
            var query;
            for ( i = 0; i < iLenght; i++) {

                query = "";
                query += 'INSERT INTO ec_branch_forms (project_id, num, name, key, has_media, is_genkey_hidden, total_inputs) ';
                query += 'VALUES ("';
                query += project_insertId + '", "';
                query += branch_forms[i].num + '", "';
                query += branch_forms[i].name + '", "';
                query += branch_forms[i].key + '", "';
                query += branch_forms[i].has_media + '", "';
                query += branch_forms[i].is_form_genkey_hidden + '", "';
                query += branch_forms[i].total_inputs + '");';

                //keep track of current form @num and database row ID. Defaults to 0, it will be set after the INSERT
                branch_forms_IDs.push({
                    num : branch_forms[i].num,
                    id : 0
                });

                tx.executeSql(query, [], _commitBranchFormsSQLSuccess, _errorCB);
            }

        };

        /*
         *  @method _commitBranchFormsSQLSuccess
         *
         *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
         *	it is called as a callback for each form executeSql()
         */
        var _commitBranchFormsSQLSuccess = function(the_tx, the_result) {

            //link each row ID to its form
            branch_forms_IDs[branch_form_num_index].id = the_result.insertId;
            branch_form_num_index++;

        };

        //resets forms array
        var _commitBranchFormsSuccessCB = function() {

            //reset forms arrays
            branch_forms.length = 0;
            
            //return branch forms IDs
            deferred.resolve(branch_forms_IDs);

        };

        /**
         * @method insertForms
         */
        module.commitBranchForms = function(the_branch_forms, the_project_insertId) {

            self = this;
            deferred = new $.Deferred();
            branch_forms = the_branch_forms;
            project_insertId = the_project_insertId;
            branch_forms_IDs.length = 0;
            branch_form_num_index = 0;

            EC.db.transaction(_commitBranchFormsTX, _errorCB, _commitBranchFormsSuccessCB);

            return deferred.promise();
        };

        return module;

    }(EC.Branch));
