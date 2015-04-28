/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 *
 */
var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = ( function () {
    "use strict";

    var project_xml_URL = "";
    var input_options = [];
    var projects = [];
    var epicollect_server_url;
    var self;

    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $("div#index div[data-role='header'] div[data-href='home-settings']");
        var add_project_btn = $("div#index div[data-role='header'] div.ui-btn-right[data-href='add-project']");
        var settings_btn = $("div.home-settings ul li div[data-href='settings']");

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            $(".home-settings").panel("open");
            //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //test closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss').off().on('vclick', function() {
                $('.ui-panel-open').panel('close');
            });
        });

        //bind add project button (action bar)
        add_project_btn.off().one('vclick', function (e) {
            window.localStorage.back_nav_url = "#refresh";
            EC.Routing.changePage(EC.Const.ADD_PROJECT_VIEW);
        });

    };

    function _autoload(the_project_to_autoload) {

        var project_names = JSON.parse(window.localStorage.project_names);

        var project_to_autoload = window.decodeURI(the_project_to_autoload);
        var project_name;
        var deferred = new $.Deferred();
        var project_params = project_to_autoload.split("/");

        //parse project name from full project xml url
        project_name = project_params[project_params.length - 1];
        project_name = project_name.split(".");
        project_name = project_name[0];

        //There is a project to autoload: warn user if the project is already loaded on
        // the device
        console.log("Project names **************************************");
        console.log(JSON.stringify(project_names));
        if (EC.Utils.inArray(project_names, project_name, false)) {
            deferred.reject();
        }
        else {

            //double check if have an internet connection just in case
            if (EC.Utils.hasConnection()) {

                //testing on Chrome?
                if (EC.Utils.isChrome()) {
                    console.log("Testing on Chrome *****************************");
                    project_xml_URL = "xml/" + project_name + ".xml";
                }

                project_xml_URL = project_to_autoload;

                //all good, load project on device
                $.when(EC.Project.request(project_xml_URL)).then(function () {
                    // Commit project to database
                    $.when(EC.Structure.commitAll()).then(function () {
                        deferred.resolve();


                    });
                }, function () {
                    //request failed
                    deferred.reject();
                });

            }
            else {
                EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_lost"));
                deferred.reject();
            }
        }

        return deferred.promise();
    }

    function getList() {

        //@bug in Chrome where this function is called twice, I have no idea why
        console.log("EC.Project.getList() called ***********************************");

        var self = this;
        var project_to_autoload;
        var project_server_url;
        var project_xml_URL;

        //remove cached project names
        // window.localStorage.removeItem("project_names");

        //remove cached current view
        window.localStorage.removeItem("current_view_url");

        //clear project upload URL
        window.localStorage.removeItem("upload_URL");

        //load a project from custom URL scheme on device?
        if (!EC.Utils.isChrome()) {
            project_to_autoload = window.localStorage.autoload_project_url;
        }
        else {
            //testing on Chrome
            project_to_autoload = EC.Utils.getParameterByName('project');
        }

        //select all project on device
        $.when(EC.Select.getProjects()).then(function (the_projects) {

            //local variable projects?
            var projects = the_projects;
            var project_names = [];
            var i;
            var iLength;

            //cache projects in localStorage, or empty array if none yet
            if (projects.length > 0) {
                iLength = projects.length;
                for (i = 0; i < iLength; i++) {
                    project_names.push(projects[i].name);
                }
            }
            window.localStorage.project_names = JSON.stringify(project_names);
            console.log("Window Project names **************************************");
            console.log(JSON.stringify(window.localStorage.project_names));

            if (project_to_autoload === "") {

                //no project to autoload? we are done, sho list of projects on the device
                if (projects.length > 0) {
                    self.renderList(projects);
                }
                else {
                    self.renderEmptyList();
                }

            }
            else {

                //show loader we are requesting a project automatically
                EC.Notification.showProgressDialog(EC.Localise.getTranslation("wait"), EC.Localise.getTranslation("loading_project") + "/n" + project_to_autoload);

                $.when(_autoload(project_to_autoload)).then(function () {

                    //add latest project to project list
                    projects.push({
                        _id: EC.Parse.project.insertId,
                        name: EC.Parse.project.name,
                        total_branch_forms: EC.Parse.project.total_branch_forms,
                        total_hierarchy_forms: EC.Parse.project.total_hierarchy_forms
                    });

                    //remove project from localStorage (iOS only)
                    window.localStorage.autoload_project_url = "";

                    EC.Notification.hideProgressDialog();
                    //add new project to render
                    self.renderList(projects);

                }, function () {
                    //we get here when trying to autoload a project already on the device, just
                    // render stored projects
                    EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_already_loaded"));
                    EC.Notification.hideProgressDialog();
                    self.renderList(projects);

                    //remove project from localStorage (iOS only)
                    window.localStorage.ios_project_form_url = "";
                });

            }

        });

    }

    function renderList(the_projects) {

        var project_names = [];
        //build HTML
        var HTML = "";
        var i;
        var iLength;
        var dom_list = $('div#project-list ul');
        var navbar = $('a.ui-btn-active span.ui-btn-inner');

        projects = the_projects;

        //bind buttons
        _bindActionBarBtns();

        $('div#empty-list').hide();

        //dom_list.find('li').removeClass('ui-btn-active');
        dom_list.empty();

        for (i = 0,
                 iLength = projects.length; i < iLength; i++) {

            HTML += '<li data-icon="ep-next-page" >';
            HTML += '<a href="views/forms.html?project=' + projects[i]._id + '&name=' + projects[i].name + '">' + projects[i].name;
            HTML += '<span class="ui-li-count">' + projects[i].total_hierarchy_forms;
            HTML += '</span>';
            HTML += '<p>' + projects[i].total_hierarchy_forms + EC.Localise.getTranslation("hierarchy_forms") + ', ' + projects[i].total_branch_forms + EC.Localise.getTranslation("branch_forms") + '</p>';
            HTML += '</a>';
            HTML += '</li>';

            //cache the project names (unique)
            project_names.push(projects[i].name);

        }

        //cache project names in localStorage, to be used when checking for project name
        // uniqueness
        window.localStorage.project_names = JSON.stringify(project_names);

        //reset title in navbar
        navbar.text(EC.Const.PROJECT_LIST);

        dom_list.append(HTML);
        dom_list.listview('refresh');

        //remove navigation flags
        window.localStorage.removeItem("current_position");
        window.localStorage.removeItem("form_id");
        window.localStorage.removeItem("form_name");
        window.localStorage.removeItem("project_id");
        window.localStorage.removeItem("project_name");
        window.localStorage.removeItem("form_tree");

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        window.setTimeout(function () {
            $("body").removeClass("not-shown");
        }, 500);

        console.log("Language set to " + window.localStorage.DEVICE_LANGUAGE);

    }//renderList

    function renderEmptyList() {

        var dom_list = $('div#project-list ul');

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //bind buttons
        _bindActionBarBtns();

        //empty the list (if anything)
        dom_list.empty();

        //remove cached projects
        $('div#index div#empty-list').show();

        window.setTimeout(function () {
            $("body").removeClass("not-shown");
        }, 500);

        //load a project from custom URL scheme?
        console.log("project to be loaded = " + EC.Utils.getParameterByName('project'));

        EC.Notification.hideProgressDialog();

    }

    /**
     * delete project by project ID and project name
     */
    var deleteProject = function () {

        var project_id = parseInt(window.localStorage.project_id, 10);
        var project_name = window.localStorage.project_name;

        //@bug: panel closes itself on changePage, .panel('close') will stop the panel
        // from working
        $.when(EC.Delete.deleteProject(project_id, project_name)).then(function () {

            EC.Notification.showToast(EC.Localise.getTranslation("project_deleted"), "short");
            window.localStorage.is_project_deleted = 1;
            window.localStorage.back_nav_url = "#refresh";
            EC.Routing.changePage(EC.Const.INDEX_VIEW);

        }, function () {
            EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
        });
    };

    return {
        getList: getList,
        renderList: renderList,
        renderEmptyList: renderEmptyList,
        deleteProject: deleteProject
    };
}());

