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

    function dumpXML(n: Node, indent: string): string {
        if (n.nodeType === 1) {
            var name = n.nodeName.toLowerCase();
            var children: Node[] = [];
            for (var c = (<Element> n).firstChild; c !== null; c = c.nextSibling)
                children.push(c);
            while (children.length !== 0 && children[0].nodeType === 3 && !_.trim(children[0].nodeValue))
                children.splice(0, 1);
            while (children.length !== 0 && children[children.length - 1].nodeType === 3 && !_.trim(children[children.length - 1].nodeValue))
                children.pop();
            if (children.length == 0)
                return '<' + name + '></' + name + '>';
            var r = '<' + name + '>';
            var prevIsText = false;
            _.each(children, (c: Node) => {
                if (c.nodeType === 3) {
                    prevIsText = true;
                } else if (prevIsText) {
                    prevIsText = false;
                } else {
                    r += '\n  ' + indent;
                }
                r += dumpXML(c, indent + '  ');
            });
            r += (prevIsText ? '' : '\n' + indent) + '</' + name + '>';
            return r;
        } else if (n.nodeType === 3) {
            return n.nodeValue;
        }
        return '[!]';
    }

    class MathMLHandler extends Handler {
        canHandle(el: Element): boolean {
            return $(el).find('math').length === 1;
        }
        getSourceTypes(): string[] {
            return ['MathML'];
        }
        getSourceFor(type: string, el: Element): string {
            if (type === 'MathML') {
                var math = $(el).find('math');
                if (math.length) return dumpXML(math[0], '');
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

    MathUI.registerHandler('tex', new MathJaxHandler('TeX', 'MathML'));
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
            return $(el).find('script[type="math/mml"]').length === 1 ? ['MathML'] : [];
        }
        getSourceFor(type: string, el: Element, callback: (value: string) => void): string {
            if (type === 'MathML') {
                var script = $(el).find('script[type="math/mml"]');
                if (script.length === 1)
                    return script.text();
            }
            return null;
        }
    }

    MathUI.registerHandler('eqnstore', new EqnStoreHandler());
}
 