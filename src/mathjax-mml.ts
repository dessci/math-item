/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax-helpers.ts" />

(function (global: Window, doc: Document) {

    function tagsToLowerCase(mml: string): string {
        var beginTagConvert = (match, m1, m2) => '<' + m1.toLowerCase() + m2 + '>';
        var endTagConvert = (match, m1) => '</' + m1.toLowerCase() + '>';
        return mml.replace(/<([a-zA-Z0-9_-]+)\s*(| [^>]+)>/g, beginTagConvert)
            .replace(/<\s*\/\s*([a-zA-Z0-9_-]+)\s*>/g, endTagConvert);
    }

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function () {
            var mathItem = <IHTMLMathItemElement> this,
                sources = mathItem.getSources({ render: true, type: FlorianMath.MIME_TYPE_MATHML });
            if (sources.length) {
                var script = doc.createElement('script'),
                    output = FlorianMath.mathItemInsertContent(this);

                function addMMLSource() {
                    FlorianMath.mathjaxGetMML(script, (mml: string) => {
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
                // lower case tags are important to MathJax (IE8 converts to upper case)
                script.text = FlorianMath.trim(tagsToLowerCase(sources[0].innerHTML));
                output.element.appendChild(script);
                FlorianMath.mathjaxTypeset(script, output.done, addMMLSource);
                return;
            }
            origRender.call(this);
        }

    }

})(window, document);
