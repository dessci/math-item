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

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function () {
            var mathItem = <IHTMLMathItemElement> this;
            if (MathJax && MathJax.Hub) {
                var sources = mathItem.getSources({ render: true, type: FlorianMath.MIME_TYPE_TEX });
                if (sources.length) {
                    var script = doc.createElement('script'),
                        displayStyle = FlorianMath.getElementStyle(this, 'display'),
                        output = FlorianMath.mathItemInsertContent(this);

                    function addMMLSource() {
                        var jax = MathJax.Hub.getJaxFor(script);
                        if (jax) {
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
                    }

                    script.type = 'math/tex';
                    if (displayStyle === 'block' || displayStyle === 'inline-block')
                        script.type += '; mode=display';
                    script.text = FlorianMath.trim(sources[0].innerHTML);
                    output.element.appendChild(script);
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, script], output.done, addMMLSource);
                    return;
                }
            }
            origRender.call(this);
        }

    }

})(window, document);
