/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax.d.ts" />

(function (global: Window, doc: Document) {

    function toMathML(jax: Jax, callback: (string) => void) {
        var mml;
        try {
            mml = jax.root.toMathML('');
        } catch (err) {
            if (!err.restart) { throw err; } // an actual error
            return MathJax.Callback.After([toMathML, jax, callback], err.restart);
        }
        callback(mml);
    }

    function tagsToLowerCase(mml: string): string {
        function beginTagConvert(match, m1, m2) {
            return '<' + m1.toLowerCase() + m2 + '>';
        }
        function endTagConvert(match, m1) {
            return '</' + m1.toLowerCase() + '>';
        }
        return mml.replace(/<([a-zA-Z0-9_-]+)\s*(| [^>]+)>/g, beginTagConvert)
            .replace(/<\s*\/\s*([a-zA-Z0-9_-]+)\s*>/g, endTagConvert);
    }

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function () {
            var mathItem = <IHTMLMathItemElement> this;
            if (MathJax && MathJax.Hub) {
                var sources = mathItem.getSources({ render: true, type: FlorianMath.MIME_TYPE_MATHML });
                if (sources.length) {
                    var script = doc.createElement('script'),
                        output = FlorianMath.mathItemInsertContent(this);

                    function addMMLSource() {
                        var jax = MathJax.Hub.getJaxFor(script);
                        if (!jax) return;
                        toMathML(jax, (mml: string) => {
                            var mathsrc = doc.createElement(FlorianMath.MATH_SOURCE_TAG);
                            global.HTMLMathSourceElement.manualCreate(mathsrc);
                            mathsrc.setAttribute('type', 'application/mathml+xml');
                            mathsrc.setAttribute('name', 'MathJax');
                            mathsrc.setAttribute('usage', 'norender');
                            mathsrc.appendChild(doc.createTextNode(mml));
                            mathItem.appendChild(mathsrc);
                            global.HTMLMathSourceElement.manualAttach(mathsrc);
                        });
                    }

                    script.type = 'math/mml';
                    // lower case is important to MathJax (IE8 converts to upper case)
                    script.text = FlorianMath.trim(tagsToLowerCase(sources[0].innerHTML));
                    output.element.appendChild(script);
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, script], output.done, addMMLSource);
                    return;
                }
            }
            origRender.call(this);
        }

    }

})(window, document);
