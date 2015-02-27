/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax-helpers.ts" />

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function () {
            var mathItem = <IHTMLMathItemElement> this,
                sources = mathItem.getSources({ render: true, type: FlorianMath.MIME_TYPE_TEX });
            if (sources.length) {
                var script = doc.createElement('script'),
                    displayStyle = FlorianMath.getElementStyle(this, 'display'),
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

                script.type = 'math/tex';
                if (displayStyle === 'block' || displayStyle === 'inline-block')
                    script.type += '; mode=display';
                script.text = FlorianMath.trim(sources[0].innerHTML);
                output.element.appendChild(script);
                FlorianMath.mathjaxTypeset(script, output.done, addMMLSource);
                return;
            }
            origRender.call(this);
        }

    }

})(window, document);
