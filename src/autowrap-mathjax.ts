/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax.d.ts" />

(function (global: Window, doc: Document) {

    function setAttributes(el: HTMLElement, attrs: {[key: string]: string}) {
        for (var name in attrs)
            if (attrs.hasOwnProperty(name))
                el.setAttribute(name, attrs[name]);
    }

    function createMathItem(attrs: {[key: string]: string}) {
        var mathItem = doc.createElement('math-item');
        global.HTMLMathItemElement.manualCreate(mathItem);
        setAttributes(mathItem, attrs);
        return mathItem;
    }

    function createMathSource(attrs: {[key: string]: string}) {
        var mathSource = doc.createElement('math-source');
        global.HTMLMathSourceElement.manualCreate(mathSource);
        setAttributes(mathSource, attrs);
        return mathSource;
    }

    function toMathML(jax: Jax, callback: (string) => void) {
        var mml;
        try {
            mml = jax.root.toMathML("");
        } catch(err) {
            if (!err.restart) { throw err; } // an actual error
            return MathJax.Callback.After([toMathML, jax, callback], err.restart);
        }
        callback(mml);
    }

    FlorianMath.domReady().then(() => {
        var queue = [];

        if (!(MathJax && MathJax.Hub)) return;

        function wrap(jax: Jax) {
            var script, parent, html, display, mimetype, preview, mathitem, mathsrc, output;

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
            mathitem = createMathItem({'display': display});

            mathsrc = createMathSource({'type': mimetype, 'usage': 'norender'});
            mathsrc.appendChild(doc.createTextNode(jax.originalText));
            mathitem.appendChild(mathsrc);

            parent.insertBefore(mathitem, script);
            global.HTMLMathItemElement.manualAttach(mathitem);
            global.HTMLMathSourceElement.manualAttach(mathsrc);
            output = FlorianMath.mathItemInsertContent(mathitem);
            if (preview)
                output.element.appendChild(preview);
            output.element.appendChild(html);
            output.element.appendChild(script);
            output.done();

            toMathML(jax, (mml: string) => {
                mathsrc = createMathSource({'type': 'application/mathml+xml', 'name': 'MathJax', 'usage': 'norender'});
                mathsrc.appendChild(doc.createTextNode(mml));
                mathitem.appendChild(mathsrc);
                global.HTMLMathSourceElement.manualAttach(mathsrc);
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
