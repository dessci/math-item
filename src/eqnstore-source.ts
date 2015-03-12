/// <reference path="../dist/math-item.d.ts" />

(function (global: Window, doc: Document) {

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.prototype.render;

        global.HTMLMathItemElement.prototype.render = function () {
            var sources = (<HTMLMathItemElement> this).getSources({ render: true, type: 'image/png' });
            if (sources.length) {
                var output = FlorianMath.mathItemInsertContent(this),
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
                output.done();
            } else
                origRender.call(this);
        }

    }

})(window, document);
