(function (window, document, undefined) {
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
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }
    function forEach(array, callbackfn, thisArg) {
        for (var k = 0; k < array.length; k++) {
            callbackfn.call(thisArg, array[k], k, array);
        }
    }
    function map(array, callback, thisArg) {
        var result = [];
        for (var k = 0; k < array.length; k++)
            result.push(callback.call(thisArg, array[k], k, array));
        return result;
    }
    function objectEach(obj, callback) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                callback.call(value, key, value);
            }
        }
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
        forEach(array, function (value, i) {
            if (fn(value, i))
                result.push(value);
        });
        return result;
    }
    function spaceSplit(st) {
        return filter(st.split(' '), function (item) { return item.length !== 0; });
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
    function preventDefaultWrapper() {
        if (this.originalEvent.preventDefault)
            this.originalEvent.preventDefault();
        else
            this.originalEvent.returnValue = false;
    }
    function stopPropagationWrapper() {
        if (this.originalEvent.stopPropagation)
            this.originalEvent.stopPropagation();
        else
            this.originalEvent.cancelBubble = true;
    }
    function normalizeEvent(event) {
        function MicroJQEvent() {
            this.originalEvent = event;
            this.preventDefault = preventDefaultWrapper;
            this.stopPropagation = stopPropagationWrapper;
            this.target = event.target || event.srcElement;
            if (indexOf(KEYBOARD_EVENTS, event.type) >= 0)
                this.which = event.keyCode;
        }
        MicroJQEvent.prototype = event;
        return new MicroJQEvent();
    }
    function createEventHandler(element, events) {
        function eventHandler(event) {
            var eventFns = events[event.type];
            if (eventFns && eventFns.length) {
                var mjqevent = normalizeEvent(event);
                if (eventFns.length > 1)
                    eventFns = toArray(eventFns);
                forEach(eventFns, function (fn) {
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
            forEach(spaceSplit(type), function (type) {
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
        forEach(element.querySelectorAll('*'), function (descendant) {
            elementRemoveData(descendant);
        });
    }
    function MicroEl(els) {
        this.els = els;
    }
    MicroEl.prototype = {
        find: function (selector) {
            var matches = [];
            forEach(this.els, function (el) {
                forEach(el.querySelectorAll(selector), function (n) {
                    matches.push(n);
                });
            });
            return new MicroEl(matches);
        },
        first: function () {
            return this.els.length === 0 ? this : new MicroEl([this.els[0]]);
        },
        data: function (key) {
            return this.els[0].getAttribute('data-' + key);
        },
        get: function (index) {
            return index !== undefined ? this.els[index] : this.els;
        },
        each: function (func) {
            forEach(this.els, function (el, i) {
                func.call(el, i, el);
            });
            return this;
        },
        append: function () {
            var content = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                content[_i - 0] = arguments[_i];
            }
            var els = this.els;
            var nodes = [];
            forEach(content, function (item) {
                forEach(isArray(item) ? item : [item], function (e) {
                    var newnodes = e instanceof MicroEl ? e.els : typeof e === 'string' ? document.createTextNode(e) : e;
                    nodes = nodes.concat(newnodes);
                });
            });
            forEach(els, function (el, j) {
                var clone = j < els.length - 1;
                forEach(nodes, function (n) {
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
            var classes = spaceSplit(el.className);
            forEach(spaceSplit(className), function (newClass) {
                if (indexOf(classes, newClass) < 0)
                    classes.push(newClass);
            });
            el.className = classes.join(' ');
        },
        removeClass: function (el, className) {
            if (className) {
                var classes = spaceSplit(el.className);
                forEach(spaceSplit(className), function (removeClass) {
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
            forEach(spaceSplit(type), function (type) {
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
            forEach(this.els, function (el) {
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
    microJQ.forEach = forEach;
    microJQ.map = map;
    microJQ.indexOf = indexOf;
    window.microJQ = microJQ;
})(window, document);
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
    function create(tagName) {
        return document.createElement(tagName);
    }
    function stopEvent(event) {
        event.stopPropagation();
        event.preventDefault();
    }
    var Dialog = (function () {
        function Dialog() {
        }
        Dialog.prototype.show = function () {
            var _this = this;
            var wrapper = $(create('div')).addClass('math-ui-wrapper'), dialog = $(create('div')).addClass('math-ui-dialog').append(wrapper);
            this.backdrop = $(create('div')).addClass('math-ui-backdrop').append(dialog);
            this.prepareDialog(dialog, wrapper);
            this.documentHandler = function (event) {
                if (event.type === 'click' || event.which === 27) {
                    console.log('doc click', event);
                    stopEvent(event);
                    _this.close();
                }
            };
            $(document.body).append(this.backdrop);
            $(document).on('click keydown', this.documentHandler);
            dialog.css('height', wrapper.get(0).offsetHeight + 'px').on('click', function (event) {
                stopEvent(event);
                _this.click(event);
            });
        };
        Dialog.prototype.close = function () {
            $(document).off('click keydown', this.documentHandler);
            this.backdrop.remove();
            this.backdrop = this.documentHandler = undefined;
        };
        Dialog.prototype.prepareDialog = function (dialog, container) {
        };
        Dialog.prototype.click = function (event) {
        };
        return Dialog;
    })();
    function niy(name) {
        alert(name + ' not implemented yet');
    }
    var DashboardDialog = (function (_super) {
        __extends(DashboardDialog, _super);
        function DashboardDialog() {
            _super.apply(this, arguments);
        }
        DashboardDialog.prototype.prepareDialog = function (dialog, container) {
            dialog.addClass('math-ui-dashboard');
            this.buttons = $(microJQ.map(DashboardDialog.dashboardItems, function () { return create('button'); })).each(function (k, el) {
                $(el).append(DashboardDialog.dashboardItems[k].label);
            });
            container.append($(create('div')).addClass('math-ui-header').append('MathUI Dashboard'), $(create('div')).addClass('math-ui-content').append(this.buttons));
        };
        DashboardDialog.prototype.show = function () {
            _super.prototype.show.call(this);
            this.buttons.first().focus();
        };
        DashboardDialog.prototype.click = function (event) {
            var nr = microJQ.indexOf(this.buttons.get(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardItems.length) {
                this.close();
                DashboardDialog.dashboardItems[nr].action(DashboardDialog.dashboardItems[nr].label);
            }
        };
        DashboardDialog.dashboardItems = [
            { label: 'Highlight All Equations', action: niy },
            { label: 'Action 2', action: niy },
            { label: 'Action 3', action: niy },
            { label: 'Action 4', action: niy }
        ];
        return DashboardDialog;
    })(Dialog);
    function showDashboard() {
        var dialog = new DashboardDialog();
        dialog.show();
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
        var selectedIndex, triggerSelected = function () {
            el.blur();
            menuItems[selectedIndex].action(el.get(0));
        }, buttons = $(microJQ.map(menuItems, function () { return create('span'); })).addClass('math-ui-item'), menu = $(create('div')).addClass('math-ui-eqn-menu').append($(create('span')).addClass('math-ui-header').append('Equation ?'), $(create('span')).addClass('math-ui-container').append(buttons)), updateSelected = function (index) {
            selectedIndex = index;
            buttons.removeClass('math-ui-selected');
            $(buttons.get(index)).addClass('math-ui-selected');
        }, onkeydown = function (ev) {
            switch (ev.which) {
                case 13:
                    ev.preventDefault();
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
        buttons.each(function (k, el) {
            $(el).append(menuItems[k].label).on('mousedown', function () {
                updateSelected(k);
                triggerSelected();
            });
        });
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