/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax-helpers.ts" />

module FlorianMath {

    var global = window;
    var doc = document;

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.prototype.render;

        global.HTMLMathItemElement.prototype.render = function () {
            var mathItem = <HTMLMathItemElement> this,
                sources = mathItem.getSources({ render: true, type: MIME_TYPE_TEX });
            if (sources.length) {
                var script = doc.createElement('script'),
                    displayStyle = getElementStyle(this, 'display'),
                    output = mathItemInsertContent(this);
                script.type = 'math/tex';
                if (displayStyle === 'block' || displayStyle === 'inline-block')
                    script.type += '; mode=display';
                script.text = trim(sources[0].innerHTML);
                output.element.appendChild(script);
                mathjaxTypeset(script, output.done, () => {
                    mathjaxAddMMLSource(mathItem, script);
                });
            } else
                origRender.call(this);
        }

    }

}
