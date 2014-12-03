(function (window, document, undefined) {
    'use strict';
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
    var MicroJQEvent = (function () {
        function MicroJQEvent(event) {
            this.originalEvent = event;
            this.type = event.type;
            this.target = event.target || event.srcElement;
            this.which = event.which || event.keyCode;
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
        contents: function () {
            var matches = [];
            forEach(this.els, function (el) {
                var child = el.firstChild;
                while (child != null) {
                    matches.push(child);
                    child = child.nextSibling;
                }
            });
            return new MicroEl(matches);
        },
        clone: function () {
            return new MicroEl(map(this.els, function (el) { return el.cloneNode(true); }));
        },
        first: function () {
            return this.els.length === 0 ? this : new MicroEl([this.els[0]]);
        },
        attr: function (name, value) {
            if (value === undefined)
                return this.els[0].getAttribute(name);
            else {
                this.each(function (k, el) {
                    el.setAttribute(name, value);
                });
                return this;
            }
        },
        data: function (key) {
            return this.els[0].getAttribute('data-' + key);
        },
        width: function () {
            var br = this.els[0].getBoundingClientRect();
            return br.width !== undefined ? br.width : (br.right - br.left);
        },
        height: function () {
            var br = this.els[0].getBoundingClientRect();
            return br.height !== undefined ? br.height : (br.bottom - br.top);
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
        removeAttr: function (el, attributeName) {
            el.removeAttribute(attributeName);
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
    microJQ.objectEach = objectEach;
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
    MathUI.$ = microJQ;
    var Handler = (function () {
        function Handler() {
        }
        Handler.prototype.init = function (el) {
        };
        Handler.prototype.clonePresentation = function (from, to) {
            MathUI.$(to).append(MathUI.$(from).contents().clone());
        };
        return Handler;
    })();
    MathUI.Handler = Handler;
    var mathUIElements = {};
    var highlighted = false;
    var PlainHandler = (function (_super) {
        __extends(PlainHandler, _super);
        function PlainHandler() {
            _super.apply(this, arguments);
        }
        return PlainHandler;
    })(Handler);
    var MathMLHandler = (function (_super) {
        __extends(MathMLHandler, _super);
        function MathMLHandler() {
            _super.apply(this, arguments);
        }
        return MathMLHandler;
    })(Handler);
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
        Dialog.prototype.show = function (className, parent) {
            var _this = this;
            parent = parent || document.body;
            this.wrapper = MathUI.$(create('div')).addClass('math-ui-wrapper');
            this.dialog = MathUI.$(create('div')).addClass(className).append(this.wrapper);
            this.element = parent === document.body ? MathUI.$(create('div')).addClass('math-ui-backdrop').append(this.dialog) : this.dialog;
            this.prepareDialog(this.wrapper);
            this.documentHandler = function (event) {
                if (event.type === 'click' || event.which === 27) {
                    stopEvent(event);
                    _this.close();
                }
            };
            MathUI.$(parent).append(this.element);
            MathUI.$(document).on('click keydown', this.documentHandler);
            this.dialog.on('click', function (event) {
                stopEvent(event);
                _this.click(event);
            });
        };
        Dialog.prototype.close = function () {
            MathUI.$(document).off('click keydown', this.documentHandler);
            this.element.remove();
            this.element = this.documentHandler = undefined;
        };
        Dialog.prototype.fitContentWidth = function () {
            this.dialog.css('width', this.wrapper.width() + 'px');
        };
        Dialog.prototype.fitContentHeight = function () {
            this.dialog.css('height', this.wrapper.height() + 'px');
        };
        Dialog.prototype.prepareDialog = function (container) {
        };
        Dialog.prototype.click = function (event) {
        };
        return Dialog;
    })();
    var ZoomDialog = (function (_super) {
        __extends(ZoomDialog, _super);
        function ZoomDialog(host) {
            _super.call(this);
            this.host = host;
        }
        ZoomDialog.prototype.prepareDialog = function (container) {
            this.host.clonePresentation(container);
        };
        ZoomDialog.prototype.show = function () {
            _super.prototype.show.call(this, 'math-ui-zoom', this.host.element);
        };
        ZoomDialog.prototype.click = function () {
            this.close();
        };
        return ZoomDialog;
    })(Dialog);
    var SourceDialog = (function (_super) {
        __extends(SourceDialog, _super);
        function SourceDialog(host) {
            _super.call(this);
            this.host = host;
        }
        SourceDialog.prototype.prepareDialog = function (container) {
            var pre = MathUI.$(create('pre'));
            this.host.appendSource(pre);
            container.append(MathUI.$(create('div')).addClass('math-ui-header').append('MathUI Dashboard'), MathUI.$(create('div')).addClass('math-ui-content').append(pre));
        };
        SourceDialog.prototype.show = function () {
            _super.prototype.show.call(this, 'math-ui-dialog math-ui-source');
            this.fitContentHeight();
        };
        SourceDialog.prototype.click = function () {
        };
        return SourceDialog;
    })(Dialog);
    var MathUIElement = (function () {
        function MathUIElement(element, index) {
            this.element = element;
            var type = MathUI.$(element).data('type');
            if (!(type && type in handlers))
                type = 'plain-html';
            this.name = 'Equation ' + (index + 1);
            this.handler = handlers[type];
            this.handler.init(element);
        }
        MathUIElement.prototype.clonePresentation = function (to) {
            this.handler.clonePresentation(this.element, to.get(0));
        };
        MathUIElement.prototype.appendSource = function (container) {
            container.append(MathUI.$(create('pre')).append('some\nlines'));
        };
        MathUIElement.prototype.changeHighlight = function (on) {
            var el = MathUI.$(this.element);
            on ? el.addClass('highlight') : el.removeClass('highlight');
        };
        MathUIElement.prototype.zoomAction = function () {
            var dialog = new ZoomDialog(this);
            dialog.show();
        };
        MathUIElement.prototype.sourceAction = function () {
            var dialog = new SourceDialog(this);
            dialog.show();
        };
        MathUIElement.prototype.gotFocus = function () {
            var _this = this;
            var el = MathUI.$(this.element);
            var selectedIndex, triggerSelected = function () {
                el.blur();
                setTimeout(function () {
                    MathUIElement.menuItems[selectedIndex].action.call(_this);
                });
            }, buttons = MathUI.$(microJQ.map(MathUIElement.menuItems, function () { return create('span'); })).addClass('math-ui-item'), menu = MathUI.$(create('div')).addClass('math-ui-eqn-menu').append(MathUI.$(create('span')).addClass('math-ui-header').append(this.name), MathUI.$(create('span')).addClass('math-ui-container').append(buttons)), updateSelected = function (index) {
                selectedIndex = index;
                buttons.removeClass('math-ui-selected');
                MathUI.$(buttons.get(index)).addClass('math-ui-selected');
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
                        updateSelected((selectedIndex + MathUIElement.menuItems.length - 1) % MathUIElement.menuItems.length);
                        break;
                    case 39:
                        updateSelected((selectedIndex + 1) % MathUIElement.menuItems.length);
                        break;
                }
            }, onblur = function () {
                menu.remove();
                el.off('keydown', onkeydown).off('blur', onblur);
            };
            buttons.each(function (k, btn) {
                MathUI.$(btn).append(MathUIElement.menuItems[k].label).on('mousedown', function (event) {
                    stopEvent(event);
                    updateSelected(k);
                    triggerSelected();
                });
            });
            el.append(menu).on('keydown', onkeydown).on('blur', onblur);
            updateSelected(0);
            menu.css('top', (el.get(0).offsetHeight - 3) + 'px');
        };
        MathUIElement.menuItems = [
            { label: 'Zoom', action: MathUIElement.prototype.zoomAction },
            { label: 'Source', action: MathUIElement.prototype.sourceAction },
            { label: 'Search', action: function () {
                alert('search');
            } },
            { label: 'Share', action: function () {
                alert('share');
            } },
            { label: 'Dashboard', action: showDashboard }
        ];
        return MathUIElement;
    })();
    function highlightAllEquations() {
        highlighted = !highlighted;
        microJQ.objectEach(mathUIElements, function (id, mathUIElement) {
            mathUIElement.changeHighlight(highlighted);
        });
    }
    var DashboardDialog = (function (_super) {
        __extends(DashboardDialog, _super);
        function DashboardDialog() {
            _super.apply(this, arguments);
        }
        DashboardDialog.prototype.prepareDialog = function (container) {
            this.buttons = MathUI.$(microJQ.map(DashboardDialog.dashboardItems, function () { return create('button'); })).each(function (k, el) {
                MathUI.$(el).append(DashboardDialog.dashboardItems[k].label);
            });
            container.append(MathUI.$(create('div')).addClass('math-ui-header').append('MathUI Dashboard'), MathUI.$(create('div')).addClass('math-ui-content').append(this.buttons));
        };
        DashboardDialog.prototype.show = function () {
            _super.prototype.show.call(this, 'math-ui-dialog math-ui-dashboard');
            this.fitContentHeight();
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
            { label: 'Highlight All Equations', action: highlightAllEquations },
            { label: 'About MathUI', action: function () {
                alert('About MathUI');
            } },
            { label: 'Action 3', action: function () {
                alert('Action 3 not implemented');
            } },
            { label: 'Action 4', action: function () {
                alert('Action 4 not implemented');
            } }
        ];
        return DashboardDialog;
    })(Dialog);
    function showDashboard() {
        var dialog = new DashboardDialog();
        dialog.show();
    }
    MathUI.showDashboard = showDashboard;
    function elementReady(k, element) {
        var id = 'math-ui-element-' + k;
        var mathUIElement = mathUIElements[id] = new MathUIElement(element, k);
        MathUI.$(element).attr('id', id).attr('tabindex', 0).on('focus', function () {
            mathUIElement.gotFocus();
        });
    }
    function registerHandler(type, handler) {
        handlers[type] = handler;
    }
    MathUI.registerHandler = registerHandler;
    microJQ.ready(function () {
        if ('jQuery' in window && jQuery.fn.on)
            MathUI.$ = jQuery;
        MathUI.$(document).find('.math-ui').each(elementReady);
    });
})(MathUI || (MathUI = {}));
var MathJaxHandler = (function (_super) {
    __extends(MathJaxHandler, _super);
    function MathJaxHandler() {
        _super.apply(this, arguments);
    }
    MathJaxHandler.prototype.init = function (el) {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
    };
    MathJaxHandler.prototype.clonePresentation = function (from, to) {
        var fromscript = from.querySelector('script[type]'), toscript = document.createElement('script');
        if (!fromscript)
            return;
        if (fromscript.textContent !== undefined)
            toscript.textContent = fromscript.textContent;
        else
            toscript.text = fromscript.text;
        toscript.setAttribute('type', fromscript.getAttribute('type'));
        to.appendChild(toscript);
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, to]);
    };
    return MathJaxHandler;
})(MathUI.Handler);
MathUI.registerHandler('tex', new MathJaxHandler());
MathUI.registerHandler('mml', new MathJaxHandler());
//# sourceMappingURL=math-ui.js.map