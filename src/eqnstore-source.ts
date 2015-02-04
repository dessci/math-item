/// <reference path="../dist/math-item.d.ts" />

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.render;

        global.HTMLMathItemElement.render = function (insertion: () => FlorianMath.RenderOutput) {
            var el: FlorianMath.IHTMLMathItemElement = this,
                sources = FlorianMath.getSourceElementsForRendering(el, 'image/png');
            if (sources.length) {
                var output = insertion(),
                    img = doc.createElement('img'),
                    styles = [];
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
            origRender.call(el, insertion);
        }

    }

})(window, document);
