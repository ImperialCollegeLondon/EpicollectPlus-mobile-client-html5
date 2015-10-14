/*global $, jQuery*/
/*
 *   @module Structure
 *
 */
var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var deferred;
    var project;

    module.commitAll = function () {

        deferred = new $.Deferred();

        $.when(EC.Hierarchy.commitProject(EC.Parse.project)).then(function (the_project) {

            project = the_project;

            //if we have branches, save both hierarchy and branch structure to db

            //commit all branch forms (if any)
            var branch_forms = EC.Parse.getBranchForms();
            var hierarchy_forms = EC.Parse.getHierarchyForms();
            if (branch_forms.length > 0) {

                //commit both hierarchy and branch forms
                $.when(EC.Hierarchy.commitForms(hierarchy_forms, project.insertId), EC.Branch.commitBranchForms(branch_forms, project.insertId)).then(function (hierarchy_forms_IDs, branch_forms_IDs) {

                    var hierarchy_inputs = EC.Parse.inputs;
                    var branch_inputs = EC.Parse.branch_inputs;

                    $.when(EC.Hierarchy.commitInputs(hierarchy_inputs, hierarchy_forms_IDs), EC.Branch.commitBranchInputs(branch_inputs, branch_forms_IDs)).then(function (hierarchy_inputs_IDs, branch_inputs_IDs) {

                        var branch_options = EC.Parse.branch_options;
                        var hierarchy_options = EC.Parse.options;

                        //commit hierarchy input options if any
                        if (hierarchy_options.length > 0) {
                            $.when(EC.Hierarchy.commitInputOptions(hierarchy_options, hierarchy_inputs_IDs)).then(function () {

                                //hierarchy option saved, save branch input options if any
                                if (branch_options.length > 0) {
                                    $.when(EC.Branch.commitBranchInputOptions(branch_options, branch_inputs_IDs)).then(function () {

                                        //options saved , redirect to projects list
                                        console.log("models ready");
                                        deferred.resolve();
                                    });

                                } else {

                                    //no branch options, redirect
                                    console.log("models ready");
                                    deferred.resolve();
                                }

                            });
                        } else {
                            //commit branch input options if any
                            if (branch_options.length > 0) {
                                $.when(EC.Branch.commitBranchInputOptions(branch_options, branch_inputs_IDs)).then(function () {

                                    //options saved
                                    console.log("models ready");
                                    deferred.resolve();
                                });
                            } else {
                                //no branch options, done
                                console.log("models ready");
                                deferred.resolve();
                            }
                        }
                    });

                });

            } else {

                //commit only hierarchy forms
                $.when(EC.Hierarchy.commitForms(hierarchy_forms, project.insertId)).then(function (forms_IDs) {
                    //commit hierarchy inputs
                    var inputs = EC.Parse.inputs;

                    $.when(EC.Hierarchy.commitInputs(inputs, forms_IDs)).then(function (inputs_IDs) {

                        var options = EC.Parse.options;

                        //commit input options if any
                        if (options.length > 0) {
                            $.when(EC.Hierarchy.commitInputOptions(options, inputs_IDs)).then(function () {

                                //options saved , done
                                console.log("models ready");
                                deferred.resolve();

                            });
                        } else {
                            //no options, done
                            console.log("models ready");
                            deferred.resolve();
                        }

                    });

                });

            }

        });

        return deferred.promise();

    };

    return module;

}(EC.Structure));
