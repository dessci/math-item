/// <reference path="../dist/math-item.d.ts" />

declare var MathJax: any;

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function (start: () => Node, done: () => void) {
            var el: FlorianMath.IHTMLMathItemElement = this;
            if (MathJax && MathJax.Hub && MathJax.Hub.Queue) {
                var sources = FlorianMath.getSourceElementsForRendering(el, FlorianMath.MIME_TYPE_TEX);
                if (sources.length) {
                    var script = doc.createElement('script'),
                        displayStyle = FlorianMath.getElementStyle(el, 'display');
                    function prepare() {
                        script.type = 'math/tex';
                        if (displayStyle === 'block' || displayStyle === 'inline-block')
                            script.type += '; mode=display';
                        script.text = sources[0].innerHTML;
                        start().appendChild(script);
                    }
                    MathJax.Hub.Queue(prepare, ['Typeset', MathJax.Hub, script], done);
                    return;
                }
            }
            origRender.call(el, start, done);
        }

    }

})(window, document);
