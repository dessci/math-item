interface Window {
    Promise: any;
}

interface EventTarget {
    _flomath_: {
        events: {
            [type: string]: EventListener[];
        };
    };
}

module FlorianMath {

    // local interfaces

    interface IThen<T> {
        resolved: (val: T) => void;
        rejected: (reason: any) => void;
    }

    // exported interfaces

    export interface List<T> {
        length: number;
        [index: number]: T;
    }

    export interface PromiseStatic {
        new <T>(callback: (resolve: (val?: T) => void, reject?: (reason: any) => void) => void): IPromise<T>;
        resolve<T>(val?: T): IPromise<T>;
    }

    export interface IPromise<T> {
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void): IPromise<any>;
    }

    export interface EventInitParams {
        bubbles?: boolean;
        cancelable?: boolean;
        detail?: any
    }

    // local functions

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

    export function indexOf<T>(list: T[], item: T) {
        for (var k = 0; k < list.length; k++)
            if (list[k] === item)
                return k;
        return -1;
    }

    // exported functions

    export function each<T>(list: List<T>, fn: (item?: T, index?: number) => void) {
        for (var k = 0; k < list.length; k++) {
            fn(list[k], k);
        }
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

    // Custom events

    function hasCustomEvent() {
        try {
            return (typeof CustomEvent === 'function') && (new (<any> CustomEvent)('ev'));
        }
        catch (ex) {
            return false;
        }
    }

    export var dispatchCustomEvent: (target: EventTarget, typeArg: string, params?: EventInitParams) => void;
    export var addCustomEventListener: (target: EventTarget, typeArg: string, listener: EventListener) => void;
    export var removeCustomEventListener: (target: EventTarget, typeArg: string, listener: EventListener) => void;

    if (window.addEventListener) {
        if (hasCustomEvent()) {
            dispatchCustomEvent = (target: EventTarget, typeArg: string, params?: EventInitParams) => {
                var evt = new (<any> CustomEvent)(typeArg, params);
                target.dispatchEvent(evt);
            };
        } else if (document.createEvent) {
            // IE >= 9
            dispatchCustomEvent = (target: EventTarget, typeArg: string, params?: EventInitParams) => {
                var evt = document.createEvent('CustomEvent');
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                evt.initCustomEvent(typeArg, params.bubbles, params.cancelable, params.detail);
                target.dispatchEvent(evt);
            };
        }
        if (dispatchCustomEvent) {
            addCustomEventListener = (target: EventTarget, typeArg: string, listener: EventListener) => {
                target.addEventListener(typeArg, listener);
            };
            removeCustomEventListener = (target: EventTarget, typeArg: string, listener: EventListener) => {
                target.removeEventListener(typeArg, listener);
            };
        }
    }

    if (!dispatchCustomEvent) {
        // IE 8
        (function () {
            function CustomEvent(target: EventTarget, typeArg: string, params: EventInitParams) {
                params = params || { bubbles: false, detail: undefined };
                this.type = typeArg;
                this.target = target;
                this.detail = params.detail;
                this.bubbles = params.bubbles;
                this.cancelBubble = false;
            }
            CustomEvent.prototype.stopPropagation = function () {
                this.cancelBubble = true;
            };

            dispatchCustomEvent = (target: EventTarget, typeArg: string, params?: EventInitParams) => {
                var evt = new CustomEvent(target, typeArg, params);
                while (target) {
                    if (target._flomath_ && target._flomath_.events && typeArg in target._flomath_.events) {
                        each(target._flomath_.events[typeArg], (fn: EventListener) => {
                            fn(evt);
                        });
                    }
                    if (!evt.bubbles || evt.cancelBubble || !(<Node> target).parentNode)
                        break;
                    target = (<Node> target).parentNode;
                }
            };

            addCustomEventListener = (target: EventTarget, typeArg: string, listener: EventListener) => {
                if (!target._flomath_)
                    target._flomath_ = { events: {} };
                var eventDict = target._flomath_.events;
                if (!(typeArg in eventDict))
                    eventDict[typeArg] = [];
                eventDict[typeArg].push(listener);
            };

            removeCustomEventListener = (target: EventTarget, typeArg: string, listener: EventListener) => {
                if (target._flomath_ && target._flomath_.events && typeArg in target._flomath_.events) {
                    var listeners = target._flomath_.events[typeArg],
                        index = indexOf(listeners, listener);
                    if (index >= 0)
                        listeners.splice(index, 1);
                }
            };
        })();
    }

}
