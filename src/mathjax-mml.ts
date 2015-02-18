/// <reference path="../dist/math-item.d.ts" />

declare var MathJax: any;

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function () {
            if (MathJax && MathJax.Hub && MathJax.Hub.Queue) {
                var sources = (<IHTMLMathItemElement> this).getRenderElements(FlorianMath.MIME_TYPE_MATHML);
                if (sources.length) {
                    var script = doc.createElement('script'),
                        output = FlorianMath.mathItemInsertContent(this);
                    script.type = 'math/mml';
                    // lower case is important to MathJax (IE8 converts to upper case)
                    script.text = FlorianMath.trim(sources[0].innerHTML.toLowerCase());
                    output.element.appendChild(script);
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, script], output.done);
                    return;
                }
            }
            origRender.call(this);
        }

    }

})(window, document);
