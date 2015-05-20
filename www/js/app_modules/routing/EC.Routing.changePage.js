var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.changePage = function (the_view, the_path) {
    'use strict';

    var view = the_view;
    var page_uri;
    //TODO: make the function reusable when we want or not want to add a new entry in the browser history
    var page;
    var transition;

    page_uri = EC.Utils.getPageBaseURI();
    page = (view === EC.Const.INDEX_VIEW) ? page_uri + view : page_uri + EC.Const.VIEWS_DIR + view;

    console.log('Routing to ---------------------------------> ' + page);

    //remove fade transition on input pages (I find it annoying)
    if (view.indexOf('inputs/') > -1 || view.indexOf('branch_inputs/') > -1) {
        transition = 'none';
    }
    else {
        transition = 'fade';
    }

    $.mobile.changePage(page, {
        transition: transition,
        reverse: false,
        changeHash: true,
        allowSamePageTransition: true
    });
};
