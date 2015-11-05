/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Hierarchy
 *
 */
var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function (module) {
    "use strict";

    var self;
    var project;
    var deferred;

    //Transaction to save the project object
    var _commitProjectTX = function (tx) {

        var query = "";
        query += 'INSERT INTO ec_projects ( ';
        query += 'name, ';
        query += 'allowDownloadEdits, ';
        query += 'version, ';
        query += 'total_hierarchy_forms, ';
        query += 'total_branch_forms, ';
        query += 'downloadFromServer, ';
        query += 'uploadToServer) ';
        query += 'VALUES ("';
        query += project.name + '", "';
        query += project.allowDownloadEdits + '", "';
        query += project.version + '", "';
        query += project.total_hierarchy_forms + '", "';
        query += project.total_branch_forms + '", "';
        query += project.downloadFromServer + '", "';
        query += project.uploadToServer + '");';

        tx.executeSql(query, [], _commitProjectSQLSuccess, self.errorCB);

    };

    //Callback executed if the project is saved correctly to the db
    var _commitProjectSQLSuccess = function (the_tx, the_result) {

        //keep track of the last project ID we entered to the database
        project.insertId = the_result.insertId;
    };

    var _commitProjectSuccessCB = function () {

        var branch_forms;
        //commit all the hierarchy forms (main)

        //@bug on iOS: insertID can be undefined, so get the id of the last INSERT project manually
        if (project.insertId) {

            deferred.resolve(project);

        } else {

            alert("ios");
            //oh my..IOS...let's get the ID of the last entered project before doing anything else
            $.when(EC.Select.getProjectRowId(project.name)).then(function (the_project_id) {

                project.insertId = the_project_id;

                deferred.resolve(project);

            });
        }
    };

    module.commitProject = function (the_project_object) {

        self = this;
        project = the_project_object;
        deferred = new $.Deferred();

        EC.db.transaction(_commitProjectTX, self.errorCB, _commitProjectSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Hierarchy));
