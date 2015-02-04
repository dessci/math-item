/// <reference path="../dist/math-item.d.ts" />

declare var MathJax: any;

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function (insertion: (showSource: FlorianMath.IHTMLMathSourceElement[]) => FlorianMath.RenderOutput) {
            if (MathJax && MathJax.Hub && MathJax.Hub.Queue) {
                var sources = FlorianMath.getSourceElementsForRendering(this, FlorianMath.MIME_TYPE_MATHML);
                if (sources.length)
                    return insertion(sources);
            }
            origRender.call(this, insertion);
        }

    }

})(window, document);
