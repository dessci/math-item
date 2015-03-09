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
declare module FlorianMath {
    interface List<T> {
        length: number;
        [index: number]: T;
    }
    interface PromiseStatic {
        new <T>(callback: (resolve: (val?: T) => void, reject?: (reason: any) => void) => void): IPromise<T>;
        resolve<T>(val?: T): IPromise<T>;
    }
    interface IPromise<T> {
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void): IPromise<any>;
    }
    interface EventInitParams {
        bubbles?: boolean;
        cancelable?: boolean;
        detail?: any;
    }
    function each<T>(list: List<T>, fn: (item?: T, index?: number) => void): void;
    var Promise: PromiseStatic;
    function getElementStyle(el: HTMLElement, prop: string): any;
    var domReady: () => IPromise<void>;
    var async: (fn: () => void) => void;
    var trim: (st: string) => string;
    var dispatchCustomEvent: (target: EventTarget, typeArg: string, params?: EventInitParams) => void;
    var addCustomEventListener: (target: EventTarget, typeArg: string, listener: EventListener) => void;
    var removeCustomEventListener: (target: EventTarget, typeArg: string, listener: EventListener) => void;
}
interface ShadowRoot extends DocumentFragment {
}
interface HTMLElement {
    createShadowRoot(): ShadowRoot;
    shadowRoot: ShadowRoot;
}
interface IHTMLMathItemElement extends HTMLElement {
    render(): void;
    clean(): void;
    getSources(options?: {
        render?: boolean;
        markup?: boolean;
        type?: string;
    }): IHTMLMathSourceElement[];
}
interface HTMLMathItemElementStatic {
    render(): void;
    manualCreate(mathItem: IHTMLMathItemElement, deep?: boolean): void;
    manualAttach(mathItem: IHTMLMathItemElement, deep?: boolean): void;
}
interface IHTMLMathSourceElement extends HTMLElement {
}
interface HTMLMathSourceElementStatic {
    manualCreate(mathSource: IHTMLMathSourceElement): void;
    manualAttach(mathSource: IHTMLMathSourceElement): void;
}
interface Document {
    registerElement(tagName: string, options: any): any;
    registerElement(tagName: 'math-item', options: any): HTMLMathItemElementStatic;
    registerElement(tagName: 'math-source', options: any): HTMLMathSourceElementStatic;
    createElement(tagName: 'math-item'): IHTMLMathItemElement;
    createElement(tagName: 'math-source'): IHTMLMathSourceElement;
}
interface Window {
    HTMLMathItemElement: HTMLMathItemElementStatic;
    HTMLMathSourceElement: HTMLMathSourceElementStatic;
}
declare var HTMLMathItemElement: HTMLMathItemElementStatic;
declare var HTMLMathSourceElement: HTMLMathSourceElementStatic;
declare module FlorianMath {
    var MATH_ITEM_TAG: string;
    var MATH_SOURCE_TAG: string;
    var MIME_TYPE_HTML: string;
    var MIME_TYPE_TEX: string;
    var MIME_TYPE_MATHML: string;
    interface IHTMLMathItemElementPrivate extends IHTMLMathItemElement {
        _private: {
            updatePending: boolean;
            firstPass: boolean;
            id?: number;
        };
    }
    function mathItemInsertContent(mathItem: IHTMLMathItemElement): {
        element: Node;
        done: () => void;
    };
    function mathItemShowSources(mathItem: IHTMLMathItemElement, sources: IHTMLMathSourceElement[]): void;
    var initialized: () => IPromise<void>;
}
