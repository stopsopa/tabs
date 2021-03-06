/**
 * @author Szymon Działowski
 * @ver 1.0.0 - 2015-10-21
 * @homepage https://github.com/stopsopa/tabs
 * @demo http://stopsopa.github.io/submod/tabs/demo/demo.html
 *
 * Copyright (c) 2015 Szymon Działowski
 * Released under the MIT license
 * http://en.wikipedia.org/wiki/MIT_License
 */
;(function( factory ) {
    if ( typeof define === "function" && define.amd ) {

        // AMD. Register as an anonymous module.
        define([ "jquery" ], factory );
    } else {

        // Browser globals
        factory( jQuery );
    }
})((function (name) {
    return function ($) {

        function log(){try{window.console.log.apply(window.console,arguments);}catch(e){}};
        function error(){try{window.console.error.apply(window.console, arguments);}catch(e){}};

        var def = {
            active: undefined // 0 based, see also method $(...).tabs('active', int-zero-based)
        };

        var
            key         = '_' + name,
            selector    = ':'+name
        ;



        var tools = {
            destroy: function (i, div, arg1) {
                var t = $(div);

                if (!t.is(selector))
                    return error("Element "+i+" is not "+selector);

                var opt = t.data(key);

                t.removeData(key);

                t.find('[data-buttons]:first')
                    .off('click', '> *', opt.change)
                    .find('> *').removeData(key)
                ;
            },
            /**
             * Zero indexed
             */
            active: function (i, div, arg1) {
                arg1 = Math.floor(arg1);

                if (isNaN(arg1))
                    return error("arg1 is NaN, should be int");

                if (arg1 < 0)
                    return error("arg1 shouldn't be less then 0");

                var t = $(this);

                if (!t.is(selector))
                    return error("Element "+i+" is not "+selector);

                var opt = t.data(key);

                var tab = opt.change.buttons.find('> :eq('+arg1+')');

                if (!tab.length)
                    return error("Tab index "+arg1+" doesn't exist");

                opt.change.apply(tab);
            }
        };

        $.fn[name] = function (arg1) {

            var a = Array.prototype.slice.call(arguments, 1);

            if (typeof arg1 === 'string') {

                if (!tools[arg1])
                    throw "Method "+arg1+" is not defined";

                return $(this).each(function (i, el) {

                    if (!$(this).is(selector))
                        return error("Element "+i+" is not "+selector);

                    tools[arg1].apply(this, [i, el].concat(a));
                });
            }

            var opt = $.extend({}, def, arg1 || {});

            return $(this).each(function (i) {
                var box     = $(this);

                if (box.is(selector))
                    return error("Element "+i+" is already a '"+name+"' widget");

                var buttons = box.find('[data-buttons]:first');
                var divs    = box.find('[data-divs]:first');

                var change = (function (box, buttons, divs) {
                    var fn = function (ev, oninit) {
                        var
                            t = $(this),
                            i = t.index()
                        ;

                        buttons.children()
                            .not(':eq('+i+')').removeClass('active').end()
                            .eq(i).addClass('active')
                        ;

                        divs.children()
                            .not(':eq('+i+')').removeClass('active').end()
                            .eq(i).addClass('active')
                        ;

                        var data = t.data(key);
                        var first = !data;
                        if (!data) {
                            t.data(key, {
                                first : true
                            });
                        }

                        box.triggerHandler(name+':change', [i, t, divs.children().eq(i), first]);
                    };

                    fn.buttons  = buttons;
                    fn.divs     = divs;
                    fn.box      = box;

                    return fn;
                }(box, buttons, divs));

                buttons.on('click', '> *', change);

                if (opt.active) {
                    var trigger = buttons.find('> :eq('+opt.active+')');
                }
                else {
                    var trigger = buttons.children('.active:first');

                    if (!trigger.length)
                        trigger = divs.children('.active:first');

                    if (!trigger.length)
                        trigger = buttons.children(':first');
                }

                box.data(key, {
                    widget  : name,
                    change  : change
                });

                change.call(trigger, null, 'oninit');
            });
        };

        (function (t) {
            t[name] = function(e) {
                var data = $(e).data(key);

                if (data && data.widget && data.widget === name) {
                    return true;
                }

                return false;
            };
            $.extend($.expr[":"], t);
        }({}));

    }
})('tabs')); // to change name of plugin simply change it in this place

