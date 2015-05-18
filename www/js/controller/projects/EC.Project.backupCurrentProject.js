var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = (function (module) {
    'use strict';

    function _projectBackupFeedback(is_positive) {

        var restore_from_backup_btn = $('div#forms div#project-options ul li#restore-data-from-backup');
        var mail_backup_btn = $('div#forms div#project-options ul li#email-backup');

        //close panel
        $('div#forms div#project-options').panel('close');
        if (is_positive) {
            EC.Notification.showAlert(EC.Localise.getTranslation('success'), EC.Localise.getTranslation('project_backup_success'));

            //enable 'restore from backup' button and 'email backup'
            restore_from_backup_btn.removeClass('ui-disabled');
            mail_backup_btn.removeClass('ui-disabled');
        } else {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        }
    }

    module.backupCurrentProject = function () {

        EC.Notification.showProgressDialog();

        var forms = JSON.parse(window.localStorage.forms);
        var project_name = window.localStorage.project_name;
        var project_id = parseInt(window.localStorage.project_id, 10);

        $.when(EC.File.backup(forms, project_name, project_id)).then(function () {
            EC.Notification.hideProgressDialog();
            _projectBackupFeedback(true);
        }, function () {
            EC.Notification.hideProgressDialog();
            _projectBackupFeedback(false);
        });
    };

    return module;

}(EC.Project));
