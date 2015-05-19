var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = (function (module) {
    'use strict';
    //callback for a transaction error
    module.errorCB = function (the_error) {
        console.log(EC.Const.TRANSACTION_ERROR);
        console.log('%c' + the_error.message, 'color: red');
    };
    return module;
}(EC.Update));
