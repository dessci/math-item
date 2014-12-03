/// <reference path="microjq.ts" />

declare var microJQ: MicroJQStatic;
declare var jQuery: JQueryStatic;
declare var MathJax: any;

module MathUI {
    'use strict';

    export var $: JQueryStaticCommon = microJQ;

    export class Handler {
        init(el: Element) {
        }
        clonePresentation(from: Element, to: Element) {
            $(to).append($(from).contents().clone());
        }
    }

    interface HandlerDictionary {
        [index: string]: Handler;
    }

    interface MenuItem {
        label: string;
        action: (el?: any) => void;
    }

    var mathUIElements: { [key: string]: MathUIElement } = {};
    var highlighted = false;

    class PlainHandler extends Handler {
    }

    class MathMLHandler extends Handler {
    }

    var handlers: HandlerDictionary = {
        'plain-html': new PlainHandler(),
        'native-mathml': new MathMLHandler()
    };

    function create(tagName: string): HTMLElement {
        return document.createElement(tagName);
    }

    function stopEvent(event: Event) {
        event.stopPropagation();
        event.preventDefault();
    }

    class Dialog {
        private documentHandler: MicroJQEventHandler;
        private element: MicroJQ;
        private dialog: MicroJQ;
        private wrapper: MicroJQ;
        show(className: string, parent?: Element) {
            parent = parent || document.body;
            this.wrapper = $(create('div')).addClass('math-ui-wrapper');
            this.dialog = $(create('div')).addClass(className).append(this.wrapper);
            this.element = parent === document.body
                ? $(create('div')).addClass('math-ui-backdrop').append(this.dialog) : this.dialog;
            this.prepareDialog(this.wrapper);
            this.documentHandler = (event: MicroJQEventObject) => {
                if (event.type === 'click' || event.which === 27) {
                    stopEvent(event);
                    this.close();
                }
            };
            $(parent).append(this.element);
            $(document).on('click keydown', this.documentHandler);
            this.dialog.on('click', (event: MicroJQEventObject) => {
                stopEvent(event);
                this.click(event);
            });
        }
        close() {
            $(document).off('click keydown', this.documentHandler);
            this.element.remove();
            this.element = this.documentHandler = undefined;
        }
        fitContentWidth() {
            this.dialog.css('width', this.wrapper.width() + 'px');
        }
        fitContentHeight() {
            this.dialog.css('height', this.wrapper.height() + 'px');
        }
        prepareDialog(container: MicroJQ) {
        }
        click(event: MicroJQEventObject) {
        }
    }

    class ZoomDialog extends Dialog {
        constructor(private host: MathUIElement) {
            super();
        }
        prepareDialog(container: MicroJQ) {
            this.host.clonePresentation(container);
        }
        show(): void {
            super.show('math-ui-zoom', this.host.element);
        }
        click() {
            this.close();
        }
    }

    class SourceDialog extends Dialog {
        constructor(private host: MathUIElement) {
            super();
        }
        prepareDialog(container: MicroJQ) {
            var pre = $(create('pre'));
            this.host.appendSource(pre);
            container.append(
                $(create('div')).addClass('math-ui-header').append('MathUI Dashboard'),
                $(create('div')).addClass('math-ui-content').append(pre)
            );
        }
        show(): void {
            super.show('math-ui-dialog math-ui-source');
            this.fitContentHeight();
        }
        click() {
        }
    }

    class MathUIElement {
        static menuItems: MenuItem[] = [
            { label: 'Zoom', action: MathUIElement.prototype.zoomAction },
            { label: 'Source', action: MathUIElement.prototype.sourceAction },
            { label: 'Search', action: () => { alert('search'); } },
            { label: 'Share', action: () => { alert('share'); } },
            { label: 'Dashboard', action: showDashboard }
        ];
        private name: string;
        private handler: Handler;
        constructor(public element: HTMLElement, index: number) {
            var type: string = $(element).data('type');
            if (!(type && type in handlers))
                type = 'plain-html';
            this.name = 'Equation ' + (index+1);
            this.handler = handlers[type];
            this.handler.init(element);
        }
        clonePresentation(to: MicroJQ) {
            this.handler.clonePresentation(this.element, to.get(0));
        }
        appendSource(container: MicroJQ) {
            container.append($(create('pre')).append('some\nlines'));
        }
        changeHighlight(on: boolean) {
            var el = $(this.element);
            on ? el.addClass('highlight') : el.removeClass('highlight');
        }
        zoomAction() {
            var dialog = new ZoomDialog(this);
            dialog.show();
        }
        sourceAction() {
            var dialog = new SourceDialog(this);
            dialog.show();
        }
        gotFocus() {
            var el = $(this.element);
            var selectedIndex: number,
                triggerSelected = () => {
                    el.blur();
                    // IE8: Make sure focus menu is removed before triggering action
                    setTimeout(() => {
                        MathUIElement.menuItems[selectedIndex].action.call(this);
                    });
                },
                buttons = $(microJQ.map(MathUIElement.menuItems, () => create('span'))).addClass('math-ui-item'),
                menu = $(create('div')).addClass('math-ui-eqn-menu').append(
                    $(create('span')).addClass('math-ui-header').append(this.name),
                    $(create('span')).addClass('math-ui-container').append(buttons)
                ),
                updateSelected = (index: number) => {
                    selectedIndex = index;
                    buttons.removeClass('math-ui-selected');
                    $(buttons.get(index)).addClass('math-ui-selected');
                },
                onkeydown = (ev: MicroJQEventObject) => {
                    switch (ev.which) {
                        case 13:
                            ev.preventDefault();  // don't trigger mouse click
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
                },
                onblur = () => {
                    menu.remove();
                    el.off('keydown', onkeydown).off('blur', onblur);
                };
            buttons.each(function (k: number, btn: Element) {
                $(btn).append(MathUIElement.menuItems[k].label).on('mousedown', (event: MicroJQEventObject) => {
                    stopEvent(event);
                    updateSelected(k);
                    triggerSelected();
                });
            });
            el.append(menu).on('keydown', onkeydown).on('blur', onblur);
            updateSelected(0);
            menu.css('top', (el.get(0).offsetHeight - 3) + 'px');
        }
    }

    function highlightAllEquations() {
        highlighted = !highlighted;
        microJQ.objectEach(mathUIElements, (id: string, mathUIElement: MathUIElement) => {
            mathUIElement.changeHighlight(highlighted);
        });
    }

    class DashboardDialog extends Dialog {
        static dashboardItems: MenuItem[] = [
            { label: 'Highlight All Equations', action: highlightAllEquations },
            { label: 'About MathUI', action: () => { alert('About MathUI'); } },
            { label: 'Action 3', action: () => { alert('Action 3 not implemented'); } },
            { label: 'Action 4', action: () => { alert('Action 4 not implemented'); } }
        ];
        private buttons: MicroJQ;
        prepareDialog(container: MicroJQ) {
            this.buttons = $(microJQ.map(DashboardDialog.dashboardItems, () => create('button')))
                .each((k: number, el: Element) => {
                    $(el).append(DashboardDialog.dashboardItems[k].label);
                });
            container.append(
                $(create('div')).addClass('math-ui-header').append('MathUI Dashboard'),
                $(create('div')).addClass('math-ui-content').append(this.buttons)
            );
        }
        show(): void {
            super.show('math-ui-dialog math-ui-dashboard');
            this.fitContentHeight();
            this.buttons.first().focus();
        }
        click(event: MicroJQEventObject): void {
            var nr = microJQ.indexOf(this.buttons.get(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardItems.length) {
                this.close();
                DashboardDialog.dashboardItems[nr].action(DashboardDialog.dashboardItems[nr].label);
            }
        }
    }

    export function showDashboard(): void {
        var dialog = new DashboardDialog();
        dialog.show();
    }

    function elementReady(k: number, element: Element): void {
        var id = 'math-ui-element-' + k;
        var mathUIElement = mathUIElements[id] = new MathUIElement(<HTMLElement> element, k);
        $(element).attr('id', id).attr('tabindex', 0).on('focus', () => {
            mathUIElement.gotFocus();
        });
    }

    export function registerHandler(type: string, handler: Handler): void {
        handlers[type] = handler;
    }

    microJQ.ready(function () {
        if ('jQuery' in window && jQuery.fn.on)
            $ = jQuery;
        $(document).find('.math-ui').each(elementReady);
    });

}

// built-in extensions

class MathJaxHandler extends MathUI.Handler {
    init(el: Element): void {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
    }
    clonePresentation(from: Element, to: Element) {
        var fromscript = <HTMLScriptElement> from.querySelector('script[type]'),
            toscript = document.createElement('script');
        if (!fromscript) return;
        if (fromscript.textContent !== undefined)
            toscript.textContent = fromscript.textContent;
        else
            toscript.text = fromscript.text;
        toscript.setAttribute('type', fromscript.getAttribute('type'));
        to.appendChild(toscript);
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, to]);
    }
}

MathUI.registerHandler('tex', new MathJaxHandler());
MathUI.registerHandler('mml', new MathJaxHandler());
