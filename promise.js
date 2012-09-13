/*
 *  Copyright 2012 (c) Pierre Duquesne <stackp@online.fr>
 *  Licensed under the New BSD License.
 *  https://github.com/stackp/promisejs
 */

(function(exports) {

    function bind(func, context) {
        return function() {
            return func.apply(context, arguments);
        };
    }

    function Promise() {
        this._callbacks = [];
    }

    Promise.prototype.then = function(func, context) {
        var f = bind(func, context);
        if (this._isdone) {
            f(this.error, this.result);
        } else {
            this._callbacks.push(f);
        }
    };

    Promise.prototype.done = function(error, result) {
        this._isdone = true;
        this.error = error;
        this.result = result;
        for (var i = 0; i < this._callbacks.length; i++) {
            this._callbacks[i](error, result);
        }
        this._callbacks = [];
    };

    function join(funcs) {
        var numfuncs = funcs.length;
        var numdone = 0;
        var p = new Promise();
        var errors = [];
        var results = [];

        function notifier(i) {
            return function(error, result) {
                numdone += 1;
                errors[i] = error;
                results[i] = result;
                if (numdone === numfuncs) {
                    p.done(errors, results);
                }
            };
        }

        for (var i = 0; i < numfuncs; i++) {
            funcs[i]().then(notifier(i));
        }

        return p;
    }

    function chain(funcs, error, result) {
        var p = new Promise();
        if (funcs.length === 0) {
            p.done(error, result);
        } else {
            funcs[0](error, result).then(function(res, err) {
                funcs.splice(0, 1);
                chain(funcs, res, err).then(function(r, e) {
                    p.done(r, e);
                });
            });
        }
        return p;
    }

    var promise = {
        Promise: Promise,
        join: join,
        chain: chain
    };

    if (typeof define === 'function' && define.amd) {
        /* AMD support */
        define(function() {
            return promise;
        });
    } else {
        exports.promise = promise;
    }

})(this);
