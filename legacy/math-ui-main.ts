/// <reference path="math-ui-polyfills.ts" />

module MathUI {
    'use strict';

    export interface Handler {
        init(el: HTMLElement): void;
    }

    interface HandlerDictionary {
        [index: string]: Handler;
    }

    interface Callback {
        (): void;
    }

    class PlainHandler implements Handler {
        init(el: HTMLElement): void { }
    }

    class MathMLHandler implements Handler {
        init(el: HTMLElement): void { }
    }

    var handlers: HandlerDictionary = {
        'plain-html': new PlainHandler(),
        'native-mathml': new MathMLHandler()
    };

    class Elem {
        constructor(public el: HTMLElement) {
        }
        setClassName(cls: string): Elem {
            this.el.className = cls;
            return this;
        }
        appendArray(nodes: Elem[]): Elem {
            nodes.forEach((n: Elem): void => {
                this.el.appendChild(n.el);
            });
            return this;
        }
        appendNode(...nodes: Elem[]): Elem {
            return this.appendArray(nodes);
        }
        appendText(st: string): Elem {
            this.el.appendChild(document.createTextNode(st));
            return this;
        }
    }

    function createElem(tagName: string): Elem {
        return new Elem(document.createElement(tagName));
    }

    export function showDashboard(): void {
        alert('Dashboard');
    }

    function zoomAction(el: HTMLElement): void {
        alert('zoom');
    }

    function sourceAction(el: HTMLElement): void {
        alert('source');
    }

    function searchAction(el: HTMLElement): void {
        alert('search');
    }

    function shareAction(el: HTMLElement): void {
        alert('share');
    }

    interface MenuItem {
        label: string;
        action: (el: HTMLElement) => void;
    }

    var menuItems: MenuItem[] = [
        { label: 'Zoom', action: zoomAction },
        { label: 'Source', action: sourceAction },
        { label: 'Search', action: searchAction },
        { label: 'Share', action: shareAction },
        { label: 'Dashboard', action: showDashboard }
    ];

    function elementGotFocus(el: HTMLElement): void {
        var selectedIndex: number;
        var buttons: Elem[] = menuItems.map((item: MenuItem): Elem =>
            createElem('span').setClassName('math-ui-item').appendText(item.label));
        var menu: HTMLElement = createElem('div').setClassName('math-ui-eqn-menu')
            .appendNode(
                createElem('span').setClassName('math-ui-header').appendText('Equation ?'),
                createElem('span').setClassName('math-ui-container').appendArray(buttons)
            ).el;
        function updateSelected(index: number): void {
            //if (index === selectedIndex) return;
            selectedIndex = index;
            buttons.forEach((elem: Elem, k: number): void => {
                elem.setClassName('math-ui-item' + (k === index ? ' math-ui-selected' : ''));
            });
        }
        function triggerSelected(): void {
            el.blur();
            menuItems[selectedIndex].action(el);
        }
        function triggerK(k: number): void {
            updateSelected(k);
            triggerSelected();
        }
        function onkeydown(ev: KeyboardEvent): void {
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
        var triggers: Callback[] = menuItems.map(
            (item: MenuItem, k: number): Callback => triggerK.bind(undefined, k));
        function onblur(): void {
            el.removeChild(menu);
            triggers.forEach((trigger: Callback, k: number): void => {
                buttons[k].el.removeEventListener('mousedown', trigger);
            });
            el.removeEventListener('keydown', onkeydown);
            el.removeEventListener('blur', onblur);
        }
        el.addEventListener('blur', onblur);
        el.addEventListener('keydown', onkeydown);
        triggers.forEach((trigger: Callback, k: number): void => {
            buttons[k].el.addEventListener('mousedown', trigger);
        });
        updateSelected(0);
        el.appendChild(menu);
        menu.style.top = (el.offsetHeight - 3) + 'px';
    }

    function elementReady(el: HTMLElement): void {
        var type: string = el.getAttribute('data-type');
        if (type && type in handlers) {
            var handler: Handler = handlers[type];
            handler.init(el);
        }
        el.tabIndex = 0;
        el.addEventListener('focus', (): void => elementGotFocus(el));
    }

    export function init(): void {
        document.addEventListener('DOMContentLoaded', (): void => {
            Array.prototype.forEach.call(document.querySelectorAll('.math-ui'), elementReady);
        });
    }

    export function registerHandler(type: string, handler: Handler): void {
        handlers[type] = handler;
    }

}

MathUI.init();

// extensions

declare var MathJax: any;

class MathJaxHandler implements MathUI.Handler {
    init(el: HTMLElement): void {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
    }
}

class MathJaxTexHandler extends MathJaxHandler {
}

MathUI.registerHandler('tex', new MathJaxTexHandler());

class MathJaxMathMLHandler extends MathJaxHandler {
}

MathUI.registerHandler('mml', new MathJaxMathMLHandler());
