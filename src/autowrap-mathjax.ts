/// <reference path="../dist/math-item.d.ts" />

declare var MathJax: any;

(function (global: Window, doc: Document) {

    function createMathItem() {
        var mathItem = doc.createElement('math-item');
        if (global.HTMLMathItemElement.created)
            global.HTMLMathItemElement.created.call(mathItem);
        return mathItem;
    }

    function mathItemAttached(mathItem: IHTMLMathItemElement) {
        if (global.HTMLMathItemElement.attached)
            global.HTMLMathItemElement.attached.call(mathItem);
    }

    function createMathSource() {
        var mathSource = doc.createElement('math-source');
        if (global.HTMLMathSourceElement.created)
            global.HTMLMathSourceElement.created.call(mathSource);
        return mathSource;
    }

    function mathSourceAttached(mathSource: IHTMLMathSourceElement) {
        if (global.HTMLMathSourceElement.attached)
            global.HTMLMathSourceElement.attached.call(mathSource);
    }

    FlorianMath.domReady().then(() => {
        var queue = [];

        if (!(MathJax && MathJax.Hub)) return;

        function toMathML(jax, callback) {
            var mml;
            try {
                mml = jax.root.toMathML("");
            } catch(err) {
                if (!err.restart) { throw err; } // an actual error
                return MathJax.Callback.After([toMathML, jax, callback], err.restart);
            }
            MathJax.Callback(callback)(mml);
        }

        function wrap(jax) {
            var script: HTMLScriptElement, parent, html, display, mimetype, preview, mathitem, mathsrc, output;

            script = jax.SourceElement();
            parent = script.parentElement;
            if (!parent || parent.tagName.toLowerCase() === 'math-item') return;
            if (script.type === 'math/tex' || script.type === 'math/tex; mode=display')
                mimetype = 'application/x-tex';
            else if (script.type === 'math/mml')
                mimetype = 'application/mathml+xml';
            else
                return;

            html = <Element> script.previousSibling;
            if (!html || html.nodeType !== 1)
                return;
            if (html.tagName.toLowerCase() === 'span' && html.className === 'MathJax')
                display = 'inline';
            else if (html.tagName.toLowerCase() === 'div' && html.className === 'MathJax_Display')
                display = 'block';
            else
                return;

            console.log('Wrapping ' + script.id);
            if (html.previousSibling && html.previousSibling.className === 'MathJax_Preview')
                preview = html.previousSibling;
            mathitem = createMathItem();
            mathitem.setAttribute('display', display);

            mathsrc = createMathSource();
            mathsrc.setAttribute('type', mimetype);
            mathsrc.setAttribute('usage', 'norender');
            mathsrc.appendChild(doc.createTextNode(jax.originalText));
            mathitem.appendChild(mathsrc);

            parent.insertBefore(mathitem, script);
            mathItemAttached(mathitem);
            mathSourceAttached(mathsrc);
            output = FlorianMath.mathItemInsertContent(mathitem);
            if (preview)
                output.element.appendChild(preview);
            output.element.appendChild(html);
            output.element.appendChild(script);
            output.done();

            toMathML(jax, (mml: string) => {
                mathsrc = createMathSource();
                mathsrc.setAttribute('type', 'application/mathml+xml');
                mathsrc.setAttribute('name', 'MathJax');
                mathsrc.setAttribute('usage', 'norender');
                mathsrc.appendChild(doc.createTextNode(mml));
                mathitem.appendChild(mathsrc);
                mathSourceAttached(mathsrc);
            });
        }
        MathJax.Hub.Register.MessageHook('New Math', function (message) {
            var jax = MathJax.Hub.getJaxFor(message[1]);
            if (jax) queue.push(jax);
        });
        MathJax.Hub.Register.MessageHook('End Process', function () {
            FlorianMath.each(queue, wrap);
            queue = [];
        });
    });

})(window, document);
