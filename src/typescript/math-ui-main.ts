/// <reference path="math-ui-microjq.ts" />
/// <reference path="math-ui-utils.ts" />
/// <reference path="../../typings/jquery.d.ts" />

module MathUI {
    'use strict';

    export interface QueryStaticBase {
        (element: Element): MicroJQ;
        (element: Node): MicroJQ;
        (elements: Element[]): MicroJQ;
    }

    var $: QueryStaticBase = microJQ;
    var _ = getUtils();

    export function get$(): QueryStaticBase {
        return $;
    }

    export interface SourceData {
        type: string;
        subtype?: string;
        source: string;
    }

    export class Handler {
        canHandle(el: Element): boolean {
            return false;  // disable auto-discover by default
        }
        init(el: Element) {
        }
        clonePresentation(from: Element, to: Element) {
            $(to).append($(from).contents().clone());
        }
        getSources(el?: Element): Promise<SourceData[]> {
            return Promise.resolve([]);
        }
        getSourceFor(type: string, el: Element, callback?: (value: any) => void): any {
            return null;
        }
    }

    class HandlerStore {
        private handlerDict: Dictionary<Handler> = {};
        private handlerOrder: string[] = [];
        put(type: string, handler: Handler): Handler {
            var previous = this.remove(type);
            this.handlerDict[type] = handler;
            this.handlerOrder.splice(0, 0, type);
            return previous;
        }
        get(type: string): Handler {
            return this.handlerDict[type];
        }
        remove(type: string): Handler {
            if (type in this.handlerDict) {
                var k = _.indexOf(this.handlerOrder, type);
                if (k >= 0)
                    this.handlerOrder.splice(k, 1);
                delete this.handlerDict[type];
            }
            return null;
        }
        find(fn: (handler: Handler) => boolean): Handler {
            for (var k = 0; k < this.handlerOrder.length; k++) {
                var handler = this.handlerDict[this.handlerOrder[k]];
                if (fn(handler)) return handler;
            }
        }
    }

    var handlerStore = new HandlerStore();

    interface MenuItem {
        label: string;
        action: (el?: any) => void;
    }

    var mathUIElementDict: Dictionary<MathUIElement> = {};
    var highlighted = false;

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

    function sourceDataToLabel(sd: SourceData) {
        var label = sd.type;
        if (sd.subtype) label += ' (' + sd.subtype + ')';
        return label;
    }

    class SourceDialog extends Dialog {
        private sources: SourceData[];
        private sourceTabs: MicroJQ;
        private $source: MicroJQ;
        private selected: number;
        constructor(private host: MathUIElement) {
            super();
            this.host.getSources().then((sources: SourceData[]) => {
                this.sources = sources;
                this.updateSelected();
            });
        }
        updateSelected() {
            if (this.selected === undefined) return;
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
                this.sourceTabs = $(_.map(this.sources, (item: SourceData) =>
                    $(create('span')).append(sourceDataToLabel(item))[0]));
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
            var k = _.indexOf(this.sourceTabs.toArray(), event.target);
            if (k >= 0) this.setSelected(k);
        }
        keydown(event: MicroJQKeyEventObject) {
            var k = _.indexOf([37, 39], event.which);
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
        public id: string;
        public name: string;
        private handler: Handler;
        constructor(public element: HTMLElement, index: number) {
            var el = $(element),
                type: string = el.data('type'),
                handler = handlerStore.get(type) ||
                    handlerStore.find((handler: Handler) => handler.canHandle(element));
            if (!handler)
                throw 'MathUI: No matching handler';
            this.id = 'math-ui-element-' + index;
            this.name = 'Equation ' + (index + 1);
            this.handler = handler;
            this.handler.init(element);
            el.attr('id', this.id).attr('tabindex', 0).on('focus', () => {
                this.gotFocus();
            });
        }
        clonePresentation(to: MicroJQ) {
            this.handler.clonePresentation(this.element, to[0]);
        }
        getSources(): Promise<SourceData[]> {
            return this.handler.getSources(this.element);
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
                buttons = $(_.map(MathUIElement.menuItems, () => create('span'))).addClass('math-ui-item'),
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
        _.each(mathUIElementDict, (mathUIElement: MathUIElement) => {
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
                this.buttons = $(_.map(DashboardDialog.dashboardItems, () => create('button')))
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
            var nr = _.indexOf(this.buttons.toArray(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardItems.length) {
                var item = DashboardDialog.dashboardItems[nr];
                this.close();
                item.action(item.label);
            }
        }
    }

    function elementReady(k: number, element: Element): void {
        var id = 'math-ui-element-' + k;
        var mathUIElement = mathUIElementDict[id] = new MathUIElement(<HTMLElement> element, k);
        $(element).attr('id', id).attr('tabindex', 0).on('focus', () => {
            mathUIElement.gotFocus();
        });
    }

    microJQ.ready(function () {
        if ('jQuery' in window && jQuery.fn.on)
            $ = jQuery;
        $(document).find('.math-ui').each((k: number, element: Element) => {
            var mathUIElement = new MathUIElement(<HTMLElement> element, k);
            mathUIElementDict[mathUIElement.id] = mathUIElement;
        });
    });

    export function showDashboard(): void {
        var dialog = new DashboardDialog();
        dialog.show();
    }

    export function registerHandler(type: string, handler: Handler): Handler {
        return handlerStore.put(type, handler);
    }

    var mathml_token_elements = ['mi', 'mn', 'mo', 'ms', 'mtext', 'ci', 'cn', 'cs', 'csymbol', 'annotation'];

    export function prettifyMathML(el: HTMLElement, indent?: string): string {
        if (el.nodeType !== 1)
            throw 'prettifyMathMLNode: expected Element node';
        if (indent === undefined) indent = '';
        var name = el.nodeName.toLowerCase();
        var r = indent + '<' + name + _.map(el.attributes, (attr: Attr) => ' ' + attr.name + '="' + attr.value + '"').join('') + '>';
        if (_.contains(mathml_token_elements, name)) {
            r += _.words(el.innerHTML).join(' ');
        } else {
            var children = _.filter($(el).contents().toArray(), (n: Element) => n.nodeType === 1);
            var items = _.map(children, (c: HTMLElement) => prettifyMathML(<HTMLElement> c, indent + '  '));
            if (items)
                r += '\n' + items.join('\n') + '\n' + indent;
        }
        r += '</' + name + '>';
        return r;
    }

    export function nodeToString(obj: any): string {
        if ((<Node> obj).nodeType === 1 /*Node.ELEMENT_NODE*/) {
            return (<HTMLElement> obj).outerHTML;
        } else if ((<Node> obj).nodeType === 3 /*Node.TEXT_NODE*/) {
            return (<Text> obj).nodeValue;
        } else if ((<Node> obj).nodeType === 11 /*Node.DOCUMENT_FRAGMENT_NODE*/) {
            return _.map((<DocumentFragment> obj).childNodes, nodeToString).join('');
        }
        throw 'Unsupported node type';
    }

    export function parseXML(st: string): Document {
        if ('DOMParser' in window) {
            var parser = new DOMParser();
            try {
                return parser.parseFromString(st, 'application/xml');
            } catch (ex) {
            }
        }
        return null;
    }

}
