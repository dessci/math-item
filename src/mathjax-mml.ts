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
                    var script = doc.createElement('script');
                    function begin() {
                        script.type = 'math/mml';
                        script.text = sources[0].innerHTML;
                        start().appendChild(script);
                    }
                    MathJax.Hub.Queue(begin, ['Typeset', MathJax.Hub, script], done);
                    return;
                }
            }
            origRender.call(el, start, done);
        }

    }

})(window, document);
