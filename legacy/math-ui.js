window.microJQ = (function () {
    'use strict';
    var KEYBOARD_EVENTS = ['keydown', 'keyup', 'keypress'];
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
    function indexOf(array, item) {
        if (array.indexOf)
            return array.indexOf(item);
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }
    function arrayEach(array, callback) {
        for (var k = 0; k < array.length; k++) {
            var item = array[k];
            callback.call(item, k, item);
        }
    }
    function objectEach(obj, callback) {
        var key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                callback.call(value, key, value);
            }
        }
    }
    function map(array, callback) {
        var result = [];
        for (var k = 0; k < array.length; k++)
            result.push(callback(array[k], k));
        return result;
    }
    function toArray(array) {
        return map(array, function (item) { return item; });
    }
    function arrayRemove(array, elem) {
        var idx = indexOf(array, elem);
        if (idx >= 0)
            array.splice(idx, 1);
    }
    function filter(array, fn) {
        var result = [];
        arrayEach(array, function (i, value) {
            if (fn(value, i))
                result.push(value);
        });
        return result;
    }
    function spaceSplit(st) {
        return filter(st.split(' '), function (item) { return item.length != 0; });
    }
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
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
    function normalizeEvent(event) {
        var mjqevent = event;
        if (indexOf(KEYBOARD_EVENTS, event.type) >= 0) {
            mjqevent.which = mjqevent.keyCode;
        }
        return mjqevent;
    }
    function createEventHandler(element, events) {
        function eventHandler(event) {
            var eventFns = events[event.type];
            if (eventFns && eventFns.length) {
                var mjqevent = normalizeEvent(event);
                if (eventFns.length > 1)
                    eventFns = toArray(eventFns);
                arrayEach(eventFns, function (i, fn) {
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
            arrayEach(spaceSplit(type), function (i, type) {
                if (fn) {
                    var listeners = events[type];
                    if (listeners) {
                        arrayRemove(listeners, fn);
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
        arrayEach(element.querySelectorAll('*'), function (i, descendant) {
            elementRemoveData(descendant);
        });
    }
    function MicroEl(els) {
        this.els = els;
    }
    MicroEl.prototype = {
        find: function (selector) {
            return new MicroEl(toArray(document.querySelectorAll(selector)));
        },
        data: function (key) {
            return this.els[0].getAttribute('data-' + key);
        },
        get: function (index) {
            return this.els[index];
        },
        each: function (func) {
            arrayEach(this.els, func);
            return this;
        },
        append: function () {
            var content = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                content[_i - 0] = arguments[_i];
            }
            var els = this.els;
            var nodes = [];
            arrayEach(content, function (i, item) {
                arrayEach(isArray(item) ? item : [item], function (j, e) {
                    var newnodes = e instanceof MicroEl ? e.els : typeof e === 'string' ? document.createTextNode(e) : e;
                    nodes = nodes.concat(newnodes);
                });
            });
            arrayEach(els, function (j, el) {
                var clone = j < els.length - 1;
                arrayEach(nodes, function (k, n) {
                    el.appendChild(clone ? n.cloneNode() : n);
                });
            });
            return this;
        }
    };
    objectEach({
        blur: function (el) {
            el.blur();
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
            var classes = spaceSplit(el.className);
            arrayEach(spaceSplit(className), function (j, newClass) {
                if (indexOf(classes, newClass) < 0)
                    classes.push(newClass);
            });
            el.className = classes.join(' ');
        },
        removeClass: function (el, className) {
            if (className) {
                var classes = spaceSplit(el.className);
                arrayEach(spaceSplit(className), function (j, removeClass) {
                    arrayRemove(classes, removeClass);
                });
                el.className = classes.join(' ');
            }
            else
                el.className = '';
        },
        attr: function (el, attributeName, value) {
            el.setAttribute(attributeName, value);
        },
        on: function (el, type, fn) {
            var store = getElementStore(el);
            var events = store.events;
            var handler = store.handler;
            if (!handler)
                handler = store.handler = createEventHandler(el, events);
            arrayEach(spaceSplit(type), function (i, type) {
                var eventFns = events[type];
                if (!eventFns) {
                    eventFns = events[type] = [];
                    addEventListenerFn(el, type, handler);
                }
                eventFns.push(fn);
            });
        },
        off: elementOff
    }, function (name, method) {
        MicroEl.prototype[name] = function (arg1, arg2) {
            arrayEach(this.els, function (i, el) {
                method(el, arg1, arg2);
            });
            return this;
        };
    });
    var microJQ = function (arg) {
        return new MicroEl(isArray(arg) ? arg : [arg]);
    };
    microJQ.ready = function (fn) {
        var fired = false;
        function trigger() {
            if (fired)
                return;
            fired = true;
            fn();
        }
        if (document.readyState === 'complete') {
            setTimeout(trigger);
        }
        else {
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
        }
    };
    microJQ.each = arrayEach;
    microJQ.map = map;
    microJQ.isArray = isArray;
    return microJQ;
})();
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MathUI;
(function (MathUI) {
    'use strict';
    var $;
    var PlainHandler = (function () {
        function PlainHandler() {
        }
        PlainHandler.prototype.init = function (el) {
        };
        return PlainHandler;
    })();
    var MathMLHandler = (function () {
        function MathMLHandler() {
        }
        MathMLHandler.prototype.init = function (el) {
        };
        return MathMLHandler;
    })();
    var handlers = {
        'plain-html': new PlainHandler(),
        'native-mathml': new MathMLHandler()
    };
    function createElem(tagName, count) {
        count = count || 1;
        var els = [];
        while (count-- > 0)
            els.push(document.createElement(tagName));
        return $(els);
    }
    function showDashboard() {
        alert('Dashboard');
    }
    MathUI.showDashboard = showDashboard;
    function zoomAction(el) {
        alert('zoom');
    }
    function sourceAction(el) {
        alert('source');
    }
    function searchAction(el) {
        alert('search');
    }
    function shareAction(el) {
        alert('share');
    }
    var menuItems = [
        { label: 'Zoom', action: zoomAction },
        { label: 'Source', action: sourceAction },
        { label: 'Search', action: searchAction },
        { label: 'Share', action: shareAction },
        { label: 'Dashboard', action: showDashboard }
    ];
    function elementGotFocus(el) {
        var selectedIndex, buttons = createElem('span', menuItems.length).addClass('math-ui-item').each(function (k, el) {
            $(el).append(menuItems[k].label).on('mousedown', function () {
                updateSelected(k);
                triggerSelected();
            });
        }), menu = createElem('div').addClass('math-ui-eqn-menu').append(createElem('span').addClass('math-ui-header').append('Equation ?'), createElem('span').addClass('math-ui-container').append(buttons)), updateSelected = function (index) {
            selectedIndex = index;
            buttons.removeClass('math-ui-selected');
            $(buttons.get(index)).addClass('math-ui-selected');
        }, triggerSelected = function () {
            el.blur();
            menuItems[selectedIndex].action(el.get(0));
        }, onkeydown = function (ev) {
            switch (ev.which) {
                case 13:
                    triggerSelected();
                    break;
                case 27:
                    el.blur();
                    break;
                case 37:
                    updateSelected((selectedIndex + menuItems.length - 1) % menuItems.length);
                    break;
                case 39:
                    updateSelected((selectedIndex + 1) % menuItems.length);
                    break;
            }
        }, onblur = function () {
            menu.remove();
            el.off('keydown', onkeydown).off('blur', onblur);
        };
        el.append(menu).on('blur', onblur).on('keydown', onkeydown);
        updateSelected(0);
        menu.css('top', (el.get(0).offsetHeight - 3) + 'px');
    }
    function elementReady(el) {
        var type = el.data('type');
        if (type && type in handlers) {
            var handler = handlers[type];
            handler.init(el.get(0));
        }
        el.attr('tabindex', 0).on('focus', function () { return elementGotFocus(el); });
    }
    function registerHandler(type, handler) {
        handlers[type] = handler;
    }
    MathUI.registerHandler = registerHandler;
    microJQ.ready(function () {
        $ = ('jQuery' in window && jQuery.fn.on) ? jQuery : microJQ;
        $(document).find('.math-ui').each(function () {
            elementReady($(this));
        });
    });
})(MathUI || (MathUI = {}));
var MathJaxHandler = (function () {
    function MathJaxHandler() {
    }
    MathJaxHandler.prototype.init = function (el) {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
    };
    return MathJaxHandler;
})();
var MathJaxTexHandler = (function (_super) {
    __extends(MathJaxTexHandler, _super);
    function MathJaxTexHandler() {
        _super.apply(this, arguments);
    }
    return MathJaxTexHandler;
})(MathJaxHandler);
MathUI.registerHandler('tex', new MathJaxTexHandler());
var MathJaxMathMLHandler = (function (_super) {
    __extends(MathJaxMathMLHandler, _super);
    function MathJaxMathMLHandler() {
        _super.apply(this, arguments);
    }
    return MathJaxMathMLHandler;
})(MathJaxHandler);
MathUI.registerHandler('mml', new MathJaxMathMLHandler());
//# sourceMappingURL=math-ui.js.map