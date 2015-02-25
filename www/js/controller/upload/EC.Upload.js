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

		return {
			project_id : "",
			project_name : "",
			hierarchy_rows_to_sync : [],
			branch_rows_to_sync : [],
			main_rows_to_post : [],
			main_entries : [],
			hierarchy_forms : [],
			action : EC.Const.START_HIERARCHY_UPLOAD,
			current_entry : {},
			current_branch_entry : {},
			current_form : {},
			current_branch_form : {},
			has_branches : false,
			audio_synced : "",
			photo_synced : "",
			video_synced : "",
			current_image_file : "",
			current_audio_file : "",
			current_video_file : "",
			upload_data_btn : "",
			upload_images_btn : "",
			upload_audios_btn : "",
			upload_videos_btn : "",
			upload_data_feedback : "",
			back_btn : "",
			all_synced_message : "",
			
			//cache upload url for the current project in localStorage
			setUploadURL : function(the_url) {
				window.localStorage.upload_URL = the_url;
			},
			
			//get upload URL, when testing on Chrome returns "test.php"
			getUploadURL : function() {
				return (!EC.Utils.isChrome()) ? window.localStorage.upload_URL : "test.php";
			}
		};
	}());
