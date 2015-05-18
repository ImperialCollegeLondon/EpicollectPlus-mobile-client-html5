/* global LocalFileSystem */
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    var forms;
    var project_name;
    var project_id;
    var backup_path;

    /**
     * @method _writeFile Write the project backup object to a file <project_name>.txt
     * The file is written to LocalFileSystem.PERSISTENT, whatever that resolves to (it depends on the device and platform)
     * @param {Object} the_content
     */
    function _writeFile(the_content) {
        function fail(the_error) {
            console.log(the_error);
        }


        console.log(JSON.stringify(the_content));

        var txt_content = JSON.stringify(the_content);
        var filename = project_name + '.txt';
        var deferred = new $.Deferred();

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

        function gotFS(the_fileSystem) {

            console.log(JSON.stringify(the_fileSystem));
            backup_path = the_fileSystem.root.fullPath;

            the_fileSystem.root.getFile(filename, {
                create: true,
                exclusive: false
            }, gotFileEntry, fail);
        }

        function gotFileEntry(fileEntry) {
            fileEntry.createWriter(gotFileWriter, fail);
        }

        function gotFileWriter(writer) {

            writer.onwritestart = function () {
            };

            writer.onwriteend = function (evt) {

                //file written successfully,
                deferred.resolve();
                console.log('Content of file:' + txt_content);
            };
            //write content to file
            writer.write(txt_content);
        }

        return deferred.promise();
    }

    /** @method backup Get data to backup for the current project (saving tables ec_data and ec_branch_data)
     *
     * @param {Object} the_forms the hierarchy forms
     * @param {Object} the_project_name current project name
     */
    module.backup = function (the_forms, the_project_name, the_project_id) {

        var deferred = new $.Deferred();
        forms = the_forms;
        project_name = the_project_name;
        project_id = the_project_id;

        //get data rows for all the forms for this project
        $.when(EC.Select.getAllProjectEntries(forms, project_id)).then(function (the_entries) {
            $.when(_writeFile(the_entries)).then(function () {
                deferred.resolve();
            });
        });

        return deferred.promise();

    };

    return module;

}(EC.File));
