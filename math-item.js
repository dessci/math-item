var FlorianMath;
(function (FlorianMath) {
    // local functions
    function hasPromise(local) {
        return ('Promise' in local && 'resolve' in local.Promise && 'reject' in local.Promise && 'all' in local.Promise && 'race' in local.Promise && (function () {
            var resolve;
            new local.Promise(function (r) {
                resolve = r;
            });
            return typeof resolve === 'function';
        }));
    }
    function indexOf(list, item) {
        for (var k = 0; k < list.length; k++)
            if (list[k] === item)
                return k;
        return -1;
    }
    // exported functions
    function each(list, fn) {
        for (var k = 0; k < list.length; k++) {
            fn(list[k], k);
        }
    }
    FlorianMath.each = each;
    FlorianMath.Promise = hasPromise(window) ? window.Promise : (function () {
        var Promise = function (callback) {
            var _this = this;
            var flush = function (thenFunc) {
                _this.then = thenFunc;
                each(_this._thens, function (then) {
                    thenFunc(then.resolved, then.rejected);
                });
                delete _this._thens;
            };
            this._thens = [];
            callback(function (val) {
                flush(function (resolved) {
                    resolved(val);
                });
            }, function (reason) {
                flush(function (resolved, rejected) {
                    if (rejected)
                        rejected(reason);
                });
            });
        };
        Promise.prototype.then = function (resolved, rejected) {
            this._thens.push({ resolved: resolved, rejected: rejected });
        };
        Promise.resolve = function (val) {
            return new Promise(function (resolve) {
                resolve(val);
            });
        };
        return Promise;
    })();
    function getElementStyle(el, prop) {
        if (typeof getComputedStyle === 'function')
            return getComputedStyle(el, null).getPropertyValue(prop);
        else
            return el.currentStyle[prop];
    }
    FlorianMath.getElementStyle = getElementStyle;
    function addEventListenerFn(el, type, callback) {
        if (el.addEventListener)
            el.addEventListener(type, callback, false);
        else
            el.attachEvent('on' + type, callback);
    }
    FlorianMath.domReady = (function () {
        var promise = document.readyState === 'complete' ? FlorianMath.Promise.resolve() : new FlorianMath.Promise(function (resolve) {
            var fired = false;
            function trigger() {
                if (fired)
                    return;
                fired = true;
                resolve();
            }
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', trigger);
            }
            if (document.attachEvent) {
                document.attachEvent('onreadystatechange', function () {
                    if (document.readyState === 'complete')
                        trigger();
                });
            }
            addEventListenerFn(window, 'load', trigger);
        });
        return function () { return promise; };
    })();
    FlorianMath.async = typeof requestAnimationFrame === 'function' ? function (fn) {
        requestAnimationFrame(fn);
    } : function (fn) {
        setTimeout(fn, 0);
    };
    FlorianMath.trim = String.prototype.trim ? function (st) { return st.trim(); } : (function () {
        var characters = '[\\s\\uFEFF\\xA0]';
        var regex = new RegExp('^' + characters + '+|' + characters + '+$', 'g');
        return function (st) { return st.replace(regex, ''); };
    })();
    // Custom events
    function hasCustomEvent() {
        try {
            return (typeof CustomEvent === 'function') && (new CustomEvent('ev'));
        }
        catch (ex) {
            return false;
        }
    }
    FlorianMath.dispatchCustomEvent;
    FlorianMath.addCustomEventListener;
    FlorianMath.removeCustomEventListener;
    if (window.addEventListener) {
        if (hasCustomEvent()) {
            FlorianMath.dispatchCustomEvent = function (target, typeArg, params) {
                var evt = new CustomEvent(typeArg, params);
                target.dispatchEvent(evt);
            };
        }
        else if (document.createEvent) {
            // IE >= 9
            FlorianMath.dispatchCustomEvent = function (target, typeArg, params) {
                var evt = document.createEvent('CustomEvent');
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                evt.initCustomEvent(typeArg, params.bubbles, params.cancelable, params.detail);
                target.dispatchEvent(evt);
            };
        }
        if (FlorianMath.dispatchCustomEvent) {
            FlorianMath.addCustomEventListener = function (target, typeArg, listener) {
                target.addEventListener(typeArg, listener);
            };
            FlorianMath.removeCustomEventListener = function (target, typeArg, listener) {
                target.removeEventListener(typeArg, listener);
            };
        }
    }
    if (!FlorianMath.dispatchCustomEvent) {
        // IE 8
        (function () {
            function CustomEvent(target, typeArg, params) {
                params = params || { bubbles: false, detail: undefined };
                this.type = typeArg;
                this.target = target;
                this.detail = params.detail;
                this.bubbles = params.bubbles;
                this.cancelBubble = false;
            }
            CustomEvent.prototype.stopPropagation = function () {
                this.cancelBubble = true;
            };
            FlorianMath.dispatchCustomEvent = function (target, typeArg, params) {
                var evt = new CustomEvent(target, typeArg, params);
                while (target) {
                    if (target._flomath_ && target._flomath_.events && typeArg in target._flomath_.events) {
                        each(target._flomath_.events[typeArg], function (fn) {
                            fn(evt);
                        });
                    }
                    if (!evt.bubbles || evt.cancelBubble || !target.parentNode)
                        break;
                    target = target.parentNode;
                }
            };
            FlorianMath.addCustomEventListener = function (target, typeArg, listener) {
                if (!target._flomath_)
                    target._flomath_ = { events: {} };
                var eventDict = target._flomath_.events;
                if (!(typeArg in eventDict))
                    eventDict[typeArg] = [];
                eventDict[typeArg].push(listener);
            };
            FlorianMath.removeCustomEventListener = function (target, typeArg, listener) {
                if (target._flomath_ && target._flomath_.events && typeArg in target._flomath_.events) {
                    var listeners = target._flomath_.events[typeArg], index = indexOf(listeners, listener);
                    if (index >= 0)
                        listeners.splice(index, 1);
                }
            };
        })();
    }
})(FlorianMath || (FlorianMath = {}));
/// <reference path="utils.ts" />
var FlorianMath;
(function (FlorianMath) {
    FlorianMath.MATH_ITEM_TAG = 'math-item';
    FlorianMath.MATH_SOURCE_TAG = 'math-source';
    FlorianMath.MIME_TYPE_HTML = 'text/html';
    FlorianMath.MIME_TYPE_TEX = 'application/x-tex';
    FlorianMath.MIME_TYPE_MATHML = 'application/mathml+xml';
    var global = window, doc = document, counter = 0;
    function iterateChildren(n, fn) {
        var c = n.firstChild, next;
        while (c) {
            next = c.nextSibling;
            fn(c);
            c = next;
        }
    }
    function iterateSourceElements(el, fn) {
        iterateChildren(el, function (c) {
            if (c.nodeType === 1 && c.tagName.toLowerCase() === FlorianMath.MATH_SOURCE_TAG)
                fn(c);
        });
    }
    function mathItemClean() {
        var _this = this;
        var shadow = this.shadowRoot;
        iterateChildren(this, function (c) {
            if (c.nodeType === 1 && c.tagName.toLowerCase() === FlorianMath.MATH_SOURCE_TAG)
                c.style.display = 'none';
            else
                _this.removeChild(c);
        });
        if (shadow) {
            iterateChildren(shadow, function (c) {
                shadow.removeChild(c);
            });
        }
    }
    function mathItemRenderDone(mathItem) {
    }
    function mathItemInsertContent(mathItem) {
        mathItem.clean();
        return {
            element: mathItem.shadowRoot || (mathItem.createShadowRoot ? mathItem.createShadowRoot() : mathItem),
            done: function () {
                mathItemRenderDone(mathItem);
            }
        };
    }
    FlorianMath.mathItemInsertContent = mathItemInsertContent;
    function mathItemShowSources(mathItem, sources) {
        mathItem.clean();
        FlorianMath.each(sources, function (source) {
            source.style.display = '';
        });
        if (mathItem.shadowRoot)
            mathItem.shadowRoot.appendChild(document.createElement('content'));
        mathItemRenderDone(mathItem);
    }
    FlorianMath.mathItemShowSources = mathItemShowSources;
    function doPreview(mathItem) {
        var previewSources = mathItem.getSources({ render: false, markup: false });
        if (previewSources.length) {
            FlorianMath.each(previewSources, function (source) {
                source.style.display = '';
            });
        }
    }
    function mathItemEnqueueRender(mathItem) {
        if (!mathItem._private.updatePending) {
            mathItem._private.updatePending = true;
            FlorianMath.async(function () {
                mathItem._private.updatePending = false;
                if (mathItem._private.firstPass) {
                    mathItem._private.firstPass = false;
                    //normalize(el);
                    doPreview(mathItem);
                }
                mathItem.render();
            });
        }
    }
    function renderProxy() {
        global.HTMLMathItemElement.render.call(this);
    }
    function sourceEncoding(src) {
        return src.getAttribute('type') || FlorianMath.MIME_TYPE_HTML;
    }
    /*
     * render  markup  usage
     * -       -       'preview'
     * +       -       'nomarkup'
     * -       +       'norender'
     * +       +       ''
     */
    function getSources(options) {
        var result = [], render, markup, encoding;
        options = options || {};
        if (options.render !== undefined)
            render = !!options.render;
        if (options.markup !== undefined)
            markup = !!options.markup;
        encoding = options.type;
        iterateSourceElements(this, function (source) {
            var usage = source.getAttribute('usage');
            if (render !== undefined && render === (usage === 'preview' || usage === 'norender'))
                return;
            if (markup !== undefined && markup === (usage === 'preview' || usage === 'nomarkup'))
                return;
            if (encoding !== undefined && encoding !== sourceEncoding(source))
                return;
            result.push(source);
        });
        return result;
    }
    function baseItemCreate() {
        this._private = {
            updatePending: false,
            firstPass: true,
            id: counter++
        };
    }
    function manualItemCreate(mathItem, deep) {
        mathItem.render = renderProxy;
        mathItem.clean = mathItemClean;
        mathItem.getSources = getSources;
        baseItemCreate.call(mathItem);
        if (deep) {
            iterateSourceElements(this, function (source) {
                manualSourceCreate(source);
            });
        }
    }
    function baseItemAttach() {
        mathItemEnqueueRender(this);
    }
    function manualItemAttach(mathItem, deep) {
        baseItemAttach.call(mathItem);
        if (deep) {
            iterateSourceElements(this, function (source) {
                manualSourceAttach(source);
            });
        }
    }
    function baseSourceCreate() {
        this.style.display = 'none';
    }
    function manualSourceCreate(mathSource) {
        baseSourceCreate.call(mathSource);
    }
    function baseSourceAttach() {
        var usage = this.getAttribute('usage') || '';
        if (usage === '' || usage === 'nomarkup') {
            var parent = this.parentElement;
            if (parent && parent.tagName.toLowerCase() === FlorianMath.MATH_ITEM_TAG)
                mathItemEnqueueRender(parent);
        }
    }
    function manualSourceAttach(mathSource) {
        baseSourceAttach.call(mathSource);
    }
    var initializedResolver;
    FlorianMath.initialized = (function () {
        var promise = new FlorianMath.Promise(function (resolve) {
            initializedResolver = resolve;
        });
        return function () { return promise; };
    })();
    if (doc.registerElement) {
        var MathItemPrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: baseItemCreate },
            attachedCallback: { enumerable: true, value: baseItemAttach },
            render: { enumerable: true, value: renderProxy, writable: true },
            clean: { enumerable: true, value: mathItemClean, writable: true },
            getSources: { enumerable: true, value: getSources, writable: true }
        });
        var MathSourcePrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: baseSourceCreate },
            attachedCallback: { enumerable: true, value: baseSourceAttach }
        });
        global.HTMLMathItemElement = doc.registerElement(FlorianMath.MATH_ITEM_TAG, { prototype: MathItemPrototype });
        global.HTMLMathSourceElement = doc.registerElement(FlorianMath.MATH_SOURCE_TAG, { prototype: MathSourcePrototype });
        global.HTMLMathItemElement.manualCreate = global.HTMLMathItemElement.manualAttach = global.HTMLMathSourceElement.manualCreate = global.HTMLMathSourceElement.manualAttach = function () {
        };
        initializedResolver();
    }
    else {
        doc.createElement(FlorianMath.MATH_ITEM_TAG);
        doc.createElement(FlorianMath.MATH_SOURCE_TAG);
        global.HTMLMathItemElement = {
            manualCreate: manualItemCreate,
            manualAttach: manualItemAttach
        };
        global.HTMLMathSourceElement = {
            manualCreate: manualSourceCreate,
            manualAttach: manualSourceAttach
        };
        FlorianMath.domReady().then(function () {
            FlorianMath.each(doc.querySelectorAll(FlorianMath.MATH_ITEM_TAG), function (mathItem) {
                manualItemCreate(mathItem, true);
                manualItemAttach(mathItem, true);
            });
            initializedResolver();
        });
    }
    global.HTMLMathItemElement.render = function () {
        var toShow = this.getSources({ render: true, type: FlorianMath.MIME_TYPE_HTML });
        if (toShow.length)
            mathItemShowSources(this, toShow);
    };
})(FlorianMath || (FlorianMath = {}));
//# sourceMappingURL=math-item.js.map