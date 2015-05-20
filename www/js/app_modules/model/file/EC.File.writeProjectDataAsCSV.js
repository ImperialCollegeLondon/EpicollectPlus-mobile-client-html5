/* global cordova, Papa, JSZip */
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    //currently Android only
    module.writeProjectDataAsCSV = function (the_project_name, the_data) {

        var deferred = new $.Deferred();
        var export_dir;
        var filename;
        var csv;
        var zip;
        var zip_content;
        var data = the_data;
        var project_name = the_project_name;

        function fail(error) {
            console.log(error);
        }

        function onGotFS(filesystem) {
            //filesystem is a handler to <sdcard>, emulated or real it does not matter

            //create app directory in externalstorage if it does not exist
            filesystem.getDirectory(export_dir, {
                create: true,
                exclusive: false
            }, onCreateDirSuccess, fail);

            function onCreateDirSuccess(filesystem) {

                console.log(filesystem.nativeURL);

                /*
                 inside this function, filesystem is:
                     Android:/storage/emulated/0/<app_name>-export/ (path can be different depending on device)

                     iOS : /var/mobile/Containers/Data/Application/<Bundle_ID>/Documents/<app_name>-export/

                 with <app_name> sanitised from special chars
                 */


                function gotFileEntry(fileEntry) {

                    function gotFileWriter(writer) {

                        writer.onwritestart = function () {
                        };

                        writer.onwriteend = function (evt) {
                            //file written successfully,
                            console.log('Content of file:' + zip_content);
                            deferred.resolve({
                                filename: filename,
                                folder: export_dir
                            });
                        };
                        //write content to file
                        writer.write(zip_content);
                    }

                    fileEntry.createWriter(gotFileWriter, fail);
                }

                filesystem.getFile(filename, {
                    create: true,
                    exclusive: false
                }, gotFileEntry, fail);
            }
        }

        //get export dir name before doing anything
        $.when(EC.Utils.getExportDirName()).then(function (the_dir) {

            var i;
            var iLength;
            console.log(the_dir);
            export_dir = the_dir;

            //JSZip API https://stuk.github.io/jszip/
            zip = new JSZip();

            //zip file name is the project name
            filename = project_name + '.zip';

            //loop each form
            iLength = data.length;

            //generate a csv file per each form
            for (i = 0; i < iLength; i++) {

                //parse JSON to CSV
                csv = Papa.unparse(data[i].entries, {
                    quotes: true,
                    delimiter: ',',
                    newline: '\r\n'
                });
                console.log(csv);

                //add file (use form name as filename) to master zip file
                zip.file(data[i].name + '.csv', csv);
            }

            //generate zip file containing all the forms
            zip_content = zip.generate({type: 'blob', compression: 'STORE'});

            //start writing zip file to disk
            if (window.device.platform === EC.Const.ANDROID) {
                //on Android, get hold of the public storage roor dir
                window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, onGotFS, fail);
            }
            else {
                //on iOS, get hold of 'Documents/' dir
                window.resolveLocalFileSystemURL(cordova.file.documentsDirectory, onGotFS, fail);
            }
        });

        return deferred.promise();

    };
    return module;
}(EC.File));
