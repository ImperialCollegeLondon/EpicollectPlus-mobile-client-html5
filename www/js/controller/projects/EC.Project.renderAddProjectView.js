/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Project
 */

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = ( function(module) {"use strict";

		var load_project_btn;
		var back_btn;
		var input_value;
		var autocomplete_spinning_loader;
		var project_url;

		var _load = function() {

			if (EC.Utils.hasConnection()) {
				_loadProjectFromXML();
			} else {
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
				//load_project_btn.off().one('vclick', _load);
			}
		};

		//Load the specified project via Ajax
		var _loadProjectFromXML = function() {

			var project_name = input_value.val();

			//empty project name
			if (project_name === "") {
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_empty_not_allowed"));
				load_project_btn.off().one('vclick', _load);
				return;
			}

			// It has any kind of whitespace
			if (/\s/.test(project_name)) {
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_no_spaces_allowed"));
				load_project_btn.off().one('vclick', _load);
				return;
			}

			//load project from remote XML
			EC.Project.loadRemoteXML(project_name);

		};
		//loadProjectFromXML

		module.renderAddProjectView = function() {

			var dom_list = $("div#add-project-content ul#projects-autocomplete");
			var request_timeout;

			load_project_btn = $("div#add-project div[data-role='header'] div.ui-btn-right[data-href='load-project-confirm']");
			back_btn = $("div#add-project div[data-role='header'] div[data-href='back-btn']");
			input_value = $("div#add-project-content form div input[data-type='search']");
			autocomplete_spinning_loader = $(".autocomplete-spinner-loader");
			project_url = window.localStorage.project_server_url;
			
			//if Chrome, prepend proxy (CORS)
			if(EC.Utils.isChrome()){
				project_url = EC.Const.PROXY;
			}
			

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			input_value.val("");
            
            //populate lists with autocomplete suggestions based on project names on the server
			dom_list.on("listviewbeforefilter", function(e, data) {
			    
			    console.log("typing");
			    
				var $ul = $(this);
				var $input = $(data.input);
				var value = $input.val();
				var html = "";
				

				//wait a fifth of a second the user stops typing
				var request_delay = 200;

				$ul.html("");

				//trigger request with more than 2 chars
				if (value && value.length > 2) {
				    
				    autocomplete_spinning_loader.removeClass("not-shown");

					$ul.html('<li class="autocomplete-spinner"><i class="fa fa-spinner fa-spin"></i></li>');
					$ul.listview("refresh");

					/* Throttle requests as the user is typing on a phone. We want to send as fewer requests as possible:
					 * Typing a new char will stop the previous ajax request, not tapping for a third of a second will let the request go through
					 */
					clearTimeout(request_timeout);
					request_timeout = setTimeout(function() {
					    
					    console.log("requesting");

						$.ajax({
							url : project_url + "projects?q=" + value + "&limit=25",
							dataType : "json",
							crossDomain : true,
							success : function(response) {
							    
							    autocomplete_spinning_loader.addClass("not-shown");

								$.each(response, function(i) {
									html += "<li class='h-nav-item'>" + response[i].name + "</li>";
								});
								$ul.html(html);
								$ul.listview("refresh");
								$ul.trigger("updatelayout");

							},
							error : function(request, status, error) {
							     autocomplete_spinning_loader.addClass("not-shown");
							}
						});

					}, request_delay);
				}//if
			});

			dom_list.on('vclick', function(e) {

				if (e.target.tagName.toLowerCase() === "li") {

					input_value.val(e.target.innerText);
					input_value.attr("value", e.target.innerText);

				} else {

					return;
				}

			});

			//Load project confirm button handler
			load_project_btn.off().on('vclick', _load);

			back_btn.off().one('vclick', function(e) {

				window.localStorage.back_nav_url = "#refresh";
				EC.Routing.changePage(EC.Const.INDEX_VIEW, "../");
			});
		};

		return module;

	}(EC.Project));
