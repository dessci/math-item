/// <reference path="../dist/math-item.d.ts" />

// type/1
(function (global: Window, doc: Document) {

    var origRender = global.HTMLMathItemElement.render;

    global.HTMLMathItemElement.render = function () {
        var sources = (<IHTMLMathItemElement> this).getRenderElements('type/1');
        if (sources.length) {
            var output = FlorianMath.mathItemInsertContent(this), n: Node;
            for (n = sources[0].firstChild; n; n = n.nextSibling)
                output.element.appendChild(n.cloneNode(true));
            output.done();
            return;
        }
        origRender.call(this);
    }

})(window, document);

// type/2
(function (global: Window, doc: Document) {

    var origRender = global.HTMLMathItemElement.render;

    global.HTMLMathItemElement.render = function () {
        var sources = (<IHTMLMathItemElement> this).getRenderElements('type/2');
        if (sources.length) {
            FlorianMath.mathItemShowSources(this, sources);
            return;
        }
        origRender.call(this);
    }

})(window, document);

// BaseApp.renderCount
module BaseApp {

    export var renderCount = 0;

    var origRender = window.HTMLMathItemElement.render;
    window.HTMLMathItemElement.render = function () {
        renderCount++;
        origRender.call(this);
    }

}
