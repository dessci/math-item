/// <reference path="microjq.ts" />

declare var microJQ: MicroJQStatic;
declare var jQuery: JQueryStatic;
declare var MathJax: any;
declare var toMathML: any;

module MathUI {
    'use strict';

    export var $: JQueryStaticCommon = microJQ;

    export class Handler {
        init(el: Element) {
        }
        clonePresentation(from: Element, to: Element) {
            $(to).append($(from).contents().clone());
        }
        getSourceTypes(el?: Element): string[] {
            return [];
        }
        getSourceFor(type: string, el: Element, callback?: (value: any) => void): any {
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
        getSourceTypes(): string[] {
            return ['HTML'];
        }
        getSourceFor(type: string, el: Element): DocumentFragment {
            if (type === 'HTML')
                return $(document.createDocumentFragment()).append($(el).contents().clone())[0];
            return null;
        }
    }

    class MathMLHandler extends Handler {
        getSourceTypes(): string[] {
            return ['MathML'];
        }
        getSourceFor(type: string, el: Element): HTMLElement {
            if (type === 'MathML') {
                var math = $(el).find('math');
                if (math.length) return math[0];
            }
            return null;
        }
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
        show(className: string, prepareDialog: (container: MicroJQ) => void, parent?: Element) {
            parent = parent || document.body;
            this.wrapper = $(create('div')).addClass('math-ui-wrapper');
            this.dialog = $(create('div')).addClass(className).append(this.wrapper);
            this.element = parent === document.body
                ? $(create('div')).addClass('math-ui-backdrop').append(this.dialog) : this.dialog;
            prepareDialog(this.wrapper);
            this.documentHandler = (event: MicroJQEventObject) => {
                if (event.type === 'click' || event.which === 27) {
                    stopEvent(event);
                    this.close();
                } else if (event.type === 'keydown')
                    this.keydown(event);
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
        fitContentHeight() {
            setTimeout(() => {   // IE8 seems to want this
                this.dialog.css('height', this.wrapper.height() + 'px');
            });
        }
        click(event: MicroJQMouseEventObject) {
        }
        keydown(event: MicroJQKeyEventObject) {
        }
    }

    class ZoomDialog extends Dialog {
        constructor(private host: MathUIElement) {
            super();
        }
        
        show(): void {
            super.show('math-ui-zoom', (container: MicroJQ) => {
                this.host.clonePresentation(container);
            }, this.host.element);
        }
        click() {
            this.close();
        }
    }

    function sourceToString(obj: any): string {
        var st;
        if (obj === null)
            st = 'Unable to get source';
        if (typeof obj === 'string') {
            st = obj;
        } else if ((<Node> obj).nodeType === 1 /*Node.ELEMENT_NODE*/) {
            st = (<HTMLElement> obj).outerHTML;
        } else if ((<Node> obj).nodeType === 3 /*Node.TEXT_NODE*/) {
            st = (<Text> obj).nodeValue;
        } else if ((<Node> obj).nodeType === 11 /*Node.DOCUMENT_FRAGMENT_NODE*/) {
            st = microJQ.map((<DocumentFragment> obj).childNodes, sourceToString).join('');
        } else
            st = '[Unknown type]';
        return microJQ.trim(st);
    }

    interface SourceItem {
        type: string;
        source: string;
    }

    class SourceDialog extends Dialog {
        private sources: SourceItem[];
        private sourceTabs: MicroJQ;
        private $source: MicroJQ;
        private selected: number;
        constructor(private host: MathUIElement) {
            super();
            var types = this.host.getSourceTypes();
            this.sources = microJQ.map(types, (type: string, k: number) => {
                var item = { type: type, source: 'wait...' },
                    src = this.host.getSourceFor(type, (src: any) => {
                        item.source = sourceToString(src);
                        if (k === this.selected)
                            this.updateSelected();
                    });
                if (src !== undefined)
                    item.source = sourceToString(src);
                return item;
            });
        }
        updateSelected() {
            this.$source.text(this.sources[this.selected].source);
        }
        setSelected(k: number) {
            if (this.sources.length === 0) return;
            k = (k + this.sources.length) % this.sources.length;
            if (k !== this.selected) {
                this.selected = k;
                this.updateSelected();
                this.sourceTabs.removeClass('math-ui-selected');
                $(this.sourceTabs[k]).addClass('math-ui-selected');
                this.updateSelected();
            }
        }
        show() {
            super.show('math-ui-dialog math-ui-source', (container: MicroJQ) => {
                this.sourceTabs = $(microJQ.map(this.sources, (item: SourceItem) =>
                        $(create('span')).append(item.type)[0]));
                this.$source = $(create('pre'));
                container.append(
                    $(create('div')).addClass('math-ui-header').append('Source for ' + this.host.name),
                    $(create('div')).addClass('math-ui-content').append(
                        $(create('div')).addClass('sourcetypes').append(this.sourceTabs),
                        this.$source
                        )
                    );
                this.setSelected(0);
            });
            this.fitContentHeight();
        }
        close() {
            this.sources = this.sourceTabs = this.$source = undefined;
            super.close();
        }
        click(event: MicroJQMouseEventObject) {
            var k = microJQ.indexOf(this.sourceTabs.toArray(), event.target);
            if (k >= 0) this.setSelected(k);
        }
        keydown(event: MicroJQKeyEventObject) {
            var k = microJQ.indexOf([37, 39], event.which);
            if (k >= 0) this.setSelected(this.selected + (k === 0 ? 1 : -1));
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
        public name: string;
        private handler: Handler;
        constructor(public element: HTMLElement, index: number) {
            var type: string = $(element).data('type');
            if (!(type && type in handlers)) {
                type = $(element).find('math').length === 1 ? 'native-mathml' : 'plain-html';
            }
            this.name = 'Equation ' + (index + 1);
            this.handler = handlers[type];
            this.handler.init(element);
        }
        clonePresentation(to: MicroJQ) {
            this.handler.clonePresentation(this.element, to[0]);
        }
        getSourceTypes(): string[] {
            return this.handler.getSourceTypes(this.element);
        }
        getSourceFor(type: string, callback: (src: any) => void): any {
            return this.handler.getSourceFor(type, this.element, callback);
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
                    $(buttons[index]).addClass('math-ui-selected');
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
            menu.css('top', (el[0].offsetHeight - 3) + 'px');
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
        show(): void {
            super.show('math-ui-dialog math-ui-dashboard', (container: MicroJQ) => {
                this.buttons = $(microJQ.map(DashboardDialog.dashboardItems, () => create('button')))
                    .each((k: number, el: Element) => {
                        $(el).append(DashboardDialog.dashboardItems[k].label);
                    });
                container.append(
                    $(create('div')).addClass('math-ui-header').append('MathUI Dashboard'),
                    $(create('div')).addClass('math-ui-content').append(this.buttons)
                    );
            });
            this.buttons.first().focus();
            this.fitContentHeight();
        }
        click(event: MicroJQEventObject): void {
            var nr = microJQ.indexOf(this.buttons.toArray(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardItems.length) {
                this.close();
                DashboardDialog.dashboardItems[nr].action(DashboardDialog.dashboardItems[nr].label);
            }
        }
    }

    function elementReady(k: number, element: Element): void {
        var id = 'math-ui-element-' + k;
        var mathUIElement = mathUIElements[id] = new MathUIElement(<HTMLElement> element, k);
        $(element).attr('id', id).attr('tabindex', 0).on('focus', () => {
            mathUIElement.gotFocus();
        });
    }

    microJQ.ready(function () {
        if ('jQuery' in window && jQuery.fn.on)
            $ = jQuery;
        $(document).find('.math-ui').each(elementReady);
    });

    export function showDashboard(): void {
        var dialog = new DashboardDialog();
        dialog.show();
    }

    export function registerHandler(type: string, handler: Handler): void {
        handlers[type] = handler;
    }

}

// built-in extensions

class MathJaxHandler extends MathUI.Handler {
    constructor(private original: string, private internal: string) {
        super();
    }
    init(el: Element): void {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
    }
    clonePresentation(from: Element, to: Element) {
        var script = MathUI.$(from).find('script[type]');
        MathUI.$(to).append(script.clone().removeAttr('id').removeAttr('MathJax'));
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, to]);
    }
    private _getJaxElement(el: Element): any {
        var jax = MathJax.Hub.getAllJax(el);
        return jax && jax.length === 1 ? jax[0] : null;
    }
    getSourceTypes(el: Element) {
        var types = [this.original], jax = this._getJaxElement(el);
        if (jax && jax.root.toMathML)
            types.push(this.internal);
        return types;
    }
    getSourceFor(type: string, el: Element, callback: (value: any) => void): string {
        var jax = this._getJaxElement(el);
        if (!jax) return null;
        if (type === this.original) {
            return jax.originalText;
        } else if (type === this.internal && jax.root.toMathML) {
            try {
                return jax.root.toMathML('');
            } catch (err) {
                if (!err.restart) { throw err; }
                MathJax.Callback.After(['toMathML', jax, callback], err.restart);
            }
        }
    }
}

MathUI.registerHandler('tex', new MathJaxHandler('TeX', 'MathML'));
MathUI.registerHandler('mml', new MathJaxHandler('MathML (original)', 'MathML (MathJax)'));
