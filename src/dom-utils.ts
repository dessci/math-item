/// <reference path="common-utils.ts" />

module FlorianMath {
    'use strict';

    export interface IUtils {
        dom: {
            addEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void): void;
            ready(): Promise<void>;
            async(fn: () => void): void;
            getNodeChildren(n: Node, filter?: (n: Node) => boolean): Node[];
            getElementChildren(n: Node): Element[];
        }
    }

    function addEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void) {
        if (el.addEventListener)
            el.addEventListener(type, callback, false);
        else
            (<MSEventAttachmentTarget> <any> el).attachEvent('on' + type, callback);
    }

    function getNodeChildren(n: Node, filter?: (n: Node) => boolean) {
        var result: Node[] = [], c = n.firstChild;
        while (c) {
            if (!filter || filter(c))
                result.push(c);
            c = c.nextSibling;
        }
        return result;
    }

    _utils.dom = {
        addEventListenerFn: addEventListenerFn,

        ready: (function () {
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
        })(),

        async: typeof requestAnimationFrame === 'function'
            ? (fn: () => void) => { requestAnimationFrame(fn); }
            : (fn: () => void) => { setTimeout(fn, 0); },

        getNodeChildren: getNodeChildren,

        getElementChildren: (n: Node) => <Element[]> getNodeChildren(n, (c: Node) => c.nodeType === 1)
    }

}