/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Localise
 */

var EC = EC || {};
EC.Localise = EC.Localise || {};
EC.Localise = ( function () {
    "use strict";

    //TODO: get device language from localStorage (set in app.js)
    var language;
    var self;

    function setLanguage() {
        language = window.localStorage.DEVICE_LANGUAGE;
    }

    //TODO: return translation based on key and device language
    function getTranslation(the_key) {

        var key_to_lookup = the_key;
        var translated_string = "";

        try {
            translated_string = EC.Dictionary[language][key_to_lookup];
        } catch (error) {
            translated_string = "Translation not found";
        }

        return translated_string;

    }

    function applyToHTML(the_language) {

        //TODO for each data-i10n, replace text with translated one
        var page_id = $.mobile.activePage.attr("id");
        var strings = $('div#' + page_id + ' [data-i10n]');
        var translated_string;
        var self = this;

        console.log(strings);

        strings.each(function (index) {

            console.log($(this).data("i10n"));
            translated_string = self.getTranslation($(this).data("i10n"));
            $(this).text(translated_string);

        });

    }

    function applyToPlaceholders(the_language) {

        var page_id = $.mobile.activePage.attr("id");
        var placeholders = $('div#' + page_id + ' [placeholder]');
        var translated_string;
        var self = this;

        placeholders.each(function (index) {

            console.log($(this).attr("placeholder"));
            translated_string = self.getTranslation($(this).attr("placeholder"));
            $(this).attr("placeholder", translated_string);

        });

    }

    return {
        setLanguage: setLanguage,
        getTranslation: getTranslation,
        applyToHTML: applyToHTML,
        applyToPlaceholders: applyToPlaceholders
    };

}());
