/// <reference path="../../dist/math-ui-core.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MathUI;
(function (MathUI) {
    'use strict';
    var $, _ = MathUI.getUtils();
    MathUI.queryLibReady(function (qlib) { return $ = qlib; });
    // helpers
    function create(tagName) {
        return document.createElement(tagName);
    }
    function new$(tagName) {
        return $(create(tagName));
    }
    function stopEvent(event) {
        event.stopPropagation();
        event.preventDefault();
    }
    // Dialog
    var Dialog = (function () {
        function Dialog() {
        }
        Dialog.prototype.show = function (className, prepareDialog, buttons, parent) {
            var _this = this;
            parent = parent || document.body;
            this.wrapper = new$('div').addClass('math-ui-wrapper');
            this.dialog = new$('div').addClass(className).append(this.wrapper);
            this.element = parent === document.body ? new$('div').addClass('math-ui-backdrop').append(this.dialog) : this.dialog;
            prepareDialog(this.wrapper);
            if (buttons) {
                var bottom = new$('div').addClass('math-ui-footer');
                _.each(buttons, function (buttonData) {
                    var button = new$('button').append(buttonData.label).on('click', function () {
                        buttonData.action();
                    });
                    bottom.append(button);
                });
                this.wrapper.append(bottom);
            }
            this.documentHandler = function (event) {
                if (event.type === 'click' ? event.which === 1 : event.which === 27) {
                    stopEvent(event);
                    _this.close();
                }
                else if (event.type === 'keydown')
                    _this.keydown(event);
            };
            $(parent).append(this.element);
            $(document).on('click keydown', this.documentHandler);
            this.dialog.on('click', function (event) {
                if (event.which === 1) {
                    stopEvent(event);
                    _this.click(event);
                }
            });
        };
        Dialog.prototype.close = function () {
            $(document).off('click keydown', this.documentHandler);
            this.element.remove();
            this.element = this.documentHandler = undefined;
        };
        Dialog.prototype.fitContentHeight = function () {
            var _this = this;
            var height = this.wrapper.height();
            this.dialog.css('height', height + 'px');
            if (height <= 0) {
                // setting height twice + async seems to make it work on IE9
                MathUI.async(function () {
                    _this.dialog.css('height', _this.wrapper.height() + 'px');
                });
            }
        };
        Dialog.prototype.click = function (event) {
        };
        Dialog.prototype.keydown = function (event) {
        };
        return Dialog;
    })();
    // Zoom action
    var ZoomDialog = (function (_super) {
        __extends(ZoomDialog, _super);
        function ZoomDialog(host) {
            _super.call(this);
            this.host = host;
        }
        ZoomDialog.prototype.show = function () {
            var _this = this;
            _super.prototype.show.call(this, 'math-ui-zoom', function (container) {
                _this.host.clonePresentation(container);
            }, undefined, this.host.element);
        };
        ZoomDialog.prototype.click = function () {
            this.close();
        };
        return ZoomDialog;
    })(Dialog);
    function zoomAction(mathItem) {
        var dialog = new ZoomDialog(mathItem);
        dialog.show();
    }
    // View Markup
    function sourceDataToLabel(sd) {
        var label = sd.type;
        if (sd.subtype)
            label += ' (' + sd.subtype + ')';
        return label;
    }
    var SourceDialog = (function (_super) {
        __extends(SourceDialog, _super);
        function SourceDialog(host) {
            var _this = this;
            _super.call(this);
            this.host = host;
            this.host.getSources().then(function (sources) {
                _this.sources = sources;
                _this.updateSelected();
            });
        }
        SourceDialog.prototype.updateSelected = function () {
            if (this.selected === undefined)
                return;
            this.sourceArea.text(this.sources[this.selected].source);
        };
        SourceDialog.prototype.setSelected = function (k) {
            if (this.sources.length === 0)
                return;
            k = (k + this.sources.length) % this.sources.length;
            if (k !== this.selected) {
                var children = this.sourceTabContainer.children();
                this.selected = k;
                children.removeClass('math-ui-selected');
                $(children[k]).addClass('math-ui-selected');
                this.updateSelected();
            }
        };
        SourceDialog.prototype.show = function () {
            var _this = this;
            var selectAll = function () {
                _this.sourceArea.focus()[0].select();
            };
            var buttons = [
                { label: 'Select All', action: selectAll },
                { label: 'Close', action: function () {
                    _this.close();
                } }
            ];
            //if (typeof ClipboardEvent !== 'undefined' && new ClipboardEvent('copy') instanceof Event) {
            //    buttons.splice(0, 0, {
            //        label: 'Copy to Clipboard', action: () => {
            //            var e = new ClipboardEvent('copy', { bubbles: true, cancelable: true, dataType: 'text/plain', data: 'Copy test' });
            //            this.sourceArea[0].dispatchEvent(e);
            //        }
            //    });
            //}
            this.sourceArea = new$('textarea').attr('readonly', 'readonly');
            this.sourceTabContainer = new$('div').addClass('math-ui-types').attr('tabindex', 0);
            _.each(this.sources, function (item) {
                _this.sourceTabContainer.append(new$('span').append(sourceDataToLabel(item)));
            });
            _super.prototype.show.call(this, 'math-ui-dialog math-ui-source', function (container) {
                container.append(new$('div').addClass('math-ui-header').append('Markup for ' + _this.host.name), new$('div').addClass('math-ui-content').append(_this.sourceTabContainer, _this.sourceArea));
            }, buttons);
            this.setSelected(0);
            this.fitContentHeight();
            this.sourceTabContainer.focus();
            this.sourceArea.on('copy', function (ev) {
                console.log('copy', ev);
                ev.originalEvent.clipboardData.setData("text/plain", "Simulated copy. Yay!");
                ev.originalEvent.clipboardData.setData("application/mathml+xml", "<math><mi>x</mi></math>");
                ev.preventDefault();
            });
        };
        SourceDialog.prototype.close = function () {
            this.sources = this.sourceTabContainer = this.sourceArea = undefined;
            _super.prototype.close.call(this);
        };
        SourceDialog.prototype.click = function (event) {
            var _this = this;
            this.sourceTabContainer.children().each(function (k, elem) {
                if (elem === event.target)
                    _this.setSelected(k);
            });
        };
        SourceDialog.prototype.keydown = function (event) {
            if (event.target === this.sourceTabContainer[0]) {
                var k = _.indexOf([37, 39], event.which);
                if (k >= 0)
                    this.setSelected(this.selected + (k === 0 ? 1 : -1));
            }
        };
        return SourceDialog;
    })(Dialog);
    function sourceAction(mathItem) {
        var dialog = new SourceDialog(mathItem);
        dialog.show();
    }
    // Dashboard
    var DashboardDialog = (function (_super) {
        __extends(DashboardDialog, _super);
        function DashboardDialog(container) {
            _super.call(this);
            this.container = container;
        }
        DashboardDialog.prototype.show = function () {
            var _this = this;
            _super.prototype.show.call(this, 'math-ui-dialog math-ui-dashboard', function (container) {
                _this.buttons = $(_.map(DashboardDialog.dashboardLabels, function () { return create('button'); })).each(function (k, el) {
                    $(el).append(DashboardDialog.dashboardLabels[k]);
                });
                container.append(new$('div').addClass('math-ui-header').append('MathUI Dashboard'), new$('div').addClass('math-ui-content').append(_this.buttons));
            });
            this.buttons.first().focus();
            this.fitContentHeight();
        };
        DashboardDialog.prototype.click = function (event) {
            var nr = _.indexOf(this.buttons.toArray(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardLabels.length) {
                this.close();
                if (nr === 0) {
                    this.container.highlightAll();
                }
                else {
                    window.location.href = 'https://github.com/dessci/math-ui';
                }
            }
        };
        DashboardDialog.dashboardLabels = [
            'Highlight All Equations',
            'About MathUI'
        ];
        return DashboardDialog;
    })(Dialog);
    // Focus menu
    function makeMenuItems(mathItem) {
        var result = [];
        if (MathUI.MathItem.prototype.clonePresentation)
            result.push({ label: 'Zoom', action: function () { return zoomAction(mathItem); } });
        if (MathUI.MathItem.prototype.getSources)
            result.push({ label: 'View Markup', action: function () { return sourceAction(mathItem); } });
        result.push({ label: 'Dashboard', action: function () { return mathItem.container.showDashboard(); } });
        return result;
    }
    function gotFocus(mathItem) {
        var el = $(mathItem.element), selectedIndex, menuItems = makeMenuItems(mathItem), triggerSelected = function () {
            el.blur();
            // IE8: Make sure focus menu is removed before triggering action
            MathUI.async(function () {
                menuItems[selectedIndex].action();
            });
        }, buttons = $(_.map(menuItems, function () { return create('span'); })).addClass('math-ui-item'), menu = new$('div').addClass('math-ui-eqn-menu').append(new$('span').addClass('math-ui-header').append(mathItem.name), new$('span').addClass('math-ui-container').append(buttons)), updateSelected = function (index) {
            selectedIndex = index;
            buttons.removeClass('math-ui-selected');
            $(buttons[index]).addClass('math-ui-selected');
        }, onkeydown = function (ev) {
            switch (ev.which) {
                case 13:
                    ev.preventDefault(); // don't trigger mouse click
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
        buttons.each(function (k, btn) {
            $(btn).append(menuItems[k].label).on('mousedown', function (event) {
                if (event.which === 1) {
                    stopEvent(event);
                    updateSelected(k);
                    triggerSelected();
                }
            });
        });
        el.append(menu).on('keydown', onkeydown).on('blur', onblur);
        updateSelected(0);
        menu.css('top', (el[0].offsetHeight - 3) + 'px');
    }
    // Main class
    var VanillaLookAndFeel = (function (_super) {
        __extends(VanillaLookAndFeel, _super);
        function VanillaLookAndFeel() {
            _super.apply(this, arguments);
        }
        VanillaLookAndFeel.prototype.init = function (mathItem) {
            var el = $(mathItem.element);
            el.on('focus', function () { return gotFocus(mathItem); });
        };
        VanillaLookAndFeel.prototype.showDashboard = function () {
            var dialog = new DashboardDialog(this);
            dialog.show();
        };
        return VanillaLookAndFeel;
    })(MathUI.MathItemContainer);
    MathUI.VanillaLookAndFeel = VanillaLookAndFeel;
})(MathUI || (MathUI = {}));
//# sourceMappingURL=math-ui-vanilla.js.map