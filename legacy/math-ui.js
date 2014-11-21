
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener
(function () {
    if (!Event.prototype.preventDefault) {
        Event.prototype.preventDefault = function () {
            this.returnValue = false;
        };
    }
    if (!Event.prototype.stopPropagation) {
        Event.prototype.stopPropagation = function () {
            this.cancelBubble = true;
        };
    }
    if (!Element.prototype.addEventListener) {
        var eventListeners = [];

        var addEventListener = function (type, listener /*, useCapture (will be ignored) */ ) {
            var self = this;
            var wrapper = function (e) {
                e.target = e.srcElement;
                e.currentTarget = self;
                if (listener.handleEvent) {
                    listener.handleEvent(e);
                } else {
                    listener.call(self, e);
                }
            };
            if (type == "DOMContentLoaded") {
                var wrapper2 = function (e) {
                    if (document.readyState == "complete") {
                        wrapper(e);
                    }
                };
                document.attachEvent("onreadystatechange", wrapper2);
                eventListeners.push({ object: this, type: type, listener: listener, wrapper: wrapper2 });

                if (document.readyState == "complete") {
                    var e = new Event();
                    e.srcElement = window;
                    wrapper2(e);
                }
            } else {
                this.attachEvent("on" + type, wrapper);
                eventListeners.push({ object: this, type: type, listener: listener, wrapper: wrapper });
            }
        };
        var removeEventListener = function (type, listener /*, useCapture (will be ignored) */ ) {
            var counter = 0;
            while (counter < eventListeners.length) {
                var eventListener = eventListeners[counter];
                if (eventListener.object == this && eventListener.type == type && eventListener.listener == listener) {
                    if (type == "DOMContentLoaded") {
                        this.detachEvent("onreadystatechange", eventListener.wrapper);
                    } else {
                        this.detachEvent("on" + type, eventListener.wrapper);
                    }
                    eventListeners.splice(counter, 1);
                    break;
                }
                ++counter;
            }
        };
        Element.prototype.addEventListener = addEventListener;
        Element.prototype.removeEventListener = removeEventListener;
        if (HTMLDocument) {
            HTMLDocument.prototype.addEventListener = addEventListener;
            HTMLDocument.prototype.removeEventListener = removeEventListener;
        }
        if (Window) {
            Window.prototype.addEventListener = addEventListener;
            Window.prototype.removeEventListener = removeEventListener;
        }
    }
})();

// foreach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callbackfn, thisArg) {
        var array = this;
        for (var k = 0; k < array.length; k++)
            callbackfn.call(thisArg, array[k], k, array);
    };
}

// map
if (!Array.prototype.map) {
    Array.prototype.map = function (callbackfn, thisArg) {
        var array = this;
        var result = [];
        for (var k = 0; k < array.length; k++)
            result.push(callbackfn.call(thisArg, array[k], k, array));
        return result;
    };
}

// bind (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {
        }, fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}
/// <reference path="math-ui-polyfills.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MathUI;
(function (MathUI) {
    'use strict';

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

    var Elem = (function () {
        function Elem(el) {
            this.el = el;
        }
        Elem.prototype.setClassName = function (cls) {
            this.el.className = cls;
            return this;
        };
        Elem.prototype.appendArray = function (nodes) {
            var _this = this;
            nodes.forEach(function (n) {
                _this.el.appendChild(n.el);
            });
            return this;
        };
        Elem.prototype.appendNode = function () {
            var nodes = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                nodes[_i] = arguments[_i + 0];
            }
            return this.appendArray(nodes);
        };
        Elem.prototype.appendText = function (st) {
            this.el.appendChild(document.createTextNode(st));
            return this;
        };
        return Elem;
    })();

    function createElem(tagName) {
        return new Elem(document.createElement(tagName));
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
        var selectedIndex;
        var buttons = menuItems.map(function (item) {
            return createElem('span').setClassName('math-ui-item').appendText(item.label);
        });
        var menu = createElem('div').setClassName('math-ui-eqn-menu').appendNode(createElem('span').setClassName('math-ui-header').appendText('Equation ?'), createElem('span').setClassName('math-ui-container').appendArray(buttons)).el;
        function updateSelected(index) {
            //if (index === selectedIndex) return;
            selectedIndex = index;
            buttons.forEach(function (elem, k) {
                elem.setClassName('math-ui-item' + (k === index ? ' math-ui-selected' : ''));
            });
        }
        function triggerSelected() {
            el.blur();
            menuItems[selectedIndex].action(el);
        }
        function triggerK(k) {
            updateSelected(k);
            triggerSelected();
        }
        function onkeydown(ev) {
            switch (ev.keyCode) {
                case 13:
                    triggerSelected();
                    break;
                case 37:
                    updateSelected((selectedIndex + menuItems.length - 1) % menuItems.length);
                    break;
                case 39:
                    updateSelected((selectedIndex + 1) % menuItems.length);
                    break;
            }
        }
        var triggers = menuItems.map(function (item, k) {
            return triggerK.bind(undefined, k);
        });
        function onblur() {
            el.removeChild(menu);
            triggers.forEach(function (trigger, k) {
                buttons[k].el.removeEventListener('mousedown', trigger);
            });
            el.removeEventListener('keydown', onkeydown);
            el.removeEventListener('blur', onblur);
        }
        el.addEventListener('blur', onblur);
        el.addEventListener('keydown', onkeydown);
        triggers.forEach(function (trigger, k) {
            buttons[k].el.addEventListener('mousedown', trigger);
        });
        updateSelected(0);
        el.appendChild(menu);
        menu.style.top = (el.offsetHeight - 3) + 'px';
    }

    function elementReady(el) {
        var type = el.getAttribute('data-type');
        if (type && type in handlers) {
            var handler = handlers[type];
            handler.init(el);
        }
        el.tabIndex = 0;
        el.addEventListener('focus', function () {
            return elementGotFocus(el);
        });
    }

    function init() {
        document.addEventListener('DOMContentLoaded', function () {
            Array.prototype.forEach.call(document.querySelectorAll('.math-ui'), elementReady);
        });
    }
    MathUI.init = init;

    function registerHandler(type, handler) {
        handlers[type] = handler;
    }
    MathUI.registerHandler = registerHandler;
})(MathUI || (MathUI = {}));

MathUI.init();


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
