/// <reference path="../dist/math-item.d.ts" />
(function (global, doc) {
    if (global.HTMLMathItemElement) {
        var origRender = global.HTMLMathItemElement.render;
        global.HTMLMathItemElement.render = function () {
            var sources = this.getSources({ render: true, type: 'image/png' });
            if (sources.length) {
                var output = FlorianMath.mathItemInsertContent(this), img = doc.createElement('img'), styles = [];
                img.src = sources[0].getAttribute('src');
                if (sources[0].getAttribute('width'))
                    styles.push('width:' + sources[0].getAttribute('width') + ';');
                if (sources[0].getAttribute('valign'))
                    styles.push('vertical-align:' + sources[0].getAttribute('valign') + ';');
                if (styles.length)
                    img.setAttribute('style', styles.join(' '));
                output.element.appendChild(img);
                return output.done();
            }
            origRender.call(this);
        };
    }
})(window, document);
//# sourceMappingURL=eqnstore-source.js.map