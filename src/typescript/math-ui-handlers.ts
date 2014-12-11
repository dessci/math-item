/// <reference path="math-ui-main.ts" />

// Built-in extensions

module MathUI {
    'use strict';

    var $ = get$();
    var _ = getUtils();

    class PlainHandler extends Handler {
        canHandle(el: Element): boolean {
            return true;  // act as a catch-all
        }
        getSourceTypes(): string[] {
            return ['HTML'];
        }
        getSourceFor(type: string, el: Element): DocumentFragment {
            if (type === 'HTML')
                return $(document.createDocumentFragment()).append($(el).contents().clone())[0];
            return null;
        }
    }

    class MathMLHandler extends Handler {
        canHandle(el: Element): boolean {
            return $(el).find('math').length === 1;
        }
        getSourceTypes(): string[] {
            return ['MathML/original', 'MathML/prettified'];
        }
        getSourceFor(type: string, el: Element): any {
            if (type === 'MathML/original') {
                var math = $(el).find('math');
                if (math.length) return math[0];
            } else if (type === 'MathML/prettified') {
                var math = $(el).find('math');
                if (math.length) return prettifyMathML(math[0], '');
            }
            return null;
        }
    }

    registerHandler('plain-html', new PlainHandler());
    registerHandler('native-mathml', new MathMLHandler());

}

// MathJax extensions

module MathUI {
    'use strict';

    interface ICallback {
        After(fn: any[], ...cbs: any[]);
    }

    interface JaxRoot {
        toMathML? (space: string): string;
    }

    interface Jax {
        root: JaxRoot;
        originalText: string;
    }

    interface IHub {
        Queue(fn: any[]);
        getAllJax(el: Element): Jax[];
    }

    interface IMathJax {
        Callback: ICallback;
        Hub: IHub;
    }

    declare var MathJax: IMathJax;

    var $ = get$();

    // to trigger: https://groups.google.com/d/msg/mathjax-dev/ZYirx681dv0/RWspFIVwA2AJ
    function getMathML(jax: Jax, callback: (value: string) => void) {
        try {
            callback(jax.root.toMathML(''));
        } catch (err) {
            if (!err.restart) { throw err; }
            MathJax.Callback.After([getMathML, jax, callback], err.restart);
        }
    }

    class MathJaxHandler extends Handler {
        constructor(private original: string, private internal: string) {
            super();
        }
        init(el: Element): void {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
        }
        clonePresentation(from: Element, to: Element) {
            var script = $(from).find('script[type]');
            $(to).append(script.clone().removeAttr('id').removeAttr('MathJax'));
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, to]);
        }
        private _getJaxElement(el: Element): Jax {
            var jax = MathJax.Hub.getAllJax(el);
            return jax && jax.length === 1 ? jax[0] : null;
        }
        getSourceTypes(el: Element) {
            var types = [this.original], jax = this._getJaxElement(el);
            if (jax && jax.root.toMathML)
                types.push(this.internal);
            return types;
        }
        getSourceFor(type: string, el: Element, callback: (value: string) => void): string {
            var jax = this._getJaxElement(el);
            if (!jax) return null;
            if (type === this.original) {
                return jax.originalText;
            } else if (type === this.internal && jax.root.toMathML) {
                try {
                    return jax.root.toMathML('');
                } catch (err) {
                    if (!err.restart) { throw err; }
                    MathJax.Callback.After([getMathML, jax, callback], err.restart);
                    // return undefined;
                }
            }
        }
    }

    MathUI.registerHandler('tex', new MathJaxHandler('TeX/original', 'MathML/MathJax'));
    MathUI.registerHandler('mml', new MathJaxHandler('MathML/original', 'MathML/MathJax'));
}

// EqnStore extension

module MathUI {
    'use strict';

    var $ = get$();

    class EqnStoreHandler extends Handler {
        clonePresentation(from: Element, to: Element) {
            $(to).append($(from).find('img').clone());
        }
        getSourceTypes(el: Element) {
            if ($(el).find('script[type="math/mml"]').length !== 1)
                return [];
            var types = ['MathML/original'];
            if (DOMParser)
                types.push('MathML/prettified');
            return types;
        }
        getSourceFor(type: string, el: Element, callback: (value: string) => void): string {
            var script = $(el).find('script[type="math/mml"]');
            if (script.length === 1) {
                var src = script.text();
                if (type === 'MathML/original') {
                    return src;
                } else if (type === 'MathML/prettified') {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(src, 'application/xml');
                    return prettifyMathML(<HTMLElement> doc.firstChild, '');
                }
            }
            return null;
        }
    }

    MathUI.registerHandler('eqnstore', new EqnStoreHandler());
}
 