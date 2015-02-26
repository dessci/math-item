/// <reference path="../dist/math-item.d.ts" />

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function () {
            var sources = (<IHTMLMathItemElement> this).getSources({ render: true, type: FlorianMath.MIME_TYPE_MATHML });
            if (sources.length)
                FlorianMath.mathItemShowSources(this, sources);
            else
                origRender.call(this);
        }

    }

})(window, document);
