var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.changePage = function (the_view, the_path) {
    'use strict';

    var view = the_view;
    var page_uri;
    //TODO: make the function reusable when we want or not want to add a new entry in the browser history
    var page;

    page_uri = EC.Utils.getPageBaseURI();
    page = (view === EC.Const.INDEX_VIEW) ? page_uri + view : page_uri + EC.Const.VIEWS_DIR + view;

    console.log('Routing to ---------------------------------> ' + page);
    $.mobile.changePage(page, {
        transition: 'fade',
        reverse: false,
        changeHash: true,
        allowSamePageTransition: true
    });
};
