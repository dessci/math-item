interface Document {
    registerElement(tagName: string, options: any): void;
}

declare module FlorianMath {
    class Promise<T> {
        private _thens;
        constructor(callback: (resolve: (val?: T) => void, reject?: (reason: any) => void) => void);
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void): void;
        static resolve<T>(val?: T): Promise<T>;
        static all(promises: Promise<any>[]): Promise<any[]>;
    }
}

module FlorianMath {

    var INLINE_PARENT_TAGS = ['b', 'i', 'small', 'em', 'a', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    interface Dictionary<T> {
        [key: string]: T;
    }

    interface PromiseWithResolve<T> extends Promise<T> {
        resolve(val?: T): void;
    }

    export interface HTMLMathItemElement extends HTMLElement {
        handler: Handler;
        ready: PromiseWithResolve<void>;
    }

    export class Handler {
        initialize(el: HTMLMathItemElement) {
            el.ready.resolve();
        }
        canHandle(el: HTMLElement): boolean {
            return false;
        }
        getDisplayStyle(el: HTMLElement): string {
            return null;
        }
    }

    export var async: (fn: () => void) => void = typeof requestAnimationFrame === 'function'
        ? (fn: () => void) => { requestAnimationFrame(fn); }
        : (fn: () => void) => { setTimeout(fn, 0); }

    export function indexOf<T>(array: { [idx: number]: T; length: number }, item: T): number {
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }

    export function contains<T>(list: { [idx: number]: T; length: number}, item: T): boolean {
        return indexOf(list, item) >= 0;
    }

    // http://stackoverflow.com/a/7951947/212069
    export var parseXML = typeof DOMParser === 'function'
        ? (data: string) => (new DOMParser()).parseFromString(data, 'text/xml')
        : typeof ActiveXObject === 'function' && new ActiveXObject('Microsoft.XMLDOM')
        ? (data: string) => {
            var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = 'false';
            xmlDoc.loadXML(data);
            return xmlDoc;
        } : () => {
            throw new Error('parseXML not supported');
        };

    export function getElementChildren(n: Node) {
        var result: Element[] = [], c = n.firstChild;
        while (c) {
            if (c.nodeType === 1) result.push(<Element> c);
            c = c.nextSibling;
        }
        return result;
    }

    class HandlerStore {
        private handlerDict: Dictionary<Handler> = {};
        private handlerOrder: string[] = [];
        put(type: string, handler: Handler): Handler {
            var previous = this.remove(type);
            this.handlerDict[type] = handler;
            this.handlerOrder.splice(0, 0, type);
            return previous;
        }
        get(type: string): Handler {
            return this.handlerDict[type];
        }
        remove(type: string): Handler {
            if (type in this.handlerDict) {
                var k = indexOf(this.handlerOrder, type);
                if (k >= 0)
                    this.handlerOrder.splice(k, 1);
                delete this.handlerDict[type];
            }
            return null;
        }
        find(fn: (handler: Handler) => boolean): Handler {
            for (var k = 0; k < this.handlerOrder.length; k++) {
                var handler = this.handlerDict[this.handlerOrder[k]];
                if (fn(handler)) return handler;
            }
        }
    }

    var handlerStore = new HandlerStore();

    export function registerHandler(type: string, handler: Handler): Handler {
        return handlerStore.put(type, handler);
    }

    // MathItem callbacks

    function mathItemCreated(mathItem: HTMLMathItemElement) {
        mathItem.setAttribute('role', 'math');
        mathItem.handler = handlerStore.get(mathItem.getAttribute('handler'))
            || handlerStore.find((h: Handler) => h.canHandle(mathItem));
        console.log(mathItem.handler);
        var readyResolver;
        mathItem.ready = <PromiseWithResolve<void>> new Promise<void>((resolver: () => void) => {
            readyResolver = resolver;
        });
        mathItem.ready.resolve = readyResolver;
    }

    function mathItemReady(mathItem: HTMLMathItemElement) {
        mathItem.handler.initialize(mathItem);
        if (!mathItem.hasAttribute('display')) {
            var displayValue = mathItem.handler.getDisplayStyle(mathItem);
            if (!displayValue) {
                var parent = mathItem.parentElement;
                if (parent)
                    displayValue = contains(INLINE_PARENT_TAGS, parent.tagName.toLowerCase()) ? 'inline' : 'block';
            }
            if (displayValue)
                mathItem.setAttribute('display', displayValue);
        }
    }

    // Custom element <math-item>

    if (document.registerElement) {
        var proto = Object.create(HTMLElement.prototype);

        proto.createdCallback = function () {
            mathItemCreated(this);
            async(() => { mathItemReady(this); });
        };

        document.registerElement('math-item', {
            prototype: proto
        });
    }

}

module FlorianMath {

    class PlainHandler extends Handler {
        canHandle(el: HTMLElement): boolean {
            return true;  // act as a catch-all
        }
    }

    class MathMLHandler extends Handler {
        static getMathRoot(el: HTMLElement): Element {
            var children = getElementChildren(el);
            if (children.length === 1 && children[0].nodeName.toLowerCase() === 'math')
                return children[0];
            if (children.length && children[0] instanceof HTMLUnknownElement) {
                var doc = parseXML(el.innerHTML);
                if (doc.documentElement && doc.documentElement.nodeName.toLowerCase() === 'math')
                    return doc.documentElement;
            }
            return null;
        }
        canHandle(el: HTMLElement): boolean {
            return MathMLHandler.getMathRoot(el) !== null;
        }
        getDisplayStyle(el: HTMLElement): string {
            var root = MathMLHandler.getMathRoot(el);
            if (root.hasAttribute('display'))
                return root.getAttribute('display');
            else if (root.hasAttribute('mode'))
                return root.getAttribute('mode');
            return null;
        }
    }

    registerHandler('plain-html', new PlainHandler());
    registerHandler('native-mathml', new MathMLHandler());

}

// MathJax extensions

module FlorianMath {
    'use strict';

    interface ICallback {
        After(fn: () => void, ...cbs: any[]);
    }

    interface JaxRoot {
        toMathML? (space: string): string;
    }

    interface Jax {
        root: JaxRoot;
        originalText: string;
    }

    interface IHub {
        Queue(fn: any[], ...fns: any[]);
        getAllJax(el: Element): Jax[];
    }

    interface IMathJax {
        Callback: ICallback;
        Hub: IHub;
    }

    declare var MathJax: IMathJax;

    class MathJaxHandler extends Handler {
        initialize(el: HTMLMathItemElement) {
            console.log('init');
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, el], () => { el.ready.resolve(); });
        }
    }

    registerHandler('tex', new MathJaxHandler());
    registerHandler('mml', new MathJaxHandler());
}
