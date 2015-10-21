/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * Small library of utility function helpful when running epicollect+ on older platforms or when a custom function is necessary
 *
 */
var EC = window.EC || {};
EC.Config = (function () {
    'use strict';

    //concatenate array only keeping unique values
    Array.prototype.unique = function () {

        var i;
        var j;
        var a = this.concat();

        for (i = 0; i < a.length; ++i) {
            for (j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j]) {
                    a.splice(j--, 1);
                }
            }
        }
        return a;
    };

    //search element in array
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            var i, pivot = fromIndex || 0, length;

            if (!this) {
                throw new TypeError();
            }

            length = this.length;

            if (length === 0 || pivot >= length) {
                return -1;
            }

            if (pivot < 0) {
                pivot = length - Math.abs(pivot);
            }

            for (i = pivot; i < length; i++) {
                if (this[i] === searchElement) {
                    return i;
                }
            }
            return -1;
        };
    }//indexOf

    //check if two arrays are identical, strict flag if the elements need to be in the same order
    Array.prototype.equals = function (array, is_strict) {

        var i;

        if (!array) {
            return false;
        }
        if (arguments.length === 1) {
            is_strict = true;
        }

        if (this.length !== array.length) {
            return false;
        }
        for (i = 0; i < this.length; i++) {
            if (this[i] instanceof Array && array[i] instanceof Array) {
                if (!this[i].equals(array[i], is_strict)) {
                    return false;
                }
            }
            if (is_strict && this[i] !== array[i]) {
                return false;
            }
            if (!is_strict) {
                return this.sort().equals(array.sort(), true);
            }
        }
        return true;
    };

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    //check if a string start with the passed substring/char
    if (!String.prototype.startsWith) {
        Object.defineProperty(String.prototype, 'startsWith', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function (searchString, position) {
                position = position || 0;
                return this.indexOf(searchString, position) === position;
            }
        });
    }//startsWith

    /* Truncate a string
     * @param {n} the length
     */
    String.prototype.trunc = function (n) {
        return this.substr(0, n - 1) + (this.length > n ? '...' : '');
    };

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
        Object.keys = (function () {
            var hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !({
                toString: null
            }).propertyIsEnumerable('toString'), dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'], dontEnumsLength = dontEnums.length;

            return function (obj) {
                if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                    throw new TypeError('Object.keys called on non-object');
                }

                var result = [], prop, i;

                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }

                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }());
    }
}());
