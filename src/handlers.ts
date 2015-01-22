/// <reference path="common-utils.ts" />
/// <reference path="dom-utils.ts" />
/// <reference path="xml-utils.ts" />
/// <reference path="math-item.ts" />

module FlorianMath {
    'use strict';

    var dom = _utils.dom;

    function plainMarkup(el: HTMLElement) {
        return Promise.resolve([{ type: 'HTML', markup: el.innerHTML }]);
    }

    class PlainHandler extends Handler {
        canHandle(el: HTMLElement): boolean {
            return true;  // act as a catch-all
        }
        ready(el: HTMLMathItemElement) {
            super.ready(el);
            el.getMarkup = () => plainMarkup(el);
            (<PromiseWithResolve<void>> el.rendered()).resolve();
        }
    }

    function getMathMLMarkup(el: HTMLElement, root: Element): Promise<MarkupData[]> {
        if (root === null)
            return Promise.resolve([]);
        return Promise.resolve([
            { type: 'MathML', subtype: 'original', markup: el.innerHTML },
            { type: 'MathML', subtype: 'prettified', markup: _utils.xml.prettifyMathML(root) }
        ]);
    }

    class MathMLHandler extends Handler {
        static getMathRoot(el: HTMLElement): Element {
            var children = dom.getElementChildren(el);
            if (children.length === 1 && children[0].nodeName.toLowerCase() === 'math')
                return children[0];
            if (children.length && children[0] instanceof HTMLUnknownElement) {
                var doc = _utils.xml.parseXML(el.innerHTML);
                if (doc.documentElement && doc.documentElement.nodeName.toLowerCase() === 'math')
                    return doc.documentElement;
            }
            return null;
        }
        canHandle(el: HTMLElement): boolean {
            return MathMLHandler.getMathRoot(el) !== null;
        }
        ready(el: HTMLMathItemElement) {
            super.ready(el);
            var root = MathMLHandler.getMathRoot(el);
            el.getMarkup = () => getMathMLMarkup(el, root);
            if (!el.hasAttribute('display')) {
                var value = root.getAttribute('display') || root.getAttribute('mode');
                if (value)
                    el.setAttribute('display', value);
            }
            (<PromiseWithResolve<void>> el.rendered()).resolve();
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

    function mathjaxClone(src: HTMLElement, dest: HTMLElement) {
        var script = src.querySelector('script[type]');
        if (script) {
            script = <Element> script.cloneNode(true);
            script.removeAttribute('id');
            script.removeAttribute('MathJax');
            dest.appendChild(script);
        }
        return new Promise<void>((resolve: () => void) => {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, dest], resolve);
        });
    }

    function mathjaxMarkup(el: HTMLElement, original: string[], internal: string[]) {
        var result: MarkupData[] = [];
        var jaxs = MathJax.Hub.getAllJax(el);
        if (jaxs && jaxs.length === 1) {
            var jax = jaxs[0];
            result.push({ type: original[0], subtype: original[1], markup: jax.originalText });
            if (jax.root.toMathML) {
                result.push({ type: internal[0], subtype: internal[1], markup: '' });
                return new Promise<MarkupData[]>((resolve: (value: MarkupData[]) => void) => {
                    function getMathML() {
                        try {
                            result[1].markup = jax.root.toMathML('');
                            resolve(result);
                        } catch (err) {
                            // to trigger: https://groups.google.com/d/msg/mathjax-dev/ZYirx681dv0/RWspFIVwA2AJ
                            if (!err.restart) { throw err; }
                            MathJax.Callback.After(getMathML, err.restart);
                        }
                    }
                    getMathML();
                });
            }
        }
        return Promise.resolve(result);
    }

    class MathJaxHandler extends Handler {
        constructor(private original: string[], private internal: string[]) {
            super();
        }
        getMarkup(el: HTMLElement) {
            return mathjaxMarkup(el, this.original, this.internal);
        }
        ready(el: HTMLMathItemElement) {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, el], () => {
                (<PromiseWithResolve<void>> el.rendered()).resolve();
            });
            el.clonePresentation = (dest: HTMLElement) => mathjaxClone(el, dest);
            el.getMarkup = () => this.getMarkup(el);
        }
    }

    registerHandler('tex', new MathJaxHandler(['TeX', 'original'], ['MathML', 'MathJax']));
    registerHandler('mml', new MathJaxHandler(['MathML', 'original'], ['MathML', 'MathJax']));
}

module FlorianMath {
    'use strict';

    function cloner(src: HTMLElement, dst: HTMLElement) {
        var img = src.querySelector('img');
        if (img) {
            img = <Element> img.cloneNode(true);
            img.removeAttribute('id');
            dst.appendChild(img);
        }
        return Promise.resolve<void>();
    }

    function markup(el: HTMLElement) {
        var result: MarkupData[] = [];
        var scripts = el.querySelectorAll('script[type="application/mathml+xml"]');
        if (scripts.length === 1) {
            var src = (<HTMLScriptElement> scripts[0]).text, doc = _utils.xml.parseXML(src);
            result.push({
                type: 'MathML',
                subtype: 'original',
                markup: src
            });
            if (doc && doc.documentElement && doc.documentElement.nodeName === 'math')
                result.push({
                    type: 'MathML',
                    subtype: 'prettified',
                    markup: _utils.xml.prettifyMathML(doc.documentElement)
                });
        }
        return Promise.resolve(result);
    }

    class EqnStoreHandler extends Handler {
        ready(el: HTMLMathItemElement) {
            el.clonePresentation = (dest: HTMLElement) => cloner(el, dest);
            el.getMarkup = () => markup(el);
            (<PromiseWithResolve<void>> el.rendered()).resolve();
        }
    }

    registerHandler('eqnstore', new EqnStoreHandler());
}
