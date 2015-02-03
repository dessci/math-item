/// <reference path="../dist/math-item.d.ts" />

declare var MathJax: any;

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function (start: () => Node, done: () => void) {
            var el: FlorianMath.IHTMLMathItemElement = this;
            if (MathJax && MathJax.Hub && MathJax.Hub.Queue) {
                var sources = FlorianMath.getSourceElementsForRendering(el, FlorianMath.MIME_TYPE_MATHML);
                if (sources.length) {
                    var dest = start();
                    sources[0].setAttribute('show', '');
                    dest.appendChild(doc.createElement('content'));
                    return done();
                }
            }
            origRender.call(el, start, done);
        }

    }

})(window, document);
