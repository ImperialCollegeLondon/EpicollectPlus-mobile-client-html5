var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = (function (module) {
    'use strict';

    module.deletion_counters = [];
    module.deletion_entries = [];
    module.deletion_files = [];
    module.children_forms = [];

    //callback for a transaction error
    module.errorCB = function (the_error) {
        console.log(EC.Const.TRANSACTION_ERROR);
        console.log('%c' + the_error.message, 'color: red');
    };

    return module;
}(EC.Delete));
