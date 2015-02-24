interface Window {
    Promise: any;
}

module FlorianMath {

    interface IThen<T> {
        resolved: (val: T) => void;
        rejected: (reason: any) => void;
    }

    export interface List<T> {
        length: number;
        [index: number]: T;
    }

    export function each<T>(list: List<T>, fn: (item?: T, index?: number) => void) {
        for (var k = 0; k < list.length; k++) {
            fn(list[k], k);
        }
    }

    export interface PromiseStatic {
        new <T>(callback: (resolve: (val?: T) => void, reject?: (reason: any) => void) => void): IPromise<T>;
        resolve<T>(val?: T): IPromise<T>;
        //reject(reason?: any): IPromise<void>;
        //all(promises: IPromise<any>[]): IPromise<any[]>;
    }

    export interface IPromise<T> {
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void): IPromise<any>;
    }

    function hasPromise(local) {
        return ('Promise' in local && 'resolve' in local.Promise && 'reject' in local.Promise &&
                'all' in local.Promise && 'race' in local.Promise &&
                (function () {
                    var resolve;
                    new local.Promise(function (r) {
                        resolve = r;
                    });
                    return typeof resolve === 'function';
                }));
    }

    export var Promise: PromiseStatic = hasPromise(window)
        ? window.Promise : (function () {
        var Promise: PromiseStatic = <any> function <T>(callback: (resolve: (val: T) => void, reject?: (reason: any) => void) => void) {
            var flush = (thenFunc: (resolved: (val: T) => void, rejected?: (reason: any) => void) => void) => {
                this.then = thenFunc;
                each(this._thens, (then: IThen<T>) => {
                    thenFunc(then.resolved, then.rejected);
                });
                delete this._thens;
            };
            this._thens = [];
            callback((val: T) => {
                flush((resolved: (val: T) => void) => {
                    resolved(val);
                });
            }, (reason: any) => {
                flush((resolved: (val: T) => void, rejected?: (reason: any) => void) => {
                    if (rejected) rejected(reason);
                });
            });
        };
        Promise.prototype.then = function <T>(resolved: (val: T) => void, rejected?: (reason: any) => void) {
            this._thens.push({ resolved: resolved, rejected: rejected });
        };
        Promise.resolve = function <T>(val: T): IPromise<T> {
            return new Promise((resolve: (val: T) => void) => {
                resolve(val);
            });
        }
        return Promise;
    })();

    export function getElementStyle(el: HTMLElement, prop: string) {
        if (typeof getComputedStyle === 'function')
            return getComputedStyle(el, null).getPropertyValue(prop);
        else
            return el.currentStyle[prop];
    }

    function addEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void) {
        if (el.addEventListener)
            el.addEventListener(type, callback, false);
        else
            (<MSEventAttachmentTarget> <any> el).attachEvent('on' + type, callback);
    }

    export var domReady = (function () {
        var promise = document.readyState === 'complete'
            ? Promise.resolve<void>()
            : new Promise<void>((resolve: () => void) => {
                var fired = false;

                function trigger() {
                    if (fired) return;
                    fired = true;
                    resolve();
                }

                if (document.addEventListener) {
                    document.addEventListener('DOMContentLoaded', trigger);
                }
                if (document.attachEvent) {
                    document.attachEvent('onreadystatechange', () => {
                        if (document.readyState === 'complete')
                            trigger();
                    });
                }
                addEventListenerFn(window, 'load', trigger);
            });

        return () => promise;
    })();

    export var async = typeof requestAnimationFrame === 'function'
            ? (fn: () => void) => { requestAnimationFrame(fn); }
            : (fn: () => void) => { setTimeout(fn, 0); };

    export var trim: (st: string) => string = String.prototype.trim
        ? (st: string) => st.trim()
        : ((): { (st: string): string } => {
            var characters = '[\\s\\uFEFF\\xA0]';
            var regex = new RegExp('^' + characters + '+|' + characters + '+$', 'g');
            return (st: string) => st.replace(regex, '');
        })();

}
