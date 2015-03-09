/// <reference path="utils.ts" />
/// <reference path="mathjax.d.ts" />

interface ShadowRoot extends DocumentFragment { }

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

module FlorianMath {

    export var MATH_ITEM_TAG = 'math-item';
    export var MATH_SOURCE_TAG = 'math-source';
    export var MIME_TYPE_HTML = 'text/html';
    export var MIME_TYPE_TEX = 'application/x-tex';
    export var MIME_TYPE_MATHML = 'application/mathml+xml';
    var global: Window = window,
        doc: Document = document,
        counter = 0;

    export interface IHTMLMathItemElementPrivate extends IHTMLMathItemElement {
        _private: {
            updatePending: boolean;
            firstPass: boolean;
            id?: number;
        };
    }

    function iterateChildren(n: Node, fn: (c: Node) => void) {
        var c = n.firstChild, next;
        while (c) {
            next = c.nextSibling;
            fn(c);
            c = next;
        }
    }

    function iterateSourceElements(el: IHTMLMathItemElement, fn: (source: IHTMLMathSourceElement) => void) {
        iterateChildren(el, (c: Node) => {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG)
                fn(<IHTMLMathSourceElement> c);
        });
    }

    function mathItemClean() {
        var shadow: Node = (<IHTMLMathItemElement> this).shadowRoot;
        iterateChildren(<IHTMLMathItemElement> this, (c: Node) => {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG)
                (<HTMLElement> c).style.display = 'none';
            else
                (<IHTMLMathItemElement> this).removeChild(c);
        });
        if (shadow) {
            iterateChildren(shadow, (c: Node) => {
                shadow.removeChild(c);
            });
        }
    }

    function mathItemRenderDone(mathItem: IHTMLMathItemElement) {
    }

    export function mathItemInsertContent(mathItem: IHTMLMathItemElement): { element: Node; done: () => void; } {
        mathItem.clean();
        return {
            element: mathItem.shadowRoot || (mathItem.createShadowRoot ? mathItem.createShadowRoot() : mathItem),
            done: () => {
                mathItemRenderDone(mathItem);
            }
        };
    }

    export function mathItemShowSources(mathItem: IHTMLMathItemElement, sources: IHTMLMathSourceElement[]) {
        mathItem.clean();
        each(sources, (source: IHTMLMathSourceElement) => {
            source.style.display = '';
        });
        if (mathItem.shadowRoot)
            mathItem.shadowRoot.appendChild(document.createElement('content'));
        mathItemRenderDone(mathItem);
    }

    function doPreview(mathItem: IHTMLMathItemElement) {
        var previewSources = mathItem.getSources({ render: false, markup: false });
        if (previewSources.length) {
            each(previewSources, (source: IHTMLMathSourceElement) => {
                source.style.display = '';
            });
        }
    }

    function mathItemEnqueueRender(mathItem: IHTMLMathItemElementPrivate) {
        if (!mathItem._private.updatePending) {
            mathItem._private.updatePending = true;
            async(() => {
                mathItem._private.updatePending = false;
                if (mathItem._private.firstPass) {
                    mathItem._private.firstPass = false;
                    //normalize(el);
                    doPreview(mathItem);
                }
                mathItem.render();
            });
        }
    }

    function renderProxy() {
        global.HTMLMathItemElement.render.call(this);
    }

    function sourceEncoding(src: IHTMLMathSourceElement) {
        return src.getAttribute('type') || MIME_TYPE_HTML;
    }

    /*
     * render  markup  usage
     * -       -       'preview'
     * +       -       'nomarkup'
     * -       +       'norender'
     * +       +       ''
     */
    function getSources(options?: { render?: boolean; markup?: boolean; type?: string; }): IHTMLMathSourceElement[] {
        var result: IHTMLMathSourceElement[] = [], render, markup, encoding;
        options = options || {};
        if (options.render !== undefined) render = !!options.render;
        if (options.markup !== undefined) markup = !!options.markup;
        encoding = options.type;
        iterateSourceElements(this, (source: IHTMLMathSourceElement) => {
            var usage = source.getAttribute('usage');
            if (render !== undefined && render === (usage === 'preview' || usage === 'norender')) return;
            if (markup !== undefined && markup === (usage === 'preview' || usage === 'nomarkup')) return;
            if (encoding !== undefined && encoding !== sourceEncoding(source)) return;
            result.push(source);
        });
        return result;
    }

    function baseItemCreate() {
        (<IHTMLMathItemElementPrivate> this)._private = {
            updatePending: false,
            firstPass: true,
            id: counter++
        };
    }

    function manualItemCreate(mathItem: IHTMLMathItemElement, deep?: boolean) {
        mathItem.render = renderProxy;
        mathItem.clean = mathItemClean;
        mathItem.getSources = getSources;
        baseItemCreate.call(mathItem);
        if (deep) {
            iterateSourceElements(this, (source: IHTMLMathSourceElement) => {
                manualSourceCreate(source);
            });
        }
    }

    function baseItemAttach() {
        mathItemEnqueueRender(<IHTMLMathItemElementPrivate> this);
    }

    function manualItemAttach(mathItem: IHTMLMathItemElement, deep?: boolean) {
        baseItemAttach.call(mathItem);
        if (deep) {
            iterateSourceElements(this, (source: IHTMLMathSourceElement) => {
                manualSourceAttach(source);
            });
        }
    }

    function baseSourceCreate() {
        (<IHTMLMathSourceElement> this).style.display = 'none';
    }

    function manualSourceCreate(mathSource: IHTMLMathSourceElement) {
        baseSourceCreate.call(mathSource);
    }

    function baseSourceAttach() {
        var usage = (<IHTMLMathSourceElement> this).getAttribute('usage') || '';
        if (usage === '' || usage === 'nomarkup') {
            var parent = (<IHTMLMathSourceElement> this).parentElement;
            if (parent && parent.tagName.toLowerCase() === MATH_ITEM_TAG)
                mathItemEnqueueRender(<IHTMLMathItemElementPrivate> <IHTMLMathItemElement> parent);
        }
    }

    function manualSourceAttach(mathSource: IHTMLMathSourceElement) {
        baseSourceAttach.call(mathSource);
    }

    var initializedResolver: () => void;
    
    export var initialized: () => IPromise<void> = (function () {
        var promise = new Promise<void>((resolve: () => void) => {
            initializedResolver = resolve;
        });
        return () => promise;
    })();

    if (doc.registerElement) {

        var MathItemPrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: baseItemCreate },
            attachedCallback: { enumerable: true, value: baseItemAttach },
            render: { enumerable: true, value: renderProxy, writable: true },
            clean: { enumerable: true, value: mathItemClean, writable: true },
            getSources: { enumerable: true, value: getSources, writable: true }
        });

        var MathSourcePrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: baseSourceCreate },
            attachedCallback: { enumerable: true, value: baseSourceAttach }
        });

        global.HTMLMathItemElement = doc.registerElement(FlorianMath.MATH_ITEM_TAG, { prototype: MathItemPrototype });
        global.HTMLMathSourceElement = doc.registerElement(FlorianMath.MATH_SOURCE_TAG, { prototype: MathSourcePrototype });

        global.HTMLMathItemElement.manualCreate =
        global.HTMLMathItemElement.manualAttach =
        global.HTMLMathSourceElement.manualCreate =
        global.HTMLMathSourceElement.manualAttach = function () { };

        initializedResolver();

    } else {

        doc.createElement(FlorianMath.MATH_ITEM_TAG);
        doc.createElement(FlorianMath.MATH_SOURCE_TAG);

        global.HTMLMathItemElement = <any> {
            manualCreate: manualItemCreate,
            manualAttach: manualItemAttach
        };
        global.HTMLMathSourceElement = <any> {
            manualCreate: manualSourceCreate,
            manualAttach: manualSourceAttach
        };

        domReady().then(() => {
            each(doc.querySelectorAll(MATH_ITEM_TAG), (mathItem: IHTMLMathItemElement) => {
                manualItemCreate(mathItem, true);
                manualItemAttach(mathItem, true);
            });
            initializedResolver();
        });

    }

    global.HTMLMathItemElement.render = function () {
        var toShow = (<IHTMLMathItemElement> this).getSources({ render: true, type: MIME_TYPE_HTML });
        if (toShow.length)
            mathItemShowSources(<IHTMLMathItemElement> this, toShow);
    };

}
