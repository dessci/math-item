/// <reference path="../dist/math-item.d.ts" />

declare var MathJax: any;

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function (insertion: () => FlorianMath.RenderOutput) {
            var el: FlorianMath.IHTMLMathItemElement = this;
            if (MathJax && MathJax.Hub && MathJax.Hub.Queue) {
                var sources = FlorianMath.getSourceElementsForRendering(el, FlorianMath.MIME_TYPE_MATHML);
                if (sources.length) {
                    var script = doc.createElement('script'),
                        output = insertion();
                    script.type = 'math/mml';
                    script.text = sources[0].innerHTML;
                    output.element.appendChild(script);
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, script], output.done);
                    return;
                }
            }
            origRender.call(el, insertion);
        }

    }

})(window, document);
