/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    module.hasBackup = function (the_project_name) {

        var filename = the_project_name + '.txt';
        var backup_path;
        var forms_data = [];
        var deferred = new $.Deferred();

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, gotFSfail);

        function gotFS(the_fileSystem) {

            console.log(JSON.stringify(the_fileSystem));

            backup_path = the_fileSystem.root.fullPath;

            the_fileSystem.root.getFile(filename, {
                create: false,
                exclusive: false
            }, gotBackupSuccess, gotBackupFail);

        }

        function gotBackupSuccess() {
            deferred.resolve();
        }

        function gotBackupFail() {
            deferred.reject();
        }

        function gotFSfail(the_error) {
            console.log(the_error);
        }

        return deferred.promise();

    };

    return module;

}(EC.File));
