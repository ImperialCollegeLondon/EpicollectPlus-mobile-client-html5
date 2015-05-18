/* global LocalFileSystem */
var EC = EC || {};
EC.EmailBackup = EC.EmailBackup || {};
EC.EmailBackup = (function () {
    'use strict';

    var project_name;
    var project_id;
    var mailto;
    var backup_path;
    var filename;

    var _getBackupPath = function (the_project_name) {

        filename = the_project_name + '.txt';

        //todo this needs to be fixed
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, gotFSfail);

        function gotFS(the_fileSystem) {

            backup_path = the_fileSystem.root.nativeURL + filename;

            console.log('Backup path: ' + backup_path);

            //remove file:// from path for iOS
            if (window.device.platform === EC.Const.IOS) {
                backup_path = backup_path.slice(7);
            }

        }

        function gotFSfail(the_error) {
            console.log(the_error);
        }

    };

    var renderSendEmailView = function () {

        var mailto_holder = $('div#email-backup div#email-address-wrapper input#email-address');
        var send_email_btn = $('div#email-backup div[data-role="header"] div#send-email');
        var back_btn = $('div#email-backup div[data-role="header"] div[data-href="back-btn"]');
        var subject;
        var body;
        var back_btn_href;

        project_name = window.localStorage.project_name;
        project_id = window.localStorage.project_id;
        back_btn_href = 'forms.html?project=' + project_id + '&name=' + project_name;

        back_btn.off().one('vclick', function () {
            //go back to previuos page in history
            if (window.localStorage.current_view_url) {
                EC.Routing.changePage(window.localStorage.current_view_url);
            }
            else {
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            }
        });

        //Set header
        $('div#email-backup div[data-role="navbar"] ul li.title-tab span#email-backup-label span.project-name-inline').text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        subject = 'Backup for ' + project_name;
        body = 'The backup for project ' + project_name + ' is attached';

        //set backup full path variable (async)
        _getBackupPath(project_name);

        function sendingStatus(res) {

            console.log('Email result: ' + res);

        }


        send_email_btn.off().on('vclick', function (e) {

            if (!EC.Utils.hasConnection()) {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('no_internet'));
                return;
            }

            //get email address from input
            mailto = mailto_holder.val();

            //validate email address
            if (mailto === '' || !EC.Utils.isValidEmail(mailto)) {

                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('invalid_email'));
                return;
            }

            //check if a mail client is setup on the device
            window.plugin.email.isServiceAvailable(function (is_available) {

                //no mail client set up yet? Warn user
                if (!is_available) {
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('invalid_email_client'));
                    return;
                }

                //open mail UI
                window.plugin.email.open({
                    to: [mailto], // email addresses for TO field
                    cc: [], // email addresses for CC field
                    bcc: [], // email addresses for BCC field
                    attachments: [backup_path], //
                    subject: subject, // subject of the email
                    body: body, // email body (could be HTML code, in this case set isHtml to true)
                    isHtml: true// indicates if the body is HTML or plain text
                }, function () {
                    console.log('email view dismissed');
                }, this);

            });

        });

    };

    return {
        renderSendEmailView: renderSendEmailView
    };

}());
