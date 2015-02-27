/// <reference path="mathjax.d.ts" />

declare module FlorianMath {
    function mathjaxTypeset(script: HTMLScriptElement, done: () => void, post: () => void): void;
    function mathjaxGetMML(script: HTMLScriptElement, callback: (string) => void): void;
}

(function (FlorianMath) {

    if (!MathJax || !MathJax.Hub) {
        throw Error("MathJax not loaded");
    }

    if (!FlorianMath.mathjaxTypeset) {
        FlorianMath.mathjaxTypeset = (function () {
            var scriptQueue = [], doneQueue = [], postQueue = [], typesetting = false;

            function triggerQueue(queue: { (): void }[]) {
                for (var k = 0; k < queue.length; k++)
                    queue[k]();
            }

            function start() {
                var sq = scriptQueue, dq = doneQueue;
                function done() {
                    triggerQueue(dq);
                    if (!scriptQueue || !scriptQueue.length) {
                        var pq = postQueue;
                        postQueue = [];
                        typesetting = false;
                        console.log('mathjax typeset stop', pq.length);
                        triggerQueue(pq);
                    } else
                        start()
                }
                console.log('mathjax typeset start', sq.length);
                scriptQueue = [];
                doneQueue = [];
                MathJax.Hub.Queue(['Process', MathJax.Hub, sq.length === 1 ? sq[0] : sq, done]);
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
    }

    if (!FlorianMath.mathjaxGetMML) {
        FlorianMath.mathjaxGetMML = (function () {
            function toMathML(jax: Jax, callback: (string) => void) {
                var mml;
                try {
                    mml = jax.root.toMathML('');
                } catch (err) {
                    if (!err.restart) { throw err; } // an actual error
                    return MathJax.Callback.After([toMathML, jax, callback], err.restart);
                }
                callback(mml);
            }

            return (script: HTMLScriptElement, callback: (string) => void) => {
                var jax = MathJax.Hub.getJaxFor(script);
                if (jax)
                    toMathML(jax, callback);
                else
                    callback(null);
            };
        })();
    }

})(FlorianMath);
