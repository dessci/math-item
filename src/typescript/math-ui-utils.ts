module MathUI {
    'use strict';

    export interface Iterator<T, TResult> {
        (arg1: T, arg2: any, arg3: any): TResult;
    }

    export interface ListIterator<T, TResult> extends Iterator<T, TResult> {
        (value: T, index: number, list: T[]): TResult;
    }

    export interface ObjectIterator<T, TResult> extends Iterator<T, TResult> {
        (element: T, key: string, list: any): TResult;
    }

    export interface Collection<T> { }

    export interface List<T> extends Collection<T> {
        [index: number]: T;
        length: number;
    }

    export interface Dictionary<T> extends Collection<T> {
        [index: string]: T;
    }

    export interface IUtils {
        each<T>(list: List<T>, iterator: ListIterator<T, void>, context?: any): List<T>;
        each<T>(object: Dictionary<T>, iterator: ObjectIterator<T, void>, context?: any): Dictionary<T>;
        map<T, TResult>(list: List<T>, iterator: ListIterator<T, TResult>, context?: any): TResult[];
        map<T, TResult>(object: Dictionary<T>, iterator: ObjectIterator<T, TResult>, context?: any): TResult[];
        filter<T>(list: List<T>, iterator: ListIterator<T, boolean>, context?: any): T[];
        filter<T>(object: Dictionary<T>, iterator: ObjectIterator<T, boolean>, context?: any): T[];
        indexOf<T>(list: T[], item: T): number;
        contains<T>(list: List<T>, item: T): boolean;
        difference<T>(list1: List<T>, list2: List<T>): T[];
        union<T>(list1: List<T>, list2: List<T>): T[];
        without<T>(list: List<T>, elem: T): T[];
        isArray(obj: any): boolean;
        toArray<T>(list: List<T>): T[];
        trim(st: string): string;
        words(st: string): string[];
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty,
        nativeKeys = Object.keys;

    function isObject(obj: any) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    function has(obj: any, key: string) {
        return obj != null && hasOwnProperty.call(obj, key);
    }

    function keys(obj: any) {
        if (!isObject(obj)) return [];
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj) if (has(obj, key)) keys.push(key);
        return keys;
    }

    function each<T, TResult>(obj: any, iteratee: Iterator<T, TResult>, context?: any): any {
        if (obj == null) return obj;
        var i, length = obj.length;
        if (length === +length) {
            for (i = 0; i < length; i++) {
                iteratee.call(context, obj[i], i, obj);
            }
        } else {
            var ks = keys(obj);
            for (i = 0, length = ks.length; i < length; i++) {
                iteratee.call(context, obj[ks[i]], ks[i], obj);
            }
        }
        return obj;
    }

    function map<T, TResult>(obj: any, iteratee: Iterator<T, TResult>, context?: any): TResult[] {
        if (obj == null) return [];
        var ks = obj.length !== +obj.length && keys(obj),
            length = (ks || obj).length,
            results = Array(length),
            currentKey;
        for (var index = 0; index < length; index++) {
            currentKey = ks ? ks[index] : index;
            results[index] = iteratee.call(context, obj[currentKey], currentKey, obj);
        }
        return results;
    }

    function filter<T>(list: Collection<T>, predicate: Iterator<T, boolean>, context?: any): T[] {
        var result = [];
        each(list, (value: T, index: number, list: Collection<T>) => {
            if (predicate.call(context, value, index, list))
                result.push(value);
        });
        return result;
    }

    function contains<T>(list: List<T>, elem: T) {
        return indexOf(list, elem) >= 0;
    }

    function difference<T>(list1: List<T>, list2: List<T>): T[] {
        return filter(list1, (item: T) => !contains(list2, item));
    }

    function union<T>(list1: List<T>, list2: List<T>): T[] {
        var result = difference(list1, list2);
        Array.prototype.push.apply(result, list2);
        return result;
    }

    function indexOf<T>(array: List<T>, item: T): number {
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }

    var trim: (st: string) => string = String.prototype.trim
        ? (st: string) => st.trim()
        : ((): { (st: string): string } => {
            var characters = '[\\s\\uFEFF\\xA0]';
            var regex = new RegExp('^' + characters + '+|' + characters + '+$', 'g');
            return (st: string) => st.replace(regex, '');
        })();

    var utils: IUtils = {
        each: each,
        map: map,
        filter: filter,
        indexOf: indexOf,
        contains: contains,
        union: union,
        difference: difference,
        without: <T>(list: List<T>, elem: T) => filter(list, (item: T) => item !== elem),
        trim: trim,
        words: (st: string) => {
            st = trim(st);
            return st ? st.split(/\s+/) : [];
        },
        isArray: (obj: any) => Object.prototype.toString.call(obj) === '[object Array]',
        toArray: <T>(list: List<T>): T[]=> map(list, (item: T) => item)
    };

    export function getUtils(): IUtils {
        return utils;
    }

    interface IThen<T> {
        resolved: (val: T) => void;
        rejected: (reason: any) => void;
    }

    export interface IPromise<T> {
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void): void;
    }

    export class Promise<T> implements IPromise<T> {
        private _thens: IThen<T>[] = [];
        constructor(callback: (resolve: (val?: T) => void, reject?: (reason: any) => void) => void) {
            var flush = () => {
                each(this._thens, (then: IThen<T>) => {
                    this.then(then.resolved, then.rejected);
                });
                delete this._thens;
            }
            callback((val: T) => {
                this.then = (resolved: (val: T) => void) => {
                    resolved(val);
                };
                flush();
            }, (reason: any) => {
                this.then = (resolved: (val: T) => void, rejected?: (reason: any) => void) => {
                    if (rejected) rejected(reason);
                };
                flush();
            });
        }
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void) {
            this._thens.push({ resolved: resolved, rejected: rejected });
        }
        static resolve<T>(val?: T): IPromise<T> {
            return new Promise((resolve: (val: T) => void) => {
                resolve(val);
            });
        }
        static all(promises: IPromise<any>[]): IPromise<any[]> {
            return new Promise((resolve: (val: any[]) => void, reject: (reason: any) => void) => {
                var results = [];
                function check(k: number) {
                    if (k < promises.length) {
                        promises[k].then((val: any) => {
                            results.push(val);
                            check(k + 1);
                        }, (reason: any) => {
                            reject(reason);
                        });
                    } else
                        resolve(results);
                }
                check(0);
            });
        }
    }

    export interface PromiseWithResolver<T> extends IPromise<T> {
        resolve(val?: T): void;
    }

    export function makePromiseWithResolver<T>() {
        var resolver,
            p = <PromiseWithResolver<T>> <any> new Promise<T>((resolve: (val?: T) => void) => {
                resolver = resolve;
            });
        p.resolve = resolver;
        return p;
    }

    export var async: (fn: () => void) => void = typeof requestAnimationFrame === 'function'
        ? (fn: () => void) => { requestAnimationFrame(fn); }
        : (fn: () => void) => { setTimeout(fn, 0); }

}
