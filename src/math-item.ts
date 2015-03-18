/// <reference path="utils.ts" />

interface ShadowRoot extends DocumentFragment { }

interface HTMLElement {
    createShadowRoot(): ShadowRoot;
    shadowRoot: ShadowRoot;
}

interface GetSourceOptions {
    render?: boolean;
    markup?: boolean;
    preview?: boolean;
    type?: string;
}

interface HTMLMathItemElement extends HTMLElement {
    render(): void;
    clean(): void;
    getSources(options?: GetSourceOptions): HTMLMathSourceElement[];
    getMainMarkup(): { type: string; markup: string; };
}

interface HTMLMathItemElementStatic {
    prototype: {
        render(): void;
        clean(): void;
        getSources(options?: GetSourceOptions): HTMLMathSourceElement[];
        getMainMarkup(): { type: string; markup: string; };
    }
    manualCreate(mathItem: HTMLMathItemElement, deep?: boolean): void;
    manualAttach(mathItem: HTMLMathItemElement, deep?: boolean): void;
}

interface HTMLMathSourceElement extends HTMLElement {
}

interface HTMLMathSourceElementStatic {
    manualCreate(mathSource: HTMLMathSourceElement): void;
    manualAttach(mathSource: HTMLMathSourceElement): void;
}

interface Document {
    registerElement(tagName: string, options: any): any;
    registerElement(tagName: 'math-item', options: any): HTMLMathItemElementStatic;
    registerElement(tagName: 'math-source', options: any): HTMLMathSourceElementStatic;
    createElement(tagName: 'math-item'): HTMLMathItemElement;
    createElement(tagName: 'math-source'): HTMLMathSourceElement;
}

interface Window {
    HTMLMathItemElement: HTMLMathItemElementStatic;
    HTMLMathSourceElement: HTMLMathSourceElementStatic;
}

declare var HTMLMathItemElement: HTMLMathItemElementStatic;
declare var HTMLMathSourceElement: HTMLMathSourceElementStatic;

module FlorianMath {
    'use strict';

    export var
        MATH_ITEM_TAG = 'math-item',
        MATH_SOURCE_TAG = 'math-source',
        MIME_TYPE_PLAIN = 'text/plain',
        MIME_TYPE_HTML = 'text/html',
        MIME_TYPE_TEX = 'application/x-tex',
        MIME_TYPE_MATHML = 'application/mathml+xml',
        RENDERING_EVENT = 'rendering.math-item',
        RENDERED_EVENT = 'rendered.math-item',
        ALL_RENDERED_EVENT = 'allrendered.math-item';

    var MARKUP_PREFERENCE = [MIME_TYPE_MATHML, MIME_TYPE_TEX, MIME_TYPE_HTML],
        global: Window = window,
        doc: Document = document,
        renderBalance = 0,
        counter = 0;

    export enum RenderState {
        Idle, Pending, Rendering
    }

    export interface HTMLMathItemElementPrivate extends HTMLMathItemElement {
        _private: {
            renderState: RenderState;
            firstPass: boolean;
            id?: number;
        };
    }

    export function rendering() {
        return renderBalance != 0;
    }

    function renderBalanceUp() {
        renderBalance++;
    }

    function renderBalanceDown() {
        if (--renderBalance === 0)
            dispatchCustomEvent(document, ALL_RENDERED_EVENT);
    }

    function iterateChildren(n: Node, fn: (c: Node) => void) {
        var c = n.firstChild, next;
        while (c) {
            next = c.nextSibling;
            fn(c);
            c = next;
        }
    }

    function iterateSourceElements(el: HTMLMathItemElement, fn: (source: HTMLMathSourceElement) => void) {
        iterateChildren(el, (c: Node) => {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG)
                fn(<HTMLMathSourceElement> c);
        });
    }

    function mathItemRenderDone(mathItem: HTMLMathItemElement) {
        (<HTMLMathItemElementPrivate> mathItem)._private.renderState = RenderState.Idle;
        dispatchCustomEvent(mathItem, RENDERED_EVENT, { bubbles: true });
        renderBalanceDown();
    }

    export function mathItemInsertContent(mathItem: HTMLMathItemElement): { element: Node; done: () => void; } {
        (<HTMLMathItemElementPrivate> mathItem)._private.renderState = RenderState.Rendering;
        mathItem.clean();
        return {
            element: mathItem.shadowRoot || (mathItem.createShadowRoot ? mathItem.createShadowRoot() : mathItem),
            done: () => {
                mathItemRenderDone(mathItem);
            }
        };
    }

    export function mathItemShowSources(mathItem: HTMLMathItemElement, sources: HTMLMathSourceElement[]) {
        (<HTMLMathItemElementPrivate> mathItem)._private.renderState = RenderState.Rendering;
        mathItem.clean();
        each(sources, (source: HTMLMathSourceElement) => {
            source.style.display = '';
        });
        if (mathItem.shadowRoot)
            mathItem.shadowRoot.appendChild(document.createElement('content'));
        mathItemRenderDone(mathItem);
    }

    function showPreview(mathItem: HTMLMathItemElement) {
        var previewSources = mathItem.getSources({ preview: true });
        each(previewSources, (source: HTMLMathSourceElement) => {
            source.style.display = '';
        });
    }

    function mathItemEnqueueRender(mathItem: HTMLMathItemElementPrivate) {
        if (mathItem._private.renderState === RenderState.Idle) {
            mathItem._private.renderState = RenderState.Pending;
            renderBalanceUp();
            dispatchCustomEvent(mathItem, RENDERING_EVENT, { bubbles: true });
            async(() => {
                if (mathItem._private.firstPass) {
                    mathItem._private.firstPass = false;
                    //normalize(el);
                    showPreview(mathItem);
                }
                mathItem.render();
                if (mathItem._private.renderState === RenderState.Pending) {
                    // no rendering was done, correct state
                    mathItemRenderDone(mathItem);
                }
            });
        }
    }

    export function getSourceType(source: HTMLMathSourceElement) {
        return source.getAttribute('type') || MIME_TYPE_HTML;
    }

    export function getSourceMarkup(source: HTMLMathSourceElement): string {
        var value = source.firstChild && !source.firstChild.nextSibling && source.firstChild.nodeType === 3 ? source.firstChild.nodeValue : source.innerHTML;
        return trim(value);
    }

    function render() {
        var toShow = (<HTMLMathItemElement> this).getSources({ render: true, type: MIME_TYPE_HTML });
        if (toShow.length)
            mathItemShowSources(<HTMLMathItemElement> this, toShow);
    };

    function clean() {
        var shadow: Node = (<HTMLMathItemElement> this).shadowRoot;
        iterateChildren(<HTMLMathItemElement> this, (c: Node) => {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG)
                (<HTMLElement> c).style.display = 'none';
            else
                (<HTMLMathItemElement> this).removeChild(c);
        });
        if (shadow) {
            iterateChildren(shadow, (c: Node) => {
                shadow.removeChild(c);
            });
        }
    }

    /*
     * render  markup  usage
     * -       -       'passive'/'preview'
     * +       -       'render'
     * -       +       'markup'
     * +       +       ''
     */
    function getSources(options?: GetSourceOptions): HTMLMathSourceElement[] {
        var result: HTMLMathSourceElement[] = [], render, markup, preview, encoding;
        options = options || {};
        if (options.preview !== undefined) {
            preview = !!options.preview;
            render = markup = false;
        }
        if (options.render !== undefined)
            render = !!options.render;
        if (options.markup !== undefined)
            markup = !!options.markup;
        encoding = options.type;
        iterateSourceElements(this, (source: HTMLMathSourceElement) => {
            var usage = source.getAttribute('usage');
            if ((preview === undefined || preview === (usage === 'preview')) &&
                    (render === undefined || render === (!usage || usage === 'render')) &&
                    (markup === undefined || markup === (!usage || usage === 'markup')) &&
                    (encoding === undefined || encoding === getSourceType(source)))
                result.push(source);
        });
        return result;
    }

    export function getSourceWithTypePreference(mathItem: HTMLMathItemElement, typePref: string[]): HTMLMathSourceElement {
        var k, type, sources;
        for (k = 0; k < typePref.length; k++) {
            type = typePref[k];
            sources = mathItem.getSources({ type: type, markup: true });
            if (sources.length)
                return sources[0];
        }
        return null;
    }

    function getMainMarkup(): { type: string; markup: string; } {
        var source = getSourceWithTypePreference(this, MARKUP_PREFERENCE);
        return source ? { type: getSourceType(source), markup: getSourceMarkup(source) } : null;
    }

    function baseItemCreate() {
        (<HTMLMathItemElementPrivate> this)._private = {
            renderState: RenderState.Idle,
            firstPass: true,
            id: counter++
        };
    }

    function baseItemAttach() {
        mathItemEnqueueRender(<HTMLMathItemElementPrivate> this);
    }

    function baseSourceCreate() {
        (<HTMLMathSourceElement> this).style.display = 'none';
    }

    function baseSourceAttach() {
        var usage = (<HTMLMathSourceElement> this).getAttribute('usage') || '';
        if (usage === '' || usage === 'nomarkup') {
            var parent = (<HTMLMathSourceElement> this).parentElement;
            if (parent && parent.tagName.toLowerCase() === MATH_ITEM_TAG)
                mathItemEnqueueRender(<HTMLMathItemElementPrivate> <HTMLMathItemElement> parent);
        }
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
            render: { enumerable: true, value: render, writable: true },
            clean: { enumerable: true, value: clean, writable: true },
            getSources: { enumerable: true, value: getSources, writable: true },
            getMainMarkup: { enumerable: true, value: getMainMarkup, writable: true }
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

        (function () {

            function renderProxy() {
                global.HTMLMathItemElement.prototype.render.call(this);
            }

            function cleanProxy() {
                global.HTMLMathItemElement.prototype.clean.call(this);
            }

            function getSourcesProxy(options?: GetSourceOptions) {
                return global.HTMLMathItemElement.prototype.getSources.call(this, options);
            }

            function getMainMarkupProxy() {
                return global.HTMLMathItemElement.prototype.getMainMarkup.call(this);
            }

            function manualItemCreate(mathItem: HTMLMathItemElement, deep?: boolean) {
                mathItem.render = renderProxy;
                mathItem.clean = cleanProxy;
                mathItem.getSources = getSourcesProxy;
                mathItem.getMainMarkup = getMainMarkupProxy;
                baseItemCreate.call(mathItem);
                if (deep) {
                    iterateSourceElements(mathItem, (source: HTMLMathSourceElement) => {
                        manualSourceCreate(source);
                    });
                }
            }

            function manualItemAttach(mathItem: HTMLMathItemElement, deep?: boolean) {
                baseItemAttach.call(mathItem);
                if (deep) {
                    iterateSourceElements(mathItem, (source: HTMLMathSourceElement) => {
                        manualSourceAttach(source);
                    });
                }
            }

            function manualSourceCreate(mathSource: HTMLMathSourceElement) {
                baseSourceCreate.call(mathSource);
            }

            function manualSourceAttach(mathSource: HTMLMathSourceElement) {
                baseSourceAttach.call(mathSource);
            }

            doc.createElement(FlorianMath.MATH_ITEM_TAG);
            doc.createElement(FlorianMath.MATH_SOURCE_TAG);

            global.HTMLMathItemElement = <any> function () {
                throw Error('Use document.createElement instead');
            };
            global.HTMLMathItemElement.manualCreate = manualItemCreate;
            global.HTMLMathItemElement.manualAttach = manualItemAttach;
            global.HTMLMathItemElement.prototype.render = render;
            global.HTMLMathItemElement.prototype.clean = clean;
            global.HTMLMathItemElement.prototype.getSources = getSources;
            global.HTMLMathItemElement.prototype.getMainMarkup = getMainMarkup;

            global.HTMLMathSourceElement = <any> function () {
                throw Error('Use document.createElement instead');
            };
            global.HTMLMathSourceElement.manualCreate = manualSourceCreate;
            global.HTMLMathSourceElement.manualAttach = manualSourceAttach;

            domReady().then(() => {
                each(doc.querySelectorAll(MATH_ITEM_TAG),(mathItem: HTMLMathItemElement) => {
                    manualItemCreate(mathItem, true);
                    manualItemAttach(mathItem, true);
                });
                initializedResolver();
            });

        })();

    }

    renderBalanceUp();
    initialized().then(renderBalanceDown);

}
