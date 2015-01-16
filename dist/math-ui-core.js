var MathUI;
(function (MathUI) {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty, nativeKeys = Object.keys;
    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }
    function has(obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    }
    function keys(obj) {
        if (!isObject(obj))
            return [];
        if (nativeKeys)
            return nativeKeys(obj);
        var keys = [];
        for (var key in obj)
            if (has(obj, key))
                keys.push(key);
        return keys;
    }
    function each(obj, iteratee, context) {
        if (obj == null)
            return obj;
        var i, length = obj.length;
        if (length === +length) {
            for (i = 0; i < length; i++) {
                iteratee.call(context, obj[i], i, obj);
            }
        }
        else {
            var ks = keys(obj);
            for (i = 0, length = ks.length; i < length; i++) {
                iteratee.call(context, obj[ks[i]], ks[i], obj);
            }
        }
        return obj;
    }
    function map(obj, iteratee, context) {
        if (obj == null)
            return [];
        var ks = obj.length !== +obj.length && keys(obj), length = (ks || obj).length, results = Array(length), currentKey;
        for (var index = 0; index < length; index++) {
            currentKey = ks ? ks[index] : index;
            results[index] = iteratee.call(context, obj[currentKey], currentKey, obj);
        }
        return results;
    }
    function filter(list, predicate, context) {
        var result = [];
        each(list, function (value, index, list) {
            if (predicate.call(context, value, index, list))
                result.push(value);
        });
        return result;
    }
    function contains(list, elem) {
        return indexOf(list, elem) >= 0;
    }
    function difference(list1, list2) {
        return filter(list1, function (item) { return !contains(list2, item); });
    }
    function union(list1, list2) {
        var result = difference(list1, list2);
        Array.prototype.push.apply(result, list2);
        return result;
    }
    function indexOf(array, item) {
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }
    var trim = String.prototype.trim ? function (st) { return st.trim(); } : (function () {
        var characters = '[\\s\\uFEFF\\xA0]';
        var regex = new RegExp('^' + characters + '+|' + characters + '+$', 'g');
        return function (st) { return st.replace(regex, ''); };
    })();
    var utils = {
        each: each,
        map: map,
        filter: filter,
        indexOf: indexOf,
        contains: contains,
        union: union,
        difference: difference,
        without: function (list, elem) { return filter(list, function (item) { return item !== elem; }); },
        trim: trim,
        words: function (st) {
            st = trim(st);
            return st ? st.split(/\s+/) : [];
        },
        isArray: function (obj) { return Object.prototype.toString.call(obj) === '[object Array]'; },
        toArray: function (list) { return map(list, function (item) { return item; }); }
    };
    function getUtils() {
        return utils;
    }
    MathUI.getUtils = getUtils;
    var Promise = (function () {
        function Promise(callback) {
            var _this = this;
            this._thens = [];
            var flush = function () {
                each(_this._thens, function (then) {
                    _this.then(then.resolved, then.rejected);
                });
                delete _this._thens;
            };
            callback(function (val) {
                _this.then = function (resolved) {
                    resolved(val);
                };
                flush();
            }, function (reason) {
                _this.then = function (resolved, rejected) {
                    if (rejected)
                        rejected(reason);
                };
                flush();
            });
        }
        Promise.prototype.then = function (resolved, rejected) {
            this._thens.push({ resolved: resolved, rejected: rejected });
        };
        Promise.resolve = function (val) {
            return new Promise(function (resolve) {
                resolve(val);
            });
        };
        Promise.all = function (promises) {
            return new Promise(function (resolve, reject) {
                var results = [];
                function check(k) {
                    if (k < promises.length) {
                        promises[k].then(function (val) {
                            results.push(val);
                            check(k + 1);
                        }, function (reason) {
                            reject(reason);
                        });
                    }
                    else
                        resolve(results);
                }
                check(0);
            });
        };
        return Promise;
    })();
    MathUI.Promise = Promise;
    function makePromiseWithResolver() {
        var resolver, p = new Promise(function (resolve) {
            resolver = resolve;
        });
        p.resolve = resolver;
        return p;
    }
    MathUI.makePromiseWithResolver = makePromiseWithResolver;
    MathUI.async = typeof requestAnimationFrame === 'function' ? function (fn) {
        requestAnimationFrame(fn);
    } : function (fn) {
        setTimeout(fn, 0);
    };
})(MathUI || (MathUI = {}));
/// <reference path="math-ui-utils.ts" />
var MathUI;
(function (MathUI) {
    'use strict';
    MathUI.microJQ = (function (window, document, undefined) {
        'use strict';
        var _ = MathUI.getUtils();
        // internals
        var elementStore = {};
        var elementCounter = 0;
        function nextId() {
            return '' + (++elementCounter);
        }
        function getElementStore(element) {
            var elementId = element.microjqid;
            var store = elementId && elementStore[elementId];
            if (!store) {
                element.microjqid = elementId = nextId();
                elementStore[elementId] = store = { events: {}, handler: undefined };
            }
            return store;
        }
        function addEventListenerFn(el, type, callback) {
            if (el.addEventListener)
                el.addEventListener(type, callback, false);
            else
                el.attachEvent('on' + type, callback);
        }
        function removeEventListenerFn(el, type, callback) {
            if (el.removeEventListener)
                el.removeEventListener(type, callback, false);
            else
                el.detachEvent('on' + type, callback);
        }
        var KEYBOARD_EVENTS = ['keydown', 'keyup', 'keypress'];
        var MOUSE_EVENTS = ['mousedown', 'mouseup', 'click'];
        var mouseButtonToWhich = [1, 1, 3, 0, 2]; // 0,1 -> 1, 4 -> 2, 2 -> 3
        var MicroJQEvent = (function () {
            function MicroJQEvent(event) {
                this.originalEvent = event;
                this.type = event.type;
                this.target = event.target || event.srcElement;
                this.which = 0;
                if (_.contains(KEYBOARD_EVENTS, event.type))
                    this.which = event.which || event.keyCode;
                else if (_.contains(MOUSE_EVENTS, event.type))
                    this.which = event.which !== undefined ? event.which : mouseButtonToWhich[event.button];
            }
            MicroJQEvent.prototype.preventDefault = Event.prototype.preventDefault ? function () {
                this.originalEvent.preventDefault();
            } : function () {
                this.originalEvent.returnValue = false;
            };
            MicroJQEvent.prototype.stopPropagation = Event.prototype.stopPropagation ? function () {
                this.originalEvent.stopPropagation();
            } : function () {
                this.originalEvent.cancelBubble = true;
            };
            return MicroJQEvent;
        })();
        function createEventHandler(element, events) {
            function eventHandler(event) {
                var eventFns = events[event.type];
                if (eventFns && eventFns.length) {
                    var mjqevent = new MicroJQEvent(event);
                    if (eventFns.length > 1)
                        eventFns = _.toArray(eventFns); // make copy to avoid changes while looping
                    _.each(eventFns, function (fn) {
                        fn.call(element, mjqevent);
                    });
                }
            }
            return eventHandler;
        }
        function elementOff(el, type, fn) {
            var store = getElementStore(el);
            var events = store.events;
            var handler = store.handler;
            if (!handler)
                return;
            if (type) {
                _.each(_.words(type), function (type) {
                    if (fn) {
                        var listeners = events[type];
                        if (listeners) {
                            listeners = _.without(listeners, fn);
                            if (listeners.length)
                                return;
                        }
                    }
                    removeEventListenerFn(el, type, handler);
                    delete events[type];
                });
            }
            else {
                for (type in events) {
                    removeEventListenerFn(el, type, handler);
                    delete events[type];
                }
            }
        }
        function elementRemoveData(element) {
            var elementId = element.microjqid;
            var store = elementId && elementStore[elementId];
            if (store) {
                if (store.handler) {
                    elementOff(element);
                }
                delete elementStore[elementId];
                element.microjqid = undefined;
            }
        }
        function subTreeRemoveData(element) {
            elementRemoveData(element);
            _.each(element.querySelectorAll('*'), function (descendant) {
                elementRemoveData(descendant);
            });
        }
        // MicroJQ
        function MicroEl(elements) {
            var _this = this;
            this.length = 0;
            _.each(elements, function (el) {
                _this[_this.length++] = el;
            });
        }
        var deepClone = (function () {
            function deepCloneNew(el) {
                return el.cloneNode(true);
            }
            function deepCloneOld(el) {
                var n = el.cloneNode(false);
                if (n.nodeType === 1 && el.nodeName.toLowerCase() === 'script') {
                    n.text = el.text;
                }
                else {
                    for (var c = el.firstChild; c !== null; c = c.nextSibling)
                        n.appendChild(deepCloneOld(c));
                }
                return n;
            }
            var s = document.createElement('script');
            s.text = 'x';
            return s.cloneNode(true).text === 'x' ? deepCloneNew : deepCloneOld;
        })();
        function setText(el, txt) {
            if (el.textContent !== undefined)
                el.textContent = txt;
            else
                el.innerText = txt;
        }
        function getText(el) {
            return el.textContent !== undefined ? el.textContent : el.text !== undefined ? el.text : el.innerText;
        }
        function allChildren(collection, filter) {
            var matches = [];
            _.each(collection, function (el) {
                var child = el.firstChild;
                while (child != null) {
                    if (!filter || filter(child))
                        matches.push(child);
                    child = child.nextSibling;
                }
            });
            return matches;
        }
        MicroEl.prototype = {
            find: function (selector) {
                var matches = [];
                _.each(this, function (el) {
                    _.each(el.querySelectorAll(selector), function (n) {
                        matches.push(n);
                    });
                });
                return new MicroEl(matches);
            },
            contents: function () {
                return new MicroEl(allChildren(this));
            },
            children: function () {
                return new MicroEl(allChildren(this, function (n) { return n.nodeType === 1; }));
            },
            clone: function () {
                return new MicroEl(_.map(this, deepClone));
            },
            first: function () {
                return this.length === 0 ? this : new MicroEl([this[0]]);
            },
            data: function (key) {
                return this[0].getAttribute('data-' + key);
            },
            width: function () {
                var br = this[0].getBoundingClientRect();
                return br.width !== undefined ? br.width : (br.right - br.left);
            },
            height: function () {
                var br = this[0].getBoundingClientRect();
                return br.height !== undefined ? br.height : (br.bottom - br.top);
            },
            each: function (func) {
                return _.each(this, function (el, i) {
                    func.call(el, i, el);
                });
            },
            text: function (txt) {
                if (txt !== undefined) {
                    return _.each(this, function (el) {
                        setText(el, txt);
                    });
                }
                else {
                    return _.map(this, getText).join('');
                }
            },
            append: function () {
                var _this = this;
                var content = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    content[_i - 0] = arguments[_i];
                }
                var nodes = [];
                _.each(content, function (item) {
                    _.each(_.isArray(item) ? item : [item], function (e) {
                        if (e instanceof MicroEl) {
                            Array.prototype.push.apply(nodes, _.toArray(e));
                        }
                        else {
                            nodes.push(typeof e === 'string' ? document.createTextNode(e) : e);
                        }
                    });
                });
                _.each(this, function (el, j) {
                    var clone = j < _this.length - 1;
                    _.each(nodes, function (n) {
                        el.appendChild(clone ? n.cloneNode(true) : n);
                    });
                });
                return this;
            },
            toArray: function () {
                return _.toArray(this);
            }
        };
        // element chaining
        _.map({
            blur: function (el) {
                el.blur();
            },
            focus: function (el) {
                el.focus();
            },
            css: function (el, propertyName, value) {
                el.style[propertyName] = value;
            },
            remove: function (el) {
                subTreeRemoveData(el);
                var parent = el.parentNode;
                if (parent)
                    parent.removeChild(el);
            },
            addClass: function (el, className) {
                el.className = _.union(_.words(el.className), _.words(className)).join(' ');
            },
            removeClass: function (el, className) {
                el.className = className ? _.difference(_.words(el.className), _.words(className)).join(' ') : '';
            },
            attr: function (el, attributeName, value) {
                el.setAttribute(attributeName, value);
            },
            removeAttr: function (el, attributeName) {
                el.removeAttribute(attributeName);
            },
            on: function (el, type, fn) {
                var store = getElementStore(el), events = store.events, handler = store.handler;
                if (!handler)
                    handler = store.handler = createEventHandler(el, events);
                _.each(_.words(type), function (type) {
                    var eventFns = events[type];
                    if (!eventFns) {
                        eventFns = events[type] = [];
                        addEventListenerFn(el, type, handler);
                    }
                    eventFns.push(fn);
                });
            },
            off: elementOff
        }, function (method, name) {
            MicroEl.prototype[name] = function (arg1, arg2) {
                return _.each(this, function (el) {
                    method(el, arg1, arg2);
                });
            };
        });
        var microJQ = function (arg) {
            return new MicroEl(_.isArray(arg) ? arg : [arg]);
        };
        microJQ.ready = (function () {
            var promise = document.readyState === 'complete' ? MathUI.Promise.resolve() : new MathUI.Promise(function (resolve) {
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
        // http://stackoverflow.com/a/7951947/212069
        microJQ.parseXML = typeof DOMParser === 'function' ? function (data) { return (new DOMParser()).parseFromString(data, 'text/xml'); } : typeof ActiveXObject === 'function' && new ActiveXObject('Microsoft.XMLDOM') ? function (data) {
            var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = 'false';
            xmlDoc.loadXML(data);
            return xmlDoc;
        } : function () {
            throw new Error('parseXML not supported');
        };
        // http://stackoverflow.com/a/4916895/212069
        /*microJQ.serializeXML = typeof XMLSerializer === 'function'
            ? (n: Node) => (new XMLSerializer()).serializeToString(n)
            : (n: Node) => {
                if (!('xml' in n)) throw new Error('serializeXML not supported');
                return (<any> n).xml;
            };*/
        return microJQ;
    })(window, document);
})(MathUI || (MathUI = {}));
/// <reference path="math-ui-microjq.ts" />
/// <reference path="math-ui-utils.ts" />
/// <reference path="../../typings/jquery.d.ts" />
// declare var ClipboardEvent: any;
var MathUI;
(function (MathUI) {
    'use strict';
    var $ = MathUI.microJQ;
    var _ = MathUI.getUtils();
    MathUI.getQueryLib = function () { return $; };
    var Handler = (function () {
        function Handler() {
        }
        Handler.prototype.canHandle = function (el) {
            return false; // disable auto-discover by default
        };
        Handler.prototype.init = function (el) {
            return null;
        };
        Handler.prototype.clonePresentation = function (from, to) {
            $(to).append($(from).contents().clone());
        };
        Handler.prototype.getSources = function (el) {
            return MathUI.Promise.resolve([]);
        };
        return Handler;
    })();
    MathUI.Handler = Handler;
    var HandlerStore = (function () {
        function HandlerStore() {
            this.handlerDict = {};
            this.handlerOrder = [];
        }
        HandlerStore.prototype.put = function (type, handler) {
            var previous = this.remove(type);
            this.handlerDict[type] = handler;
            this.handlerOrder.splice(0, 0, type);
            return previous;
        };
        HandlerStore.prototype.get = function (type) {
            return this.handlerDict[type];
        };
        HandlerStore.prototype.remove = function (type) {
            if (type in this.handlerDict) {
                var k = _.indexOf(this.handlerOrder, type);
                if (k >= 0)
                    this.handlerOrder.splice(k, 1);
                delete this.handlerDict[type];
            }
            return null;
        };
        HandlerStore.prototype.find = function (fn) {
            for (var k = 0; k < this.handlerOrder.length; k++) {
                var handler = this.handlerDict[this.handlerOrder[k]];
                if (fn(handler))
                    return handler;
            }
        };
        return HandlerStore;
    })();
    var handlerStore = new HandlerStore();
    var MathItem = (function () {
        function MathItem(element, container) {
            this.element = element;
            this.container = container;
            var el = $(element), index = ++MathItem.idCounter, type = el.data('type'), handler = handlerStore.get(type) || handlerStore.find(function (handler) { return handler.canHandle(element); });
            if (!handler)
                throw Error('MathUI: No matching handler');
            this.id = 'math-ui-element-' + index;
            this.name = 'Equation ' + (index + 1);
            this.handler = handler;
            el.attr('id', this.id).attr('tabindex', 0).attr('role', 'math');
        }
        MathItem.prototype.initHandler = function () {
            return this.handler.init(this.element);
        };
        MathItem.prototype.clonePresentation = function (to) {
            this.handler.clonePresentation(this.element, to[0]);
        };
        MathItem.prototype.getSources = function () {
            return this.handler.getSources(this.element);
        };
        MathItem.idCounter = 0;
        return MathItem;
    })();
    MathUI.MathItem = MathItem;
    MathUI.prettifyMathML = (function () {
        var mathml_token_elements = ['mi', 'mn', 'mo', 'ms', 'mtext', 'ci', 'cn', 'cs', 'csymbol', 'annotation'];
        function tagToString(n, inner, indent) {
            var name = n.nodeName.toLowerCase();
            var ret = '<' + name + _.map(n.attributes, function (attr) { return ' ' + attr.name + '="' + attr.value + '"'; }).join('');
            if (indent)
                ret = indent + ret;
            return inner ? ret + '>' + inner + '</' + name + '>' : ret + ' />';
        }
        function serializeInner(n) {
            return _.map($(n).contents(), function (c) { return serializeNode(c); }).join('');
        }
        function serializeNode(n) {
            switch (n.nodeType) {
                case 1:
                    return tagToString(n, serializeInner(n));
                case 3:
                    return n.nodeValue;
                case 8:
                    return '<!--' + n.nodeValue + '-->';
            }
            return '';
        }
        function prettifyElement(el, indent) {
            if (el.nodeType !== 1)
                throw new Error('prettifyMathML: expected Element node');
            var name = el.nodeName.toLowerCase(), inner = '';
            if (_.contains(mathml_token_elements, name)) {
                inner = _.words(serializeInner(el)).join(' ');
            }
            else {
                var items = _.map($(el).children(), function (c) { return prettifyElement(c, indent + '  '); });
                if (items)
                    inner = '\n' + items.join('\n') + '\n' + indent;
            }
            return tagToString(el, inner, indent);
        }
        return function (el) { return prettifyElement(el, ''); };
    })();
    function registerHandler(type, handler) {
        return handlerStore.put(type, handler);
    }
    MathUI.registerHandler = registerHandler;
    var MathItemContainer = (function () {
        function MathItemContainer() {
            this.itemDict = {};
            this.highlighted = false;
        }
        MathItemContainer.prototype.addOne = function (element) {
            var mathItem = new MathItem(element, this), renderPromise = mathItem.initHandler();
            this.itemDict[mathItem.id] = mathItem;
            this.init(mathItem);
            return renderPromise;
        };
        MathItemContainer.prototype.add = function (arg) {
            var _this = this;
            if (_.isArray(arg)) {
                var promises = [];
                _.each(arg, function (element) {
                    var promise = _this.addOne(element);
                    if (promise)
                        promises.push(promise);
                });
                return MathUI.Promise.all(promises);
            }
            return this.addOne(arg);
        };
        MathItemContainer.prototype.highlightAll = function () {
            var on = this.highlighted = !this.highlighted;
            _.each(this.itemDict, function (mathItem) {
                var el = $(mathItem.element);
                on ? el.addClass('highlight') : el.removeClass('highlight');
            });
        };
        MathItemContainer.prototype.init = function (mathItem) {
        };
        MathItemContainer.prototype.showDashboard = function () {
        };
        return MathItemContainer;
    })();
    MathUI.MathItemContainer = MathItemContainer;
    var queryLibReadyQueue = [];
    function queryLibReady(callback) {
        if (queryLibReadyQueue === undefined)
            callback($);
        queryLibReadyQueue.push(callback);
    }
    MathUI.queryLibReady = queryLibReady;
    var qlibNotifyDone = MathUI.makePromiseWithResolver();
    MathUI.microJQ.ready().then(function () {
        if ('jQuery' in window && jQuery.fn.on)
            $ = jQuery;
        _.each(queryLibReadyQueue, function (callback) {
            callback($);
        });
        queryLibReadyQueue = undefined;
        qlibNotifyDone.resolve();
    });
    function start(container) {
        var result = {
            wrap: MathUI.makePromiseWithResolver(),
            render: MathUI.makePromiseWithResolver()
        };
        // first wait until handlers etc. have the queryLib variable
        qlibNotifyDone.then(function () {
            var elements = $(document).find('.math-ui').toArray();
            container.add(elements).then(function () {
                result.render.resolve();
            });
            result.wrap.resolve();
        });
        return result;
    }
    MathUI.start = start;
})(MathUI || (MathUI = {}));
/// <reference path="math-ui-core.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// Built-in extensions
var MathUI;
(function (MathUI) {
    'use strict';
    var $ = MathUI.microJQ, _ = MathUI.getUtils();
    MathUI.queryLibReady(function (qlib) { return $ = qlib; });
    var PlainHandler = (function (_super) {
        __extends(PlainHandler, _super);
        function PlainHandler() {
            _super.apply(this, arguments);
        }
        PlainHandler.prototype.canHandle = function (el) {
            return true; // act as a catch-all
        };
        PlainHandler.prototype.getSources = function (el) {
            return MathUI.Promise.resolve([{ type: 'HTML', source: el.innerHTML }]);
        };
        return PlainHandler;
    })(MathUI.Handler);
    var MathMLHandler = (function (_super) {
        __extends(MathMLHandler, _super);
        function MathMLHandler() {
            _super.apply(this, arguments);
        }
        MathMLHandler.getMathRoot = function (el) {
            var children = $(el).children();
            if (children.length === 1 && children[0].nodeName.toLowerCase() === 'math')
                return children[0];
            if (children.length && children[0] instanceof HTMLUnknownElement) {
                var doc = $.parseXML(el.innerHTML);
                if (doc.documentElement && doc.documentElement.nodeName.toLowerCase() === 'math')
                    return doc.documentElement;
            }
            return null;
        };
        MathMLHandler.prototype.canHandle = function (el) {
            return MathMLHandler.getMathRoot(el) !== null;
        };
        MathMLHandler.prototype.getSources = function (el) {
            var root = MathMLHandler.getMathRoot(el);
            if (root === null)
                return MathUI.Promise.resolve([]);
            return MathUI.Promise.resolve([
                { type: 'MathML', subtype: 'original', source: el.innerHTML },
                { type: 'MathML', subtype: 'prettified', source: MathUI.prettifyMathML(root) }
            ]);
        };
        return MathMLHandler;
    })(MathUI.Handler);
    MathUI.registerHandler('plain-html', new PlainHandler());
    MathUI.registerHandler('native-mathml', new MathMLHandler());
})(MathUI || (MathUI = {}));
// MathJax extensions
var MathUI;
(function (MathUI) {
    'use strict';
    var $ = MathUI.microJQ;
    MathUI.queryLibReady(function (qlib) { return $ = qlib; });
    var MathJaxHandler = (function (_super) {
        __extends(MathJaxHandler, _super);
        function MathJaxHandler(original, internal) {
            _super.call(this);
            this.original = original;
            this.internal = internal;
        }
        MathJaxHandler.prototype.init = function (el) {
            var resolver, p = new MathUI.Promise(function (resolve) {
                resolver = resolve;
            });
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, el], resolver);
            return p;
        };
        MathJaxHandler.prototype.clonePresentation = function (from, to) {
            var script = $(from).find('script[type]');
            $(to).append(script.clone().removeAttr('id').removeAttr('MathJax'));
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, to]);
        };
        MathJaxHandler.prototype.getSources = function (el) {
            var result = [];
            var jaxs = MathJax.Hub.getAllJax(el);
            if (jaxs && jaxs.length === 1) {
                var jax = jaxs[0];
                result.push({ type: this.original[0], subtype: this.original[1], source: jax.originalText });
                if (jax.root.toMathML) {
                    result.push({ type: this.internal[0], subtype: this.internal[1], source: '' });
                    return new MathUI.Promise(function (resolve) {
                        function getMathML() {
                            try {
                                result[1].source = jax.root.toMathML('');
                                resolve(result);
                            }
                            catch (err) {
                                // to trigger: https://groups.google.com/d/msg/mathjax-dev/ZYirx681dv0/RWspFIVwA2AJ
                                if (!err.restart) {
                                    throw err;
                                }
                                MathJax.Callback.After(getMathML, err.restart);
                            }
                        }
                        getMathML();
                    });
                }
            }
            return MathUI.Promise.resolve(result);
        };
        return MathJaxHandler;
    })(MathUI.Handler);
    MathUI.registerHandler('tex', new MathJaxHandler(['TeX', 'original'], ['MathML', 'MathJax']));
    MathUI.registerHandler('mml', new MathJaxHandler(['MathML', 'original'], ['MathML', 'MathJax']));
})(MathUI || (MathUI = {}));
// EqnStore extension
var MathUI;
(function (MathUI) {
    'use strict';
    var $ = MathUI.microJQ;
    MathUI.queryLibReady(function (qlib) { return $ = qlib; });
    var EqnStoreHandler = (function (_super) {
        __extends(EqnStoreHandler, _super);
        function EqnStoreHandler() {
            _super.apply(this, arguments);
        }
        /*init(el: HTMLElement): Promise<void> {
            var imgs = $(el).find('img');
            if (imgs.length === 1) {
                var img = <HTMLImageElement> imgs[0];
                if (!img.complete) {
                    return new Promise<void>((resolve: () => void, reject: () => void) => {
                        $(img).on('load', () => { resolve(); }).on('error', () => { reject(); });
                    });
                }
            }
        }*/
        EqnStoreHandler.prototype.clonePresentation = function (from, to) {
            $(to).append($(from).find('img').clone());
        };
        EqnStoreHandler.prototype.getSources = function (el) {
            var result = [];
            var script = $(el).find('script[type="math/mml"]');
            if (script.length === 1) {
                var src = script.text(), doc = $.parseXML(src);
                result.push({
                    type: 'MathML',
                    subtype: 'original',
                    source: src
                });
                if (doc && doc.documentElement && doc.documentElement.nodeName === 'math')
                    result.push({
                        type: 'MathML',
                        subtype: 'prettified',
                        source: MathUI.prettifyMathML(doc.documentElement)
                    });
            }
            return MathUI.Promise.resolve(result);
        };
        return EqnStoreHandler;
    })(MathUI.Handler);
    MathUI.registerHandler('eqnstore', new EqnStoreHandler());
})(MathUI || (MathUI = {}));
//# sourceMappingURL=math-ui-core.js.map