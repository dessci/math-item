/// <reference path="utils.ts" />

interface IHTMLMathItemElement extends HTMLElement {
    getRenderElements(encoding: string): IHTMLMathSourceElement[];
    render(): void;
}

interface HTMLMathItemElementStatic {
    new (): IHTMLMathItemElement;
    prototype: IHTMLMathItemElement;
    render(): void;
    created?(): void;
    attached?(): void;
}

interface IHTMLMathSourceElement extends HTMLElement {
}

interface HTMLMathSourceElementStatic {
    new (): IHTMLMathSourceElement;
    prototype: IHTMLMathSourceElement;
    created?(): void;
    attached?(): void;
}

interface Document {
    registerElement(tagName: string, options: any): any;
    registerElement(tagName: 'math-item', options: any): HTMLMathItemElementStatic;
    registerElement(tagName: 'math-source', options: any): HTMLMathSourceElementStatic;
    createElement(tagName: 'math-item'): IHTMLMathItemElement;
    createElement(tagName: 'math-source'): IHTMLMathSourceElement;
}

interface ShadowRoot extends DocumentFragment { }

interface HTMLElement {
    createShadowRoot(): ShadowRoot;
    shadowRoot: ShadowRoot;
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
    var global: Window = window;
    var doc: Document = document;

    interface IHTMLMathItemElementPrivate extends IHTMLMathItemElement {
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

    function sourceForPreview(src: IHTMLMathSourceElement) {
        return src.getAttribute('usage') === 'preview';
    }

    function sourceEncoding(src: IHTMLMathSourceElement) {
        return src.getAttribute('type') || MIME_TYPE_HTML;
    }

    function mathItemClean(el: IHTMLMathItemElement) {
        var shadow: Node = el.shadowRoot;
        iterateChildren(el, (c: Node) => {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG)
                (<Element> c).removeAttribute('show');
            else
                el.removeChild(c);
        });
        if (shadow) {
            iterateChildren(shadow, (c: Node) => {
                shadow.removeChild(c);
            });
        }
    }

    function mathItemRenderDone(el: IHTMLMathItemElement) {
        el.removeAttribute('state');
    }

    export function mathItemInsertContent(el: IHTMLMathItemElement): { element: Node; done: () => void; } {
        mathItemClean(el);
        el.setAttribute('state', 'rendering');
        return {
            element: el.shadowRoot || (el.createShadowRoot ? el.createShadowRoot() : el),
            done: () => {
                mathItemRenderDone(el);
            }
        };
    }

    export function mathItemShowSources(el: IHTMLMathItemElement, sources: IHTMLMathSourceElement[]) {
        mathItemClean(el);
        each(sources, (source: IHTMLMathSourceElement) => {
            source.setAttribute('show', '');
        });
        if (el.shadowRoot)
            el.shadowRoot.appendChild(document.createElement('content'));
        mathItemRenderDone(el);
    }

    /*function normalize(el: IHTMLMathItemElement) {
        var nodes: Node[] = [], c = el.firstChild, t, mainMathElement,
            trivial = true, isPreview = el.getAttribute('state') === 'preview';
        while (c) {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG) {
                c = c.nextSibling;
            } else {
                t = c.nextSibling;
                nodes.push(el.removeChild(c));
                c = t;
            }
        }
        each(nodes, (c: Node) => {
            if (c.nodeType === 1) {
                if ((<Element> c).tagName.toLowerCase() === 'math') {
                    if (mainMathElement) {
                        // don't allow multiple math elements
                        mainMathElement = undefined;
                        trivial = false;
                    } else
                        mainMathElement = c;
                } else
                    trivial = false;
            } else if (c.nodeType === 3 && trim(c.nodeValue) !== '') {
                trivial = false;
            }
        });
        if (mainMathElement || !trivial) {
            var source = doc.createElement('math-source');
            if (isPreview)
                source.setAttribute('usage', 'preview');
            if (mainMathElement) {
                source.setAttribute('type', MIME_TYPE_MATHML);
                nodes = [mainMathElement];
            }
            each(nodes, (n: Node) => {
                source.appendChild(n);
            });
            el.appendChild(source);
        }
    }*/

    var counter = 0;

    function doPreview(el: IHTMLMathItemElement) {
        var previewSources: IHTMLMathSourceElement[] = [];
        iterateSourceElements(el, (source: IHTMLMathSourceElement) => {
            if (sourceForPreview(source))
                previewSources.push(source);
        });
        if (previewSources.length) {
            el.setAttribute('state', 'preview');
            each(previewSources, (source: IHTMLMathSourceElement) => {
                source.setAttribute('show', '');
            });
        }
    }

    function mathItemUpdate(el: IHTMLMathItemElementPrivate) {
        if (!el._private.updatePending) {
            el._private.updatePending = true;
            async(() => {
                el._private.updatePending = false;
                if (el._private.firstPass) {
                    el._private.firstPass = false;
                    //normalize(el);
                    doPreview(el);
                }
                el.render();
            });
        }
    }

    function renderProxy() {
        global.HTMLMathItemElement.render.call(this);
    }

    function getRenderElements(encoding: string) {
        var result: IHTMLMathSourceElement[] = [];
        iterateSourceElements(this, (source: IHTMLMathSourceElement) => {
            if (!source.getAttribute('usage') && sourceEncoding(source) === encoding)
                result.push(source);
        });
        return result;
    }

    function mathItemCreated() {
        var el: IHTMLMathItemElement = this;
        if (!el.render)
            el.render = renderProxy;
        if (!el.getRenderElements)
            el.getRenderElements = getRenderElements;
        (<IHTMLMathItemElementPrivate> el)._private = {
            updatePending: false,
            firstPass: true,
            id: counter++
        };
    }

    function mathItemAttached() {
        mathItemUpdate(<IHTMLMathItemElementPrivate> this);
    }

    function mathSourceCreated() {
    }

    function mathSourceAttached() {
        var el: IHTMLMathSourceElement = this,
            parent = el.parentElement;
        if (parent && parent.tagName.toLowerCase() === MATH_ITEM_TAG)
            mathItemUpdate(<IHTMLMathItemElementPrivate> parent);
    }

    var initializedPromise: IPromise<void>;
    export function initialized() {
        return initializedPromise;
    }

    if (doc.registerElement) {

        var MathItemPrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: mathItemCreated },
            attachedCallback: { enumerable: true, value: mathItemAttached },
            getRenderElements: { enumerable: true, value: getRenderElements, writable: true },
            render: { enumerable: true, value: renderProxy, writable: true }
        });

        var MathSourcePrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: mathSourceCreated },
            attachedCallback: { enumerable: true, value: mathSourceAttached }
        });

        global.HTMLMathItemElement = doc.registerElement(FlorianMath.MATH_ITEM_TAG, { prototype: MathItemPrototype });
        global.HTMLMathSourceElement = doc.registerElement(FlorianMath.MATH_SOURCE_TAG, { prototype: MathSourcePrototype });

        initializedPromise = Promise.resolve<void>();

    } else {

        global.HTMLMathItemElement = <any> {
            created: mathItemCreated,
            attached: mathItemAttached
        };
        global.HTMLMathSourceElement = <any> {
            created: mathSourceCreated,
            attached: mathSourceAttached
        };

        doc.createElement(FlorianMath.MATH_ITEM_TAG);
        doc.createElement(FlorianMath.MATH_SOURCE_TAG);

        initializedPromise = new Promise<void>((resolve: () => void) => {
            domReady().then(() => {
                each(doc.querySelectorAll(MATH_ITEM_TAG), (item: Node) => {
                    var mathItem = <IHTMLMathItemElement> item;
                    mathItemCreated.call(mathItem);
                    mathItemAttached.call(mathItem);
                });
                each(doc.querySelectorAll(MATH_SOURCE_TAG), (item: Node) => {
                    var mathSource = <IHTMLMathSourceElement> item;
                    mathSourceCreated.call(mathSource);
                    mathSourceAttached.call(mathSource);
                });
                resolve();
            });
        });

    }

    global.HTMLMathItemElement.render = function () {
        var el: IHTMLMathItemElement = this;
        var toShow = el.getRenderElements(MIME_TYPE_HTML);
        if (toShow.length) {
            mathItemShowSources(el, toShow);
        }
    };

}
