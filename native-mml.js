/// <reference path="../dist/math-item.d.ts" />
(function (global, doc) {
    if (global.HTMLMathItemElement) {
        var origRender = global.HTMLMathItemElement.render;
        global.HTMLMathItemElement.render = function () {
            var sources = this.getSources({ render: true, type: FlorianMath.MIME_TYPE_MATHML });
            if (sources.length)
                FlorianMath.mathItemShowSources(this, sources);
            else
                origRender.call(this);
        };
    }
})(window, document);
//# sourceMappingURL=native-mml.js.map