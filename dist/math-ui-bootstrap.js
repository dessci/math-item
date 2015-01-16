/// <reference path="../../dist/math-ui-core.d.ts" />
/// <reference path="../../typings/jquery.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MathUI;
(function (MathUI) {
    'use strict';
    var _ = MathUI.getUtils();
    // Zoom
    function zoomAction(mathItem) {
        var inner = $('<div class="panel-body">');
        var popup = $('<div class="panel panel-default math-ui-zoom">').append(inner);
        mathItem.clonePresentation(inner);
        $(mathItem.element).append(popup);
        $(document).on('mousedown keydown', function (ev) {
            ev.stopPropagation();
            popup.remove();
        });
    }
    // View Markup
    function sourceDataToLabel(sd) {
        var label = sd.type;
        if (sd.subtype)
            label += ' (' + sd.subtype + ')';
        return label;
    }
    function sourceAction(mathItem) {
        var tabs = $('<ul class="nav nav-pills">'), markup = $('<textarea class="form-control" readonly></textarea>'), content = $('<div class="modal-content">').append($('<div class="modal-header">').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title">').append('Markup for ' + mathItem.name))).append($('<div class="modal-body">').append(tabs, markup)).append($('<div class="modal-footer">').append($('<button type="button" class="btn btn-primary">Select All</button>')).append($('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true">').append($('<div class="modal-dialog modal-lg">').append(content)), selected = -1, sources = [];
        function setSelected(s) {
            var tabItems = tabs.children();
            if (s === selected)
                return;
            selected = s;
            tabItems.removeClass('active');
            markup.text(sources[s].source);
            $(tabItems[s]).addClass('active');
        }
        mathItem.getSources().then(function (_sources) {
            sources = _sources;
            _.each(sources, function (sourceData) {
                tabs.append($('<li role="presentation">').append($('<a href="#">').append(sourceDataToLabel(sourceData))));
            });
            setSelected(0);
        });
        tabs.on('click', function (ev) {
            tabs.find('a').each(function (k, elem) {
                ev.preventDefault();
                if (elem === ev.target)
                    setSelected(k);
            });
        });
        content.find('.modal-footer > button').first().on('click', function () {
            markup.focus().select();
        });
        modal.on('hidden.bs.modal', function () {
            modal.remove();
        }).modal();
    }
    // Equation menu
    function makeMenuItems(mathItem) {
        var result = [];
        if (mathItem.clonePresentation)
            result.push({ label: 'Zoom', action: function () {
                zoomAction(mathItem);
            } });
        if (mathItem.getSources)
            result.push({ label: 'View Markup', action: function () {
                sourceAction(mathItem);
            } });
        result.push({ label: 'Dashboard', action: function () {
            mathItem.container.showDashboard();
        } });
        return result;
    }
    function gotFocus(mathItem) {
        var el = $(mathItem.element), menuItems = makeMenuItems(mathItem), menu = $('<ul class="dropdown-menu" role="menu">').append($('<li role="presentation" class="dropdown-header">').append(mathItem.name));
        _.each(menuItems, function (menuItem) {
            console.log(menuItem);
            menu.append($('<li role="presentation">').append($('<a role="menuitem" tabindex="-1" href="#">').append(menuItem.label)));
        });
        el.append(menu).on('blur', function () {
            menu.remove();
        });
        menu.on('mousedown', function (ev) {
            menu.find('a').each(function (k, elem) {
                if (elem === ev.target) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    el.blur();
                    menuItems[k].action();
                }
            });
        });
    }
    // Main class
    var BootstrapLookAndFeel = (function (_super) {
        __extends(BootstrapLookAndFeel, _super);
        function BootstrapLookAndFeel() {
            _super.apply(this, arguments);
        }
        BootstrapLookAndFeel.prototype.init = function (mathItem) {
            $(mathItem.element).on('focus', function (ev) {
                console.log('focus');
                ev.stopPropagation();
                ev.preventDefault();
                gotFocus(mathItem);
            });
        };
        BootstrapLookAndFeel.prototype.showDashboard = function () {
            var _this = this;
            var body = $('<div class="modal-body">').append($('<div class="btn-group-vertical">').append($('<button type="button" class="btn btn-primary form-control">Highlight All Equations</button>')).append($('<button type="button" class="btn btn-primary form-control">About</button>')).append($('<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal math-ui-dashboard" tabindex="-1" role="dialog" aria-hidden="true">').append($('<div class="modal-dialog modal-sm">').append($('<div class="modal-content">').append($('<div class="modal-header">').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title">').append('Dashboard'))).append(body)));
            body.on('click', function (ev) {
                body.find('button').each(function (k, elem) {
                    if (k <= 1 && elem === ev.target) {
                        ev.preventDefault();
                        modal.modal('hide');
                        if (k === 0) {
                            _this.highlightAll();
                        }
                        else {
                            window.location.href = 'https://github.com/dessci/math-ui';
                        }
                    }
                });
            });
            modal.on('hidden.bs.modal', function () {
                modal.remove();
            }).modal();
        };
        return BootstrapLookAndFeel;
    })(MathUI.MathItemContainer);
    MathUI.BootstrapLookAndFeel = BootstrapLookAndFeel;
})(MathUI || (MathUI = {}));
//# sourceMappingURL=math-ui-bootstrap.js.map