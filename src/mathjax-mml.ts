/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax-helpers.ts" />

module FlorianMath {

    var global = window;
    var doc = document;

    function tagsToLowerCase(mml: string): string {
        var beginTagConvert = (match, m1, m2) => '<' + m1.toLowerCase() + m2 + '>';
        var endTagConvert = (match, m1) => '</' + m1.toLowerCase() + '>';
        return mml.replace(/<([a-zA-Z0-9_-]+)\s*(| [^>]+)>/g, beginTagConvert)
            .replace(/<\s*\/\s*([a-zA-Z0-9_-]+)\s*>/g, endTagConvert);
    }

    if (global.HTMLMathItemElement) {

        var origRender = global.HTMLMathItemElement.prototype.render;

        global.HTMLMathItemElement.prototype.render = function () {
            var mathItem = <HTMLMathItemElement> this,
                sources = mathItem.getSources({ render: true, type: MIME_TYPE_MATHML });
            if (sources.length) {
                var script = doc.createElement('script'),
                    output = mathItemInsertContent(this);
                script.type = 'math/mml';
                // lower case tags are important to MathJax (IE8 converts to upper case)
                script.text = trim(tagsToLowerCase(sources[0].innerHTML));
                output.element.appendChild(script);
                mathjaxTypeset(script, output.done,() => {
                    mathjaxAddMMLSource(mathItem, script);
                });
            } else
                origRender.call(this);
        }

    }

}
