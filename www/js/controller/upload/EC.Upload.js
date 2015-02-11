/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = ( function() {
		"use strict";

		var project_id;
		var data_rows = [];
		var entries;

		var upload_data_btn;
		var upload_images_btn;
		var upload_audios_btn;
		var upload_videos_btn;
		var upload_data_feedback;
		var images = [];
		var audios = [];
		var videos = [];
		var audio_synced;
		var photo_synced;
		var video_synced;
		var media_type = "";

		/**
		 *  Arrays/Objects to expose to make them accessible module wise
		 */
		var hierarchy_rows_to_sync = [];
		var branch_rows_to_sync = [];
		var main_rows_to_post = [];
		var main_entries = [];
		var hierarchy_forms = [];
		var current_entry = {};
		var current_branch_entry = {};
		var current_form = {};
		var current_branch_form = {};
		var action = EC.Const.START_HIERARCHY_UPLOAD;
		var has_branches = false;
		var is_branch_entry = false;

		var getUploadURL = function() {

			var upload_URL;

			if (!EC.Utils.isChrome()) {

				upload_URL = window.localStorage.upload_URL;
			}
			else {

				upload_URL = "test.php";
			}

			return upload_URL;

		};

		var setUploadURL = function(the_url) {
			window.localStorage.upload_URL = the_url;
		};

		return {
			hierarchy_rows_to_sync : hierarchy_rows_to_sync,
			branch_rows_to_sync : branch_rows_to_sync,
			main_rows_to_post : main_rows_to_post,
			main_entries : main_entries,
			hierarchy_forms : hierarchy_forms,
			action : action,
			current_entry : current_entry,
			current_branch_entry : current_branch_entry,
			current_form : current_form,
			current_branch_form : current_branch_form,
			has_branches : has_branches,
			setUploadURL : setUploadURL,
			getUploadURL : getUploadURL,
			audio_synced : audio_synced,
			photo_synced : photo_synced,
			video_synced : video_synced
		};

	}());
