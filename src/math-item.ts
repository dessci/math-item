/// <reference path="utils.ts" />

module FlorianMath {

    export interface RenderOutput {
        element: Node;
        done: () => void;
    }

    export interface Renderer {
        (insertion: (showSource: IHTMLMathSourceElement[]) => RenderOutput): void;
    }

    export interface IHTMLMathItemElement extends HTMLElement {
        render: Renderer;
        _private: {
            updatePending: boolean;
            firstPass: boolean;
            id?: number;
        };
    }

    export interface HTMLMathItemElementStatic {
        new (): IHTMLMathItemElement;
        prototype: IHTMLMathItemElement;
        render: Renderer;
    }

    export interface IHTMLMathSourceElement extends HTMLElement {
    }

    export interface HTMLMathSourceElementStatic {
        new (): IHTMLMathSourceElement;
        prototype: IHTMLMathSourceElement;
    }

}

interface Document {
    registerElement(tagName: string, options: any): any;
    registerElement(tagName: 'math-item', options: any): FlorianMath.HTMLMathItemElementStatic;
    registerElement(tagName: 'math-source', options: any): FlorianMath.HTMLMathSourceElementStatic;
}

interface ShadowRoot extends DocumentFragment { }

interface HTMLElement {
    createShadowRoot(): ShadowRoot;
    shadowRoot: ShadowRoot;
}

interface Window {
    HTMLMathItemElement: FlorianMath.HTMLMathItemElementStatic;
    HTMLMathSourceElement: FlorianMath.HTMLMathSourceElementStatic;
}

module FlorianMath {

    export var MATH_ITEM_TAG = 'math-item';
    export var MATH_SOURCE_TAG = 'math-source';
    export var MATH_SOURCE_TAG = 'math-source';
    export var MIME_TYPE_HTML = 'text/html';
    export var MIME_TYPE_TEX = 'application/x-tex';
    export var MIME_TYPE_MATHML = 'application/mathml+xml';

    function iterateChildren(n: Node, fn: (c: Node) => void) {
        var c = n.firstChild, next;
        while (c) {
            next = c.nextSibling;
            fn(c);
            c = next;
        }
    }

    function iterateSourceElements(el: IHTMLMathItemElement,
            fn: (source: IHTMLMathSourceElement) => void) {
        iterateChildren(el, (c: Node) => {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG)
                fn(<IHTMLMathSourceElement> c);
        });
    }

    export function sourceForPreview(src: IHTMLMathSourceElement) {
        return src.getAttribute('usage') === 'preview';
    }

    export function sourceEncoding(src: IHTMLMathSourceElement) {
        return src.getAttribute('type') || MIME_TYPE_HTML;
    }

    export function iterateSourceElementsForRendering(el: IHTMLMathItemElement, encoding: string,
            fn: (source: IHTMLMathSourceElement) => void) {
        iterateSourceElements(el, (source: IHTMLMathSourceElement) => {
            if (!sourceForPreview(source) && sourceEncoding(source) === encoding)
                fn(source);
        });
    }

    export function getSourceElementsForRendering(el: IHTMLMathItemElement, encoding: string) {
        var result: IHTMLMathSourceElement[] = [];
        iterateSourceElementsForRendering(el, encoding, (source: IHTMLMathSourceElement) => {
            result.push(source);
        });
        return result;
    }

    (function (global: Window, doc: Document) {

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

        function mathItemRenderDone(el: IHTMLMathItemElement) {
            el.removeAttribute('state');
        }

        function mathItemRenderStart(el: IHTMLMathItemElement, showSources: IHTMLMathSourceElement[]): RenderOutput {
            var shadow: Node = el.shadowRoot;
            el.setAttribute('state', 'rendering');
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
            if (showSources) {
                each(showSources, (source: IHTMLMathSourceElement) => {
                    source.setAttribute('show', '');
                });
                if (shadow)
                    shadow.appendChild(doc.createElement('content'));
                mathItemRenderDone(el);
            } else {
                return {
                    element: shadow ? shadow : el.createShadowRoot ? el.createShadowRoot() : el,
                    done: () => { mathItemRenderDone(el); }
                };
            }
        }

        function doPreview(el: IHTMLMathItemElement) {
            var previewSources: IHTMLMathSourceElement[] = [];
            iterateSourceElements(el, (source: IHTMLMathSourceElement) => {
                if (sourceForPreview(source))
                    previewSources.push(source);
            });
            if (previewSources.length) {
                console.log('preview ' + el._private.id);
                el.setAttribute('state', 'preview');
                each(previewSources, (source: IHTMLMathSourceElement) => {
                    source.setAttribute('show', '');
                });
            }
        }

        function mathItemUpdate(el: IHTMLMathItemElement) {
            if (!el._private.updatePending) {
                el._private.updatePending = true;
                async(() => {
                    function insertion(showSources?: IHTMLMathSourceElement[]) {
                        return mathItemRenderStart(el, showSources);
                    }
                    el._private.updatePending = false;
                    if (el._private.firstPass) {
                        el._private.firstPass = false;
                        //normalize(el);
                        doPreview(el);
                    }
                    el.render(insertion);
                });
            }
        }

        function renderProxy(insertion: (showSource: IHTMLMathSourceElement[]) => RenderOutput) {
            global.HTMLMathItemElement.render.call(this, insertion);
        }

        function mathItemCreated() {
            var el: IHTMLMathItemElement = this;
            if (!el.render)
                el.render = renderProxy;
            el._private = {
                updatePending: false,
                firstPass: true,
                id: counter++
            };
            //console.log('math-item created', el._private.id);
        }

        function mathItemAttached() {
            var el: IHTMLMathItemElement = this;
            //console.log('math-item attached', el._private.id);
            mathItemUpdate(el);
        }

        function mathSourceCreated() {
            var el: IHTMLMathSourceElement = this;
            //console.log('math-source created');
        }

        function mathSourceAttached() {
            var el: IHTMLMathSourceElement = this,
                parent = el.parentElement;
            //console.log('math-source attached');
            if (parent && parent.tagName.toLowerCase() === FlorianMath.MATH_ITEM_TAG)
                mathItemUpdate(<IHTMLMathItemElement> parent);
        }

        if (doc.registerElement) {

            var MathItemPrototype = Object.create(HTMLElement.prototype, {
                createdCallback: { enumerable: true, value: mathItemCreated },
                attachedCallback: { enumerable: true, value: mathItemAttached },
                render: { enumerable: true, value: renderProxy, writable: true }
            });

            var MathSourcePrototype = Object.create(HTMLElement.prototype, {
                createdCallback: { enumerable: true, value: mathSourceCreated },
                attachedCallback: { enumerable: true, value: mathSourceAttached }
            });

            global.HTMLMathItemElement = doc.registerElement(FlorianMath.MATH_ITEM_TAG, { prototype: MathItemPrototype });
            global.HTMLMathSourceElement = doc.registerElement(FlorianMath.MATH_SOURCE_TAG, { prototype: MathSourcePrototype });

        } else {

            global.HTMLMathItemElement = <any> {};

            doc.createElement(FlorianMath.MATH_ITEM_TAG);
            doc.createElement(FlorianMath.MATH_SOURCE_TAG);

            FlorianMath.domReady().then(() => {
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
            });

        }

        global.HTMLMathItemElement.render = function (insertion: (showSource: IHTMLMathSourceElement[]) => RenderOutput) {
            var toShow = getSourceElementsForRendering(this, MIME_TYPE_HTML);
            if (toShow.length) {
                insertion(toShow);
            }
        };

    })(window, document);

}
