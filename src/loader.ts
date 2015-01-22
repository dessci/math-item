/// <reference path="dom-utils.ts" />
/// <reference path="../typings/jquery.d.ts" />

module FlorianMath {
    'use strict';

    var dom = _utils.dom;
    export var jQueryLib: JQueryStatic;

    // a validator is needed for IE8
    function dynamicLoad(elem: HTMLScriptElement, validator: () => boolean, failMessage: string) {
        var head = document.querySelector('head'), done = false;
        elem.async = true;
        return new Promise((resolve: () => void, reject: (msg: string) => void) => {
            elem.onload = elem.onreadystatechange = () => {
                if (!done && (!elem.readyState || elem.readyState === "loaded" || elem.readyState === "complete")) {
                    done = true;
                    validator() ? resolve() : reject(failMessage);
                }
            };
            elem.onerror = () => {
                if (!done) {
                    done = true;
                    reject(failMessage);
                }
            };
            head.appendChild(elem);
        });
    }

    function jQueryPresent() {
        return 'jQuery' in window && jQuery.fn.on;
    }

    function loadjQuery() {
        var match = navigator.userAgent.match(/msie (.+);/i),
            IEpre9 = match && parseFloat(match[1]) < 9,
            version = IEpre9 ? '1.11.2' : '2.1.3',
            script = document.createElement('script');
        script.src = 'https://code.jquery.com/jquery-' + version + '.min.js';
        return dynamicLoad(script, jQueryPresent, 'jQuery').then(() => {
            jQueryLib = <JQueryStatic> jQuery.noConflict(true);
        });
    }

    function loadLnFjs() {
        var script = document.createElement('script');
        script.src = '../../dist/math-ui-bootstrap.js';
        return dynamicLoad(script, () => lookAndFeel !== undefined, 'look-and-feel');
    }

    dom.ready().then(() => {
        Promise.resolve<void>().then(() => {
            if (!jQueryPresent())
                return loadjQuery();
            jQueryLib = jQuery;
        }).then(() => {
            return loadLnFjs();
        }).then(undefined, (msg: string) => {
            // don't use catch because IE8 won't parse it
            console.log('Look and Feel load failed: ' + msg);
        });
    });

}
