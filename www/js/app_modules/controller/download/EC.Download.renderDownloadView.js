/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Download = EC.Download || {};
EC.Download = (function (module) {
    'use strict';

    var self;
    module.renderDownloadView = function () {

        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var j;
        var iLength = forms.length;
        var jLength = iLength;
        var HTML = '';
        var dom_list = $('div#download div#download-forms');
        var form_btn;
        var form_tree;
        var back_btn = $('div#download div[data-role="header"] div[data-href="back-btn"]');
        self = this;


        self.project_id = window.localStorage.project_id;
        self.project_name =  window.localStorage.project_name;
        self.project_server_url = window.localStorage.project_server_url;

        //set back_nav_url for navigating back to forms list
        window.localStorage.back_nav_url = 'forms.html?project=' +  self.project_id + '&name=' +  self.project_name;

        var _form_btn_handler = function () {

            //get chosen form data
            self.chosen_form_name = $(this).find('span').text();
            self.chosen_form_id = $(this).attr('id');

            //update form tree in localStorage
            form_tree = EC.Utils.getParentAndChildForms(self.chosen_form_id);
            window.localStorage.form_tree = JSON.stringify(form_tree);

            EC.Notification.askConfirm('Download remote data', 'Are you sure to proceed? It might take some time', 'EC.Download.fetchRemoteData');
        };

        //handle back button hash
        back_btn.off().one('vclick', function (e) {
            EC.Routing.changePage(window.localStorage.back_nav_url);
        });

        //build buttons
        for (i = 0; i < iLength; i++) {
            HTML += '<div id="' + forms[i]._id + '" class="embedded-btn">';
            HTML += '<i class="fa fa-download  fa-fw fa-ep-embedded-btn"></i>';
            HTML += '<span class="v-nav-item-label">' + forms[i].name + '</span>';
            HTML += '</div>';
        }

        //add buttons to dom
        dom_list.append(HTML);

        //bind buttons
        for (j = 0; j < jLength; j++) {
            form_btn = $('div#download div#download-forms div#' + forms[j]._id);
            form_btn.off().on('vclick', _form_btn_handler);
        }
    };

    return module;

}(EC.Download));
