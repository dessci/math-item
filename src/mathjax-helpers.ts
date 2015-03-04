/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax.d.ts" />

module FlorianMath {

    var global = window;
    var doc = document;

    function triggerQueue(queue: { (): void }[]) {
        each(queue,(fn: () => void) => { fn(); });
    }

    if (!MathJax || !MathJax.Hub) {
        throw Error("MathJax not loaded");
    }

    export var mathjaxTypeset: (script: HTMLScriptElement, done: () => void, post: () => void) => void = (function () {
        var scriptQueue = [], doneQueue = [], postQueue = [], typesetting = false;

        function start() {
            var sq = scriptQueue, dq = doneQueue;
            function done() {
                triggerQueue(dq);
                if (!scriptQueue.length) {
                    var pq = postQueue;
                    postQueue = [];
                    typesetting = false;
                    triggerQueue(pq);
                } else
                    start()
            }
            scriptQueue = [];
            doneQueue = [];
            MathJax.Hub.Queue(['Process', MathJax.Hub, sq, done]);
        }

        return (script: HTMLScriptElement, done: () => void, post: () => void) => {
            scriptQueue.push(script);
            doneQueue.push(done);
            postQueue.push(post);
            if (!typesetting) {
                typesetting = true;
                start();
            }
        };
    })();

    export var mathjaxAddMMLSource: (mathItem: IHTMLMathItemElement, script: HTMLScriptElement) => void = (function () {
        function toMathML(jax: Jax, callback: (string) => void) {
            try {
                callback(jax.root.toMathML(''));
            } catch (err) {
                if (!err.restart) { throw err; } // an actual error
                MathJax.Callback.After([toMathML, jax, callback], err.restart);
            }
        }

        return (mathItem: IHTMLMathItemElement, script: HTMLScriptElement) => {
            var jax = MathJax.Hub.getJaxFor(script);
            if (!jax) return;
            toMathML(jax,(mml: string) => {
                var mathSrc = doc.createElement(MATH_SOURCE_TAG);
                global.HTMLMathSourceElement.manualCreate(mathSrc);
                mathSrc.setAttribute('type', 'application/mathml+xml');
                mathSrc.setAttribute('name', 'MathJax');
                mathSrc.setAttribute('usage', 'norender');
                mathSrc.appendChild(doc.createTextNode(mml));
                mathItem.appendChild(mathSrc);
                global.HTMLMathSourceElement.manualAttach(mathSrc);
            });
        };
    })();

}