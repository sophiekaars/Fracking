/**
 * Copyright (c) 2007-2014 Ariel Flesler - aflesler<a>gmail<d>com | http://flesler.blogspot.com
 * Licensed under MIT
 * @author Ariel Flesler
 * @version 1.4.12
 */
;(function(a){if(typeof define==='function'&&define.amd){define(['jquery'],a)}else{a(jQuery)}}(function($){var j=$.scrollTo=function(a,b,c){return $(window).scrollTo(a,b,c)};j.defaults={axis:'xy',duration:parseFloat($.fn.jquery)>=1.3?0:1,limit:true};j.window=function(a){return $(window)._scrollable()};$.fn._scrollable=function(){return this.map(function(){var a=this,isWin=!a.nodeName||$.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!isWin)return a;var b=(a.contentWindow||a).document||a.ownerDocument||a;return/webkit/i.test(navigator.userAgent)||b.compatMode=='BackCompat'?b.body:b.documentElement})};$.fn.scrollTo=function(f,g,h){if(typeof g=='object'){h=g;g=0}if(typeof h=='function')h={onAfter:h};if(f=='max')f=9e9;h=$.extend({},j.defaults,h);g=g||h.duration;h.queue=h.queue&&h.axis.length>1;if(h.queue)g/=2;h.offset=both(h.offset);h.over=both(h.over);return this._scrollable().each(function(){if(f==null)return;var d=this,$elem=$(d),targ=f,toff,attr={},win=$elem.is('html,body');switch(typeof targ){case'number':case'string':if(/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)){targ=both(targ);break}targ=win?$(targ):$(targ,this);if(!targ.length)return;case'object':if(targ.is||targ.style)toff=(targ=$(targ)).offset()}var e=$.isFunction(h.offset)&&h.offset(d,targ)||h.offset;$.each(h.axis.split(''),function(i,a){var b=a=='x'?'Left':'Top',pos=b.toLowerCase(),key='scroll'+b,old=d[key],max=j.max(d,a);if(toff){attr[key]=toff[pos]+(win?0:old-$elem.offset()[pos]);if(h.margin){attr[key]-=parseInt(targ.css('margin'+b))||0;attr[key]-=parseInt(targ.css('border'+b+'Width'))||0}attr[key]+=e[pos]||0;if(h.over[pos])attr[key]+=targ[a=='x'?'width':'height']()*h.over[pos]}else{var c=targ[pos];attr[key]=c.slice&&c.slice(-1)=='%'?parseFloat(c)/100*max:c}if(h.limit&&/^\d+$/.test(attr[key]))attr[key]=attr[key]<=0?0:Math.min(attr[key],max);if(!i&&h.queue){if(old!=attr[key])animate(h.onAfterFirst);delete attr[key]}});animate(h.onAfter);function animate(a){$elem.animate(attr,g,h.easing,a&&function(){a.call(this,targ,h)})}}).end()};j.max=function(a,b){var c=b=='x'?'Width':'Height',scroll='scroll'+c;if(!$(a).is('html,body'))return a[scroll]-$(a)[c.toLowerCase()]();var d='client'+c,html=a.ownerDocument.documentElement,body=a.ownerDocument.body;return Math.max(html[scroll],body[scroll])-Math.min(html[d],body[d])};function both(a){return $.isFunction(a)||typeof a=='object'?a:{top:a,left:a}};return j}));

/**
 * Main application
 *
 * Copyright (c) 2012 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, indent: 4, maxlen: 79 */
(function ($) {
    "use strict";

    //------------------------------
    //
    // Constants
    //
    //------------------------------

        /**
         * Dimensions of the screens.
         */
    var WIDTH = 1280, HEIGHT = 720,

        /**
         * Ignore slide transition times. This is for debugging only.
         */
        INSTANT = false,

        /**
         * Used to embed videos.
         */
        VIDEO_SLUG = '<video width="' + WIDTH + '" height="' + HEIGHT + '" src="http://d1zd9zhjj7e0j.cloudfront.net/fracking/movies/%id.%ext" data-autoplay="%autoplay" data-video="%ident"></video>',

        /**
         * This can be fast, slow, or a number of milliseconds.
         * So 3 seconds of slide time would be 3000 milliseconds.
         */
        SLIDE_TIME = "slow",

        /**
         * If this variable is true, not only will the explcitly defined
         * directions be enabled for a given screen, but we will ALSO show the
         * inverse of the way they just came in to allow the user to go backwards
         * in the flow.
         *
         * For example, if you clicked on a left bumper to arrive at a screen
         * and this variable is set to true, the right bumper will automagically
         * appear to allow the user to back up a screen.
         *
         * Backup functionality does not apply to screen1, which is understood to
         * be a special screen (the start point of the whole affair).
         */
        canBackUp = true,

        /**
         * Based on the 20 column layout sent in the map, these are the
         * scaled X/Y coordinates of the first screen.
         */
        startAt = {top: 0, left: 10240},
        startScreen = '1a',

        wasBackward = false,

    //------------------------------
    //
    // Properties
    //
    //------------------------------

        /**
         * Always start on the first screen.
         * Screens are labeled first by row then by column based on the map
         * you sent.
         */
        currentScreen = '1a',
        lastScreen = '1a',

        /**
         * We want to label the screens starting at 1 for consistency.
         * Each row of this array should be an array dictating which movers
         * should be enabled when arriving on this screen.
         *
         * This part is a bit offputtingly confusing. We are labeling the
         * screens roughly based on their position that you move to, so we're
         * going to be defining each "direction" as both a direction as well
         * as the screen you "land" on so we know which directions are valid.
         *
         * This array needs to be read from the context of the screen you're on,
         * so the first element in the array indicates "on screen 1, I can move
         * in the bottom direction to arrive at screen 2"
         *
         * An array for a dest will randomly pick one of the destinations.
         *
         * "On screen 2, I can move to the left direction to arrive at screen 3
         *  OR I can move to the right direction to arrive at screen 4."
         *
         * I'm assuming the user can always "back up" a direction. If you want
         * to NOT allow that behavior, change the "canBackUp" variable to false
         * above.
         *
         * If the array starts with a "true" it means "I am an automatic screen
         * and show the given screen after the applied time."
         *
         * The last two argument should map exactly to the index in the object,
         * and the opposite of the direction you took to get there.
         *  myIndex: [true, timeSet, fwdDir, fwdScreen, backScreen, backDir]
         *
         * The timeSet object is a representation of [inSpeed, outSpeed]
         *
         * If the outSpeed is false, the inSpeed will be used for both.
         * If the outSpeed is true, the slide will jump backwards to the original screen not the last screen.
         *
         * If it starts with false, it shows the first arg but moves in the second.
         */
        screenMovers = {

            // 00. Technical
            // Comment these in to preview button types
            // Remember to comment out the real slide1 below when testing!

            // Feeling Lost button: The '5a' argument here is the slide to send them to
            // which as you can see can be anywhere in the presentation.
            //1: [false, '5a'],

            // Restart button: Shows up when you specify the slide as "undefined", which
            // means "allow the user to go back or restart".
            //1: undefined,

            // ===== Moar Technical =====

            // This is debugging, but you can put "true" in front of a randomized array to make it a "psuedorandom" array
            // which will loop through all posibilities before reseeding itself and doin that again whoo!
            //'1a': ["right", [true, '1', '1', '1']],

            // 1. Prospecting - middle
            '1a': ["right", 1, "bottom", [true, '5a', '5aa', '10', '13', '19', '23']],
            //'1a': [["right", "1a-button", 25000], 1, "bottom", [true, '5a', '5aa', '10', '13', '19', '23']],
             1: ["left", '1a', "bottom", 4],
             4: [null, 13000, "left", '5a', "right", '5aa'],

            // 1. Prospecting - left
             '5a': [null, 10000, "bottom", '7a'],
             '7a': [null, 12000, "bottom", '8a', "left", '7b'],
             '7b': [null, 4000, "bottom", '8b', "left", '7c'],
             '7c': [null, 5000, "left", '7d'],
             '7d': [false, '7b'],
             '8b': ["bottom", '9b'],
             '8a': ["bottom", 9, "right", '6aa'],

            // 1. Prospecting - right

            '5aa': ["bottom", '6aa'],
            '6aa': ["bottom", '7aa', "left", '5a'],
            '7aa': ["bottom", '8aa'],
            '8aa': ["bottom", 9],

            // 2. Leasing - middle
            9: [null, 22500, "bottom", 10],
            10: ["bottom", 11, "left", '11a', "right", '11aa'],
            11: [null, 7500, "top", 10, "bottom", 12, "left", '11a', "right", '11aa'],
            12: ["bottom", 13, "left", '12a'],
            '12a': [false, 12],

            // 2. Leasing - left
            '9b': [null, 22500, "bottom", '10b'],
            '10b': ["bottom", '11b', "left", '10c'],
            '10c': ["bottom", '11c', "right", '10b'],
            '11c': ["bottom", '12c'],
            '12c': ["bottom", '13c'],
            '13c': [false, '10b'],
            '11b': [null, 1500, "right", '11a'],
            '11a': [null, 8500, "left", '11b', "right", 11],

            // 2. Leasing - right

             '11aa': ["left", "11", "bottom", '12aa'],
             '12aa': [null, 8500, "bottom", 13],

             // 3. Prospecting

             13: ["left", '14a', "right", '14aa'],

             // 3. Prospecting - left

             '14a': ["bottom", '15a'],
             '15a': [null, 6500, "bottom", '16a'],
             '16a': ["bottom", '17a', "left", '16b'],
             '16b': ["bottom", '17a', "left", '16c'],
             '16c': [false, '16b'],
             '17a': ["bottom", '18a'],
             '18a': ["bottom", 19],

             // 3. Prospecting - right
             //["right", "1a-button", 25000]
             '14aa': ["bottom", '15aa'],
             '15aa': [null, 6500, "bottom", '16aa'],
             '16aa': [null, 4500, "bottom", '17aa', "left", '16b'],
             '17aa': [["bottom", '17aa-button', 8500], '18aa'],
             '18aa': ["bottom", 19],

             // 4. Financing - middle

             19: ["bottom", 20, "left", '19a', "right", '19aa'],
             20: ["bottom", 21],
             21: ["bottom", 22],
             22: ["bottom", 23],

             // 4. Financing - left

             '19a': ["bottom", '20a', "left", '19b', "right", 19],
             '19b': [null, 13500, "left", '19c', "right", '19a'],
             '19c': [null, 8500, "left", '19d', "right", '19b'],
             '19d': ["bottom", '24f', "left", '19e', "right", '19c'],
             '19e': ["left", '19f', "right", '19d'],
             '20a': [null, 23500, "bottom", '21a'],
             '21a': ["bottom", '22a'],
             '22a': ["bottom", 23],

             // 4. Financing - right

             '19aa': ["bottom", '20aa'],
             '20aa': ["bottom", '21aa', "right", '20bb'],
             '20bb': ["bottom", '21bb'],
             '21bb': ["bottom", '22bb', "top", '20bb', "right", '21cc'],
             '21cc': ["bottom", '22cc', "left", '21bb', "right", '21dd'],
             '21dd': ["left", '21cc', "right", '21ee'],
             '21ee': ["left", '21dd', "right", '21ff'],
             '21ff': ["left", '21ee', "right", '21gg'],
             '21gg': ["bottom", '25ii', "left", '21ff', "right", '21hh'],
             '21hh': ["left", '21gg', "top", '20hh'],
             '20hh': ["bottom", '21hh', "right", '20ii'],
             '20ii': ["left", '20hh', "right", '20jj'],
             '22bb': ["bottom", '23bb'],
             '23bb': ["left", 23, "right", '22cc'],
             '22cc': ["left", '23bb', "up", '21cc'],
             '21aa': ["bottom", '22aa'],
             '22aa': ["bottom", 23],

             // 5. Production - crossroads

             23: ["bottom", 24, "left", '24a', "right", '24aa'],

             // 5. Production - middle

             24: ["bottom", 25],
             25: ["bottom", 26],
             26: ["bottom", 27],
             27: ["bottom", 28],
             28: ["bottom", 29, "left", '28a', "right", '28aa'],

             // 5. Production - middle, deviation right

             29: ["right", '29aa'],
             '29aa': ["left", 29, "right", '29bb'],
             '29bb': ["left", '29aa', "right", '29cc'],
             '29cc': ["bottom", '30cc', "left", '29bb', "right", '29dd'],
             '29dd': ["left", '29cc', "top", '28dd'],
             '30cc': ["bottom", '31cc'],
             '31cc': ["bottom", '32cc'],
             '32cc': ["bottom", '33cc'],
             '33cc': ["bottom", '34cc'],

             // 5. Production - left

             '23b': [true, [100, 100], "left", '23d', '27b', 'bottom'],
             '23d': [true, [100, 100], "bottom", '24d', '23b', 'right'],
             '24a': ["bottom", '25a'],
             '25a': ["bottom", '26a'],
             '26a': ["bottom", '27a'],
             '27a': ["bottom", '28a', "left", '27b'],
             '27b': [true, [100, 100], "top", '23b', '27a', 'right'],

             '28a': ["left", '28b', "right", 28],
             '28b': ["left", '28c', "right", '28a'],
             '28c': ["right", '28b', "top", '27c'],
             '27c': ["bottom", '28c', "top", '26c'],
             '26c': ["bottom", '27c',"top", '25c'],
             '25c': ["bottom", '26c',"top", '24c'],
             '24c': ["bottom", '25c', "left", '24d'],

             // 6. Impact - left

             '24d': ["bottom", '25d', "left", '24e', "right", '24c'],
             '25d': ["bottom", '26d'],
             '26d': ["bottom", '21gg'],
             '24e': ["bottom", '25e', "left", '24f', "right", '24d'],
             '25e': ["bottom", '26e'],
             '26e': ["bottom", '27e'],
             '24f': ["left", '24g', "right", '24e'],
             '24g': ["top", '23g', "left", '24h', "right", '24f'],
             '24h': ["bottom", '25h', "left", '24i', "right", '24g'],

             // 5. Impact - right

             '24aa': ["bottom", '25aa'],
             '25aa': ["bottom", '26aa'],
             '26aa': ["bottom", '27aa'],
             '27aa': ["bottom", '28aa'],

             '28aa': ["left", 28, "right", '28bb'],
             '28bb': ["left", '28aa', "right", '28cc'],
             '28cc': ["top", '27cc', "left", '28bb', "right", '28dd'],
             '27cc': ["top", "21gg", "bottom", '28cc'],
             '28dd': ["bottom", '29dd', "left", '28cc', "right", '28ee'],
             '28ee': ["top", '27ee', "left", '28dd'],
             '27ee': ["top", '26ee', "bottom", '28ee'],
             '27gg': ["top", '26gg', "right", '27hh'],
             '27hh': ["top", '26hh', "left", '27gg'],
             '26ee': ["top", '25ee', "bottom", '27ee', "right", '26ff'],
             '26ff': ["top", '25ff', "left", '26ee', "right", '26gg'],
             '26gg': ["top", '25gg', "bottom", '27gg', "left", '26ff', "right", '26hh'],
             '26hh': ["top", '25hh', "bottom", '27hh', "left", '26gg'],
             '25ee': ["bottom", '26ee', "right", '25ff'],
             '25ff': ["bottom", '26ff', "left", '25ee', "right", '25gg'],
             '25gg': ["bottom", '26gg', "left", '25ff', "right", '25hh'],
             '25hh': ["bottom", '26hh', "left", '25gg', "right", '25ii'],
             '25ii': ["top", '21gg', "left", '25hh', "right", '25jj'],
             '25jj': ["left", '25ii', "right", '25kk'],



             //2: [null, 12500, "left", '3a', "right", '3aa'],

            // To the left of the first T junction
//             '3a': [true, [12500, 12500], "bottom", '4a', 2],
//              '4a': ["bottom", '5a', "left", '4b'],
//              '4b': ["left", '4c'],
//              '4c': ["left", '4d'],
//              '4d': [false, '4a'],
//              '5a': ["right", '4aa',"bottom", 6],

            // To the right of the first T junction
//              '3aa': [true, [1000, false], "bottom", '4aa', 2],
//              '4aa': ["bottom", '5aa', "left", '3a'],
//              '5aa': [null, 9500, "bottom", 6],

            // Leasing
//              6: ["bottom", 7],
//              7: ["left", '8a', "right", '8aa'],

            // Leasing left
//             '8a': ["bottom", '9a', "left", '8b'],
//             '8b': ["left", '8c'],
//             '8c': [false, '8a'],
//             '9a': ["bottom", 10],

            //Leasing right
//             '8aa': ["bottom", '9aa'],
//             '9aa': ["bottom", 10],

            //Prospecting
//             10: ["left", '11a', "right", '11aa'],
//             '11a': ["bottom", 12],
//             '11aa': ["bottom", 12],
//
//             // Seismology
//             12: [true, [3000, false], "bottom", 13],
//             13: ["bottom", 14],
//             14: ["bottom", 15],
//             15: [true, [1000, false], "bottom", 16],

            // Last in the menu so we don't need to worry about commas
            0: []
        },

        // To make a new coordinate, the formula is:
        // slideNumber: [XX, YY]
        //
        // If the slide number is '4a':
        //   * You get the X coord from any other slide labeled "a".
        //   * You get the Y coord from any other slide labeled "4".
        //
        // And slide 1a is:
        // 1a: [*217*, 10],
        //
        // So slide 4 is:
        // 4: [242, *54*],
        //
        // So slide 4a would he at:
        // 4a: [217, 54]
        minimapCoordinates = {
            '1a': [217, 10],
            1: [242, 10],
            4: [242, 54],

            // 1. Prospecting - left
             '5a': [218, 67],
             '7a': [218, 96],
             '7b': [191, 96],
             '7c': [166, 96],
             '7d': [141, 96],
             '8b': [191, 111],
             '8a': [218, 111],

            // 1. Prospecting - right

            '5aa': [268, 67],
            '6aa': [268, 81],
            '7aa': [268, 95],
            '8aa': [268, 110],

            // 2. Leasing - middle
            9: [242, 125],
            10: [242, 139],
            11: [242, 153],
            12: [242, 168],
            '12a': [218, 168],

            // 2. Leasing - left
            '9b': [242, 125],
            '10b': [191, 139],
            '10c': [166, 139],
            '11b': [191, 153],
            '11a': [218, 153],

            // 2. Leasing - right

             '11aa': [268, 153],
             '12aa': [268, 168],

             // 3. Prospecting

             13: [242, 181],

             // 3. Prospecting - left

             '14a': [218, 196],
             '15a': [218, 210],
             '16a': [191, 225],
             '16b': [191, 225],
             '16c': [166, 225],
             '17a': [218, 239],
             '18a': [218, 253],

             // 3. Prospecting - right

             '14aa': [268, 196],
             '15aa': [268, 210],
             '16aa': [268, 225],
             '17aa': [268, 239],
             '18aa': [268, 253],

             // 4. Financing - middle

             19: [242, 268],
             20: [242, 282],
             21: [242, 296],
             22: [242, 310],

             // 4. Financing - left

             '19a': [218, 268],
             '19b': [191, 268],
             '19c': [166, 268],
             '19d': [140, 268],
             '19e': [115, 268],
             '20a': [218, 282],
             '21a': [218, 296],
             '22a': [218, 310],

             // 4. Financing - right

             '19aa': [268, 268],
             '20aa': [268, 282],
             '20bb': [294, 282],
             '21bb': [294, 296],
             '21cc': [320, 296],
             '21dd': [343, 296],
             '21ee': [370, 296],
             '21ff': [395, 296],
             '21gg': [420, 296],
             '21hh': [445, 296],
             '20hh': [445, 282],
             '20ii': [471, 282],
             '22bb': [294, 310],
             '23bb': [294, 325],
             '21aa': [268, 296],
             '22aa': [268, 310],

             // 5. Production - crossroads

             23: [242, 325],

             // 5. Production - middle

             24: [242, 339],
             25: [242, 353],
             26: [242, 367],
             27: [242, 381],
             28: [242, 396],

             // 5. Production - middle, deviation right

             29: [242, 410],
             '29aa': [268, 410],
             '29cc': [320, 410],
             '29dd': [343, 410],
             '30cc': [320, 424],
             '31cc': [320, 439],
             '32cc': [320, 454],
             '33cc': [320, 468],

             // 5. Production - left

             '28a': [218, 396],
             '28b': [191, 396],
             '28c': [166, 396],
             '27c': [166, 381],
             '26c': [166, 367],
             '25c': [166, 353],
             '24c': [166, 339],

             // 6. Impact - left

             '24d': [140, 339],
             '25d': [140, 353],
             '26d': [140, 367],
             '24e': [115, 339],
             '25e': [115, 353],
             '26e': [115, 367],
             '24f': [91, 339],
             '24g': [65, 339],
             '24h': [40, 339],

             // 5. Production - right

             '24aa': [268, 339],
             '25aa': [268, 353],
             '26aa': [268, 367],
             '27aa': [268, 381],

             '28aa': [268, 396],
             '28bb': [294, 396],
             '28cc': [320, 396],
             '27cc': [320, 381],
             '28dd': [343, 396],
             '28ee': [370, 396],
             '27ee': [370, 381],
             '27gg': [420, 381],
             '27hh': [445, 381],
             '26ee': [370, 367],
             '26ff': [395, 367],
             '26gg': [420, 367],
             '26hh': [445, 367],
             '25ee': [370, 353],
             '25ff': [395, 353],
             '25gg': [420, 353],
             '25hh': [445, 353],
             '25ii': [471, 353],
             '25jj': [497, 353]
        },

        videoSlides = {

                '1a': {
                    "1a-button":[false, '1a'],
                },
                '10': {
                    "10-button-leasing":[false, '10'],
                },
                4 : 4,
                '5a': '5a',
                '7a': '7a',
                '7b': '7b',
                '7c': '7c',
                '8a':{
                    "8a-shale": [false, '8a'],
                },

                '8b':{
                    "8b-shale": [false, '8b'],
                },
                '15a': '15a',
                '5aa': {
                    "lightbox": [false, '5aa'],
                },
                '6aa': {
                    "drawer-maps": [false, '6aa_maps'],
                    "drawer-fieldwork": [false, '6aa_fieldwork'],
                    "drawer-gravimetry": [false, '6aa_gravimetry'],
                    "drawer-geomorphology": [false, '6aa_geomorphology'],
                    "drawer-geochemistry": [false, '6aa_geochemistry'],
                    "drawer-oil": [false, '6aa_oil'],
                },
                '14a': {
                    "14a-button": [false, '14a'],
                },
                '14aa': {
                    "14aa-button": [false, '14aa'],
                },
                '17a' : '17a',
                '17aa': {
                    "17aa-button": [false, '17aa'],
                },
                '15aa': '15aa',
                '16aa': '16aa',
                '25ii': {
                	"25ii-button": [false, '25ii'],
                },
                '25jj': '25jj',
                '26ff': '26ff',
                '27gg':{
                    "27gg-tap": [false, '27gg'],
                },
                9 : 9,
                '9b' : '9b',
                '10b' : {
                	"10b-screen": [false, '10b'],
                },
                11 : 11,
                '11a' : '11a',
                '11b' : '11b',
                12 : {
                	"12-button": [false, 12],
                },
                '12aa' : {
                	"12aa-door": [false, '12aa'],
                },
                '18a' : {
                    '18a-button': [false, '18a'],
                },
                '18aa' : {
                    '18aa-button': [false, '18aa'],
                },
                '19b' : '19b',
                '19c' : '19c',
                '19d' : '19d',
                '19e' : '19e',
                20 : {
                	"20-drawer" : [false, 20],
                },
                '20a' : {
                	"20a-drawer" : [false, '20a'],
                },
                '20aa' : {
                	"20aa-drawer" : [false, '20aa'],
                },
                '20ii' : {
                	"20ii-button": [false, '20ii'],
                },
                '20hh' : {
                	"20hh-button1": [false, '20hh_1'],
              		"20hh-button2": [false, '20hh_2'],
                },
                21 : 21,
                '21a' : '21a',
                '21aa' : {
                	"21aa-button": [false, '21aa'],
                },
                '21bb' : '21bb',
                '21dd' : {
                	"21dd-button1": [false, '21dd_1'],
              		"21dd-button2": [false, '21dd_2'],
                },
                '21ee' : {
                	"21ee-button1": [false, '21ee_1'],
              		"21ee-button2": [false, '21ee_2'],
                },
                '21ff' : {
                	"21ff-button1": [false, '21ff_1'],
              		"21ff-button2": [false, '21ff_2'],
                },
                '21gg' : {
                	"21gg-button1": [false, '21gg_1'],
              		"21gg-button2": [false, '21gg_2'],
                },
                '21hh' : {
                	"21hh-button1": [false, '21hh_1'],
                	"21hh-button2": [false, '21hh_2'],
                },
                23 : {
                	"23-button": [false, 23],
                },
                '24c' : {
                	"24c-button": [false, '24c'],
                },
                '24e' : {
                	"24e-button": [false, '24e'],
                },
                25 : 25,
                '25aa' : '25aa',
                '25bb' : {
                	"25bb-lock": [false, '25bb'],
                },
                '25ff' : {
                	"25ff-button": [false, '25ff'],
                },
                '25hh' : '25hh',
                26 : 26,
                '26a' : '26a',
                '26c' : '26c',
                '26ee' : '26ee',
                '26gg' : {
                	"26gg-button": [false, '26gg'],
                },
                '26hh' : {
                	"26hh-door": [false, '26hh'],
                },
                '27aa' : '27aa',
                '27cc' : {
                	"27cc-button": [false, '27cc'],
                },
                '27hh' : {
                	"27hh-door": [false, '27hh'],
                },
                '28bb' : {
                	"28bb-plunger": [false, '28bb'],
                },
                '28b' : '28b',
                '28dd' : '28dd',
                '28ee' : '28ee',
                '29aa' : {
                	"29aa-button1": [false, '29aa-pipe1'],
                	"29aa-button2": [false, '29aa-pipe2'],
                },
                '29bb' : '29bb',
                '31cc' : '31cc',
                '33c': {
                	"33c-button" : [false, '33c'],
                }

         },

         externalHotspots = {
            "[alt^=7d]": {
                "7d-hotspot": "http://en.wikipedia.org/wiki/Geology"
            },
            "[alt^=11aa]": {
                "11aa-amish": "http://www.onearth.org/articles/2013/01/when-fracking-hits-amish-country"
            },
            "[alt^=12a]": {
                "12a-hotspot": "http://rafiusa.org/issues/landowner-rights-and-fracking/"
            },
            "[alt^=13c]": {
                "13c-hotspot": "http://en.wikipedia.org/wiki/Hedge_fund"
            },
            "[alt^=16c]": {
                "16c-hotspot": "http://en.wikipedia.org/wiki/Seismology"
            },
            "[alt^=19f]": {
                "19f-hotspot": "http://www.opec.org/opec_web/en/"
            },
            "[alt^=20gg]": {
                "20gg-hotspot": "http://www.internationalrivers.org/earthquakes-triggered-by-dams"
            },
            "[alt^=20jj]": {
                "20jj-hotspot": "http://www.epa.gov/cleanenergy/energy-resources/renewabledatabase.html/"
            },
            "[alt^=22cc]": {
                "20cc-hotspot": "http://www.biobasedeconomy.nl/routekaart/"
            },
            "[alt^=24i]": {
            	"24i-hotspot": "http://www.nytimes.com/2013/07/03/opinion/friedman-the-amazing-energy-race.html?_r=1&"
            },
            "[alt^=25bb]": {
            	"25bb-hotspot": "http://www.theambassador.dk/"
            },
            "[alt^=25kk]": {
            	"25kk-hotspot": "http://www.nrdc.org/energy/gasdrilling/"
            },
            "[alt^=29dd]": {
                "29dd-hotspot": "http://www.data.scec.org/recent/recenteqs/Maps/Los_Angeles.html"
            },
            "[alt^=34cc]": {
                "34cc-hotspot": "http://www.eia.gov/"
            }
         },

        //these are the drawers on your image map.

        thenTo = {
            "[alt^=10]": [2000, "bottom", "left", "right"]
        },

        useLastFrame = ["17aa-button"],

         mappedVideos = {
                "[alt^=1a]": [
                     "1a-button"
                ],
                 "[alt^=drawer]": [
                      "drawer-maps",
                      "drawer-fieldwork",
                      "drawer-gravimetry",
                      "drawer-geomorphology",
                      "drawer-geochemistry",
                      "drawer-oil"
                  ],
                  "[alt^=10]": [
                    "10-button-leasing"
                  ],
                  "[alt^=12]": [
                    "12-button"
                  ],
                  "[alt^=lightbox]": [
                  "lightbox"
                  ],
                  "[alt^=14a]": [
                  "14a-button"
                  ],
                  "[alt^=8a]": [
                     "8a-shale"
                  ],
                  "[alt^=8b]": [
                     "8b-shale"
                  ],
                  "[alt^=12aa]": [
                    "12aa-door"
                  ],
                  "[alt^=14aa]": [
                  	"14aa-button"
                  ],
                  "[alt^=17aa]": [
                  	"17aa-button"
                  ],
                  "[alt^=18a]": [
                  	"18a-button"
                  ],
                   "[alt^=18aa]": [
                  	"18aa-button"
                  ],
                  "[alt^=20]": [
                  	"20-drawer"
                  ],
                  "[alt^=20a]": [
                  	"20a-drawer"
                  ],
                  "[alt^=20aa]": [
                  	"20aa-drawer"
                  ],
                  "[alt^=20ii]": [
                  	"20ii-button"
                  ],
                  "[alt^=20hh]": [
                  	"20hh-button1",
              		"20hh-button2"
                  ],
                  "[alt^=21aa]": [
                  	"21aa-button"
                  ],
                  "[alt^=21dd]": [
                  	"21dd-button1",
              		"21dd-button2"
                  ],
                  "[alt^=21ee]": [
                  	"21ee-button1",
              		"21ee-button2"
                  ],
                  "[alt^=21ff]": [
                  	"21ff-button1",
              		"21ff-button2"
                  ],
                  "[alt^=21gg]": [
                  	"21gg-button1",
              		"21gg-button2"
                  ],
                  "[alt^=21hh]": [
                  	"21hh-button1",
                  	"21hh-button2"
                  ],
                  "[alt^=23]": [
                  	"23-button"
                  ],
                  "[alt^=24c]": [
                  	"24c-button"
                  ],
                  "[alt^=24e]": [
                  	"24e-button"
                  ],
                  "[alt^=25bb]": [
                  	"25bb-lock"
                  ],
                  "[alt^=25ff]": [
                  	"25ff-button"
                  ],
                  "[alt^=26gg]": [
                  	"26gg-button"
                  ],
                  "[alt^=26hh]": [
                  	"26hh-door"
                  ],
                  "[alt^=27cc]": [
                  	"27cc-button"
                  ],
                  "[alt^=27gg]": [
                  	"27gg-tap"
                  ],
                  "[alt^=27hh]": [
                  	"27hh-door"
                  ],
                  "[alt^=28bb]": [
                  	"28bb-plunger"
                  ],
                  "[alt^=29aa]": [
                  	"29aa-button1",
                  	"29aa-button2"
                  ],
                  "[alt^=33c]": [
                  	"33c-button"
                  ],
                  "[alt^=10b]": [
                  	"10b-screen"
                  ]
         },

        //this is the duration of each video for each drawer.
         VIDEO_TIMES = {
              "1a-button" : 25500,
              "drawer-maps" : 6500,
              "drawer-fieldwork" : 5500,
              "drawer-gravimetry" : 6500,
              "drawer-geomorphology" : 10500,
              "drawer-geochemistry" : 7000,
              "drawer-oil" : 3500,
              "lightbox" : 2000,
              "8a-shale" : 11500,
              "8b-shale" : 12500,
              "12-button" : 18500,
              "12aa-door" : 8500,
              "14a-button" : 5500,
              "14aa-button" : 4500,
              "17aa-button" : 8500,
              "18a-button" : 8500,
              "18aa-button" : 8500,
              "20aa-drawer" : 21500,
              "20a-drawer" : 23500,
              "20-drawer" : 20500,
              "20hh-button1" : 6500,
              "20hh-button2" : 13500,
              "20ii-button" : 8500,
              "21aa-button" : 8500,
              //"21cc-button"
              "21dd-button1" : 8500,
              "21dd-button2" : 11500,
              "21ee-button1" : 9500,
              "21ee-button2" : 5500,
              "21ff-button1" : 7500,
              "21ff-button2" : 10500,
              "21gg-button1" : 5500,
              "21gg-button2" : 11500,
              "21hh-button1" : 5500,
              "21hh-button2" : 7500,
              "23-button" : 5500,
              "24c-button" : 8500,
              "24e-button" : 7500,
              "25bb-lock" : 10500,
              "25ff-button" : 10500,
              "26gg-button" : 8500,
              "26hh-door" : 3500,
              "27cc-button" : 7500,
              "27gg-tap" : 3000,
              "29aa-button1" : 8500,
			  "29aa-button2" : 5500,
              "33c-button" : 7500,
              "10-button-leasing" : 2000,
              "10b-screen": 9500
         },

        restoreDirection;

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    VIDEO_SLUG = VIDEO_SLUG.replace("%ext", (window.mozInnerScreenX === undefined) ? "mp4" : "ogv");

    //------------------------------
    //
    // Event bindings
    //
    //------------------------------

    /**
     * Called after we finish sliding to a new screen, this method enables
     * the proper movers for the given screen to allow the user to navigate
     * the labyrinth.
     */
    function cleanupScroll(bakwards, specific) {
        var opts = screenMovers[currentScreen],
            index = 0,
            dir, screen, retScreen, dirx, origar, shold,
            // Used below
            canGo, delay, autoDir, autoScreen, optSpec;

        // If the options for movers aren't defined, we're probably at the end
        // of the presentation. We create an empty array here so if we're in
        // goBackwards mode we can properly have that work even at the end
        // of the presentation.
        //
        // @TODO: Add in the ability to "return to the start". Maybe a hideous
        // button in the middle of the screen for now?
        if (opts === undefined) {
            opts = [];
            $("#restart").fadeIn("slow");
        } else {
            $("#restart").fadeOut("fast");
        }

        if (opts[0] === false) {
            opts.shift();
            optSpec = opts.shift();
            $("#specific").fadeIn("slow").attr("data-move-to", optSpec);
        } else {
            $("#specific").fadeOut("fast");
        }

        if (opts[0] === null) {
            var newOpts = [].concat(opts);
            newOpts.shift();
            var delay = newOpts.shift();

            if (currentScreen !== 1 && canBackUp && !specific) {
                canGo = true;
                $.each(newOpts, function (k, v) {
                    if (typeof v === "string") {
                        if (v === restoreDirection) {
                            canGo = false;
                            return false;
                        }
                    }
                });

                if (canGo) {
                    $("[data-index=" + currentScreen + "]").attr("data-backward", restoreDirection);
                    opts.push(restoreDirection, lastScreen);
                    newOpts.push(restoreDirection, lastScreen);
                }
            }

            setTimeout(function () {
               for (; index < newOpts.length; index += 2) {
                    dir = newOpts[index];
                    screen = newOpts[index + 1];
                    var p = $("#" + dir + "-move").parent();
                    $("#" + dir + "-move")
                        .attr("data-screen", screen)
                        .show().detach().appendTo(p);
                }
            }, INSTANT ? 0 : (bakwards ? 0 : delay));
        } else if (opts[0] === true) {
            delay = opts[1];
            autoDir = opts[2];
            autoScreen = opts[3];

            if (bakwards) {
                // We are going backwards, invert everything
                autoScreen = opts[4];
                autoDir = opts[5];
            } else {
				$("[data-index=" + currentScreen + "]").attr("data-backward", restoreDirection);
			}

            if (delay[1] === true) {
                retScreen = lastScreen;
                delay = delay[0];
            } else if (delay[1] === false) {
                retScreen = currentScreen;
                delay = delay[0];
            } else {
                retScreen = currentScreen;
                delay = delay[1];
            }

            // Perform an automagic delayed screen transition
            setTimeout(function () {
                $("#" + autoDir + "-move")
                    .attr("data-screen", autoScreen)
                    .attr("data-return", retScreen)
                    .click();
            }, INSTANT ? 0 : delay);
        } else {
            if (currentScreen !== 1 && canBackUp && !specific) {
                canGo = true;
                $.each(opts, function (k, v) {
                    if (typeof v === "string") {
                        if (v === restoreDirection) {
                            canGo = false;
                            return false;
                        }
                    } else if ($.isArray(v)) {
                        if (v[0] === restoreDirection) {
                            canGo = false;
                            return false;
                        }
                    }
                });
                if (canGo) {
                    $("[data-index=" + currentScreen + "]").attr("data-backward", restoreDirection);
                    opts.push(restoreDirection, lastScreen);
                }
            }

            for (; index < opts.length; index += 2) {
                dir = opts[index];
                screen = opts[index + 1];

                var video = null,
                    time = null;

                if ($.isArray(dir)) {
                    video = dir[1];
                    time = dir[2];
                    dir = dir[0];
                }

                if ($.isArray(screen)) {
                    if (screen[0] === true) {
                        screen.shift();
                        if ($.isArray(screen[0])) {
                            origar = screen.shift();
                        } else {
                            origar = [].concat(screen);
                        }

                        if (screen.length > 0) {
                            dirx = Math.floor(Math.random() * screen.length);
                            shold = screen[dirx];
                            screen.splice(dirx, 1);
                        }

                        opts[index + 1] = [true, origar].concat(screen.length <= 0 ? origar : screen);
                        screen = shold;
                    } else {
                        screen = screen[Math.floor(Math.random() * screen.length)];
                    }
                }

                $("#" + dir + "-move")
                    .attr("data-video", video)
                    .attr("data-video-time", time)
                    .attr("data-screen", screen)
                    .fadeIn("slow");
            }
        }

        if (optSpec !== undefined) {
            opts.unshift(optSpec);
            opts.unshift(false);
        }
    }

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    $(function () {
        /**
         * We define a simple function to move the user in a given direction
         * based on where they currently are.
         *
         * We are positioning the screens absolutely using the css, so we simply
         * need to "walk" the viewport around to center it on the appropriate
         * screen.
         *
         * The system keeps track of what it's moving to based on its index.
         */
        $(".mover").on("click", function (event) {
            event.preventDefault();

            var scTop = 0,
                scLeft = 0,
                op,
                pp = $("[data-index=" + currentScreen + "]"),
                o,
                e = $(this),
                restart = (e.attr("id") === "restart"),
                specific = (e.attr("id") === "specific"),
                backward = false,
                currentVideo = null,
                currentVideoTime = null;

            if (restart) {
                lastScreen = startScreen;
                currentScreen = startScreen;
                restoreDirection = undefined;
                op = $("[data-index=" + startScreen + "]");
                backward = true;
                o = {
                    scrollTop: startAt.top,
                    scrollLeft: startAt.left
                };
            } else if (specific) {
                lastScreen = e.attr("data-move-to");
                currentScreen = lastScreen;
                backward = true;

                op = $("[data-index=" + currentScreen + "]");
                o = {
                    scrollTop: op.css("top"),
                    scrollLeft: op.css("left")
                };
            } else {
                backward = pp.attr("data-backward") + "-move" === e.attr("id");

                switch (e.attr("id")) {
                case "top-move":
                    restoreDirection = "bottom";
                    break;

                case "left-move":
                    restoreDirection = "right";
                    break;

                case "bottom-move":
                    restoreDirection = "top";
                    break;

                case "right-move":
                    restoreDirection = "left";
                    break;
                }

                lastScreen = e.attr("data-return") || currentScreen;
                currentScreen = e.attr("data-screen");
                e.attr("data-return", "");

                currentVideo = e.attr("data-video");
                currentVideoTime = e.attr("data-video-time");

                op = $("[data-index=" + currentScreen + "]");
                o = {
                    scrollTop: op.css("top"),
                    scrollLeft: op.css("left")
                };
            }

            currentVideoTime = currentVideoTime || 0;

            if (currentVideo) {
                if (!hasPlayedVideos[currentVideo]) {
                    playVideo(pp, currentVideo);
                } else {
                    currentVideoTime = 0;
                }
            }

            $(".mover").fadeOut("slow");

            setTimeout(function () {
                if (backward) pp.trigger("slide-out");
                else op.trigger("slide-in");

                $("#viewport-scroller").animate(o, SLIDE_TIME, function () {
                    cleanupScroll(backward, specific);
                });

                var mm = minimapCoordinates[currentScreen],
                    oset = $("#yah").offset().top - 100;

                    console.log(oset);

                if (mm) {
                    $("#yah").animate({
                        marginLeft: mm[0],
                        marginTop: mm[1]
                    }, SLIDE_TIME);

                    $("#star").css({
                        marginLeft: mm[0],
                        marginTop: mm[1]
                    });
                } else {
                    $("#yah").animate({opacity: 0}, SLIDE_TIME, function () {
                        $("#yah").animate({opacity: 1}, SLIDE_TIME);
                    });
                }
            }, currentVideoTime || 0);
        });

        $.each(videoSlides, function (idx, vset) {
            var video,
                autoplay = true;
            if ($.isPlainObject(vset)) {
                $.each(vset, function (name, def) {
                    if ($.isArray(def)) {
                        var ap = def[0],
                            vp = def[1];
                    } else {
                        var ap = false,
                            vp = def;
                    }

                    $("[data-index=" + idx + "]").append(VIDEO_SLUG.replace("%id", vp).replace("%autoplay", ap ? "yes" : "no").replace("%ident", name));
                });
                return;
            } else if ($.isArray(vset)) {
                autoplay = vset[0];
                video = vset[1];
            } else {
                video = vset;
            }
            $("[data-index=" + idx + "]").append(VIDEO_SLUG.replace("%id", video).replace("%autoplay", autoplay ? "yes" : "no").replace("%ident", "video-" + video));
        });

        $("[data-index]")
            .on("slide-out", function (event) {
                var e = $(event.target);
                if (videoSlides[e.attr("data-index")]) {
                    e.find("video[data-autoplay=no]").hide();
                }
            })
            .on("slide-in", function (event) {
                var e = $(event.target);
                if (videoSlides[e.attr("data-index")]) {
                    var ee = e.find("video");
                    $.each(ee, function (i, me) {
                        var mee = $(me);
                        if (mee.attr("data-autoplay") === "yes") {
                            me.currentTime = 0;
                            me.play();
                        }
                        if (e.hasClass("last-frame")) {
                            delete hasPlayedVideos[mee.attr("data-video")];
                            e.removeClass("last-frame");
                        }
                    });
                //  me.playbackRate = 1;
                }
            });

        $("#viewport-scroller")
            .scrollTop(startAt.top)
            .scrollLeft(startAt.left);

        cleanupScroll();

        function openIframe(url) {
            $("#external").show().html($(document.createElement("iframe")).attr("src", url));
            $("#close-external").show();
        }

        $("#close-external").on("click", function (event) {
            event.preventDefault();
            $("#external").empty().hide();
            $("#close-external").hide();
        });

        $.each(externalHotspots, function (selector, elements) {
            $.each(elements, function (altcode, dest) {
                $("[alt=" + altcode + "]").on("click", function (event) {
                    event.preventDefault();
                    openIframe(dest);
                });
            });
        });

        $.each(thenTo, function (selector, rando) {
            $(selector).on("click", function (event) {
                var random = $.extend(true, [], rando);
                var time = random.shift(),
                    dirx = Math.floor(Math.random() * random.length),
                    scrn = random[dirx];
                $(".mover").fadeOut("slow");
                setTimeout(function () {
                    $("#" + scrn + "-move").click();
                }, time);
            });
        });

        $.each(mappedVideos, function (selector, elements) {
            $(selector).on("click", function (event) {
                event.preventDefault();
                var e = $(event.target),
                    s = e.parents(".screen");
                if ($.inArray(e.attr("alt"), elements) > -1) {
                    playVideo(s, e.attr("alt"));
                } else {
                    console.log("no video defined for this map!", e.attr("alt"));
                }
            });
        });

        if (window.location.search.match(/oneway/)) {
            canBackUp = false;
        }

        $("#open").on("click", function () {
            $("#minimap-viewport").show();
        });

        $("#close").on("click", function () {
            $("#minimap-viewport").hide();
        });

        $("h1").attr("title", "Click to refresh the presentation").css("cursor", "pointer").on("click", function () {
            window.location.reload();
        });
    });

    var hasPlayedVideos = {};

    function playVideo(s, id) {
        var ee = s.find("video[data-video=" + id + "]").show(),
            me = ee[0];

        if (me) {
            me.currentTime = 0;
            me.play();
            setTimeout(function () {
                me.pause();
                me.currentTime = 0;
                ee.hide();
                if ($.inArray(id, useLastFrame) !== -1) {
                    s.addClass("last-frame");
                    hasPlayedVideos[id] = true;
                }
            }, INSTANT ? 0 : VIDEO_TIMES[id]);
        } else {
            console.log("no video defined for this map!", id);
        }
    }

    /*! Idle Timer v1.0.1 2014-03-21 | https://github.com/thorst/jquery-idletimer | (c) 2014 Paul Irish | Licensed MIT */
    !function(a){a.idleTimer=function(b,c){var d;"object"==typeof b?(d=b,b=null):"number"==typeof b&&(d={timeout:b},b=null),c=c||document,d=a.extend({idle:!1,timeout:3e4,events:"mousemove keydown wheel DOMMouseScroll mousewheel mousedown touchstart touchmove MSPointerDown MSPointerMove"},d);var e=a(c),f=e.data("idleTimerObj")||{},g=function(b){var d=a.data(c,"idleTimerObj")||{};d.idle=!d.idle,d.olddate=+new Date;var e=a.Event((d.idle?"idle":"active")+".idleTimer");a(c).trigger(e,[c,a.extend({},d),b])},h=function(b){var d=a.data(c,"idleTimerObj")||{};if(null==d.remaining){if("mousemove"===b.type){if(b.pageX===d.pageX&&b.pageY===d.pageY)return;if("undefined"==typeof b.pageX&&"undefined"==typeof b.pageY)return;var e=+new Date-d.olddate;if(200>e)return}clearTimeout(d.tId),d.idle&&g(b),d.lastActive=+new Date,d.pageX=b.pageX,d.pageY=b.pageY,d.tId=setTimeout(g,d.timeout)}},i=function(){var b=a.data(c,"idleTimerObj")||{};b.idle=b.idleBackup,b.olddate=+new Date,b.lastActive=b.olddate,b.remaining=null,clearTimeout(b.tId),b.idle||(b.tId=setTimeout(g,b.timeout))},j=function(){var b=a.data(c,"idleTimerObj")||{};null==b.remaining&&(b.remaining=b.timeout-(+new Date-b.olddate),clearTimeout(b.tId))},k=function(){var b=a.data(c,"idleTimerObj")||{};null!=b.remaining&&(b.idle||(b.tId=setTimeout(g,b.remaining)),b.remaining=null)},l=function(){var b=a.data(c,"idleTimerObj")||{};clearTimeout(b.tId),e.removeData("idleTimerObj"),e.off("._idleTimer")},m=function(){var b=a.data(c,"idleTimerObj")||{};if(b.idle)return 0;if(null!=b.remaining)return b.remaining;var d=b.timeout-(+new Date-b.lastActive);return 0>d&&(d=0),d};if(null===b&&"undefined"!=typeof f.idle)return i(),e;if(null===b);else{if(null!==b&&"undefined"==typeof f.idle)return!1;if("destroy"===b)return l(),e;if("pause"===b)return j(),e;if("resume"===b)return k(),e;if("reset"===b)return i(),e;if("getRemainingTime"===b)return m();if("getElapsedTime"===b)return+new Date-f.olddate;if("getLastActiveTime"===b)return f.lastActive;if("isIdle"===b)return f.idle}return e.on(a.trim((d.events+" ").split(" ").join("._idleTimer ")),function(a){h(a)}),f=a.extend({},{olddate:+new Date,lastActive:+new Date,idle:d.idle,idleBackup:d.idle,timeout:d.timeout,remaining:null,tId:null,pageX:null,pageY:null}),f.idle||(f.tId=setTimeout(g,f.timeout)),a.data(c,"idleTimerObj",f),e},a.fn.idleTimer=function(b){return this[0]?a.idleTimer(b,this[0]):this}}(jQuery);

    $.idleTimer(300000);

    $(document).bind("idle.idleTimer", function(){
        window.location.reload();
    });

    $(function () {
        if (window.isDoneLoading) {
            $("#screen").fadeOut("fast");
        } else {
            setTimeout(function () {
                $("#screen").fadeOut("fast");
            }, 30000);
        }
    });

}(window.jQuery));


window.isDoneLoading = false;
var html5Preloader = (function () {

var XHR = typeof XMLHttpRequest === 'undefined' ? function () { // IE FIX
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch (err1) {}
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.3.0");
        } catch (err2) {}

        return null;
    } : XMLHttpRequest,
    AudioElement = typeof Audio !== 'undefined' ? // IE FIX
        function(){
            return new Audio();
        } :
        function(){
            return document.createElement('audio');
        },
    VideoElement = typeof Video !== 'undefined' ? // IE FIX
        function () {
            return new Video();
        } :
        function () {
            return document.createElement('video');
        },
    ImageElement = function () {
        return new Image();
    },
    codecs = { // Chart from jPlayer
        oga: { // OGG
            codec: 'audio/ogg; codecs="vorbis"',
            media: 'audio'
        },
        wav: { // PCM
            codec: 'audio/wav; codecs="1"',
            media: 'audio'
        },
        webma: { // WEBM
            codec: 'audio/webm; codecs="vorbis"',
            media: 'audio'
        },
        mp3: {
            codec: 'audio/mpeg; codecs="mp3"',
            media: 'audio'
        },
        m4a: { // AAC / MP4
            codec: 'audio/mp4; codecs="mp4a.40.2"',
            media: 'audio'
        },
        ogv: { // OGG
            codec: 'video/ogg; codecs="theora, vorbis"',
            media: 'video'
        },
        webmv: { // WEBM
            codec: 'video/webm; codecs="vorbis, vp8"',
            media: 'video'
        },
        m4v: { // H.264 / MP4
            codec: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
            media: 'video'
        }
    },
    support = {
        imageTypes: ['jpg', 'png', 'jpeg', 'tiff', 'gif']
    },
    ID_PREFIX = 'FILE@';
/* :) may fail sometimes, but these are the most common cases */
codecs.ogg = codecs.oga;
codecs.mp4 = codecs.m4v;
codecs.webm = codecs.webmv;

function isIn (needle, haystack) {
    for (var i=0; i<haystack.length; i++) {
        if (haystack[i] === needle) {
            return true;
        }
    }

    return false;
}

function map (arr, callback) {
    if (arr.map) {
        return arr.map(callback);
    }

    var r = [],
        i;
    for (i=0; i<arr.length; i++) {
        r.push(callback(arr[i]));
    }

    return r;
}

function bind (func, self) {
    return func.bind ? func.bind(self) : function () {
        return func.apply(self, arguments);
    };
}

function delay (callback) {
    var args = [].slice.call(arguments, 1);
    setTimeout(function () {
        callback.apply(this, args);
    }, 0);
}

function EventEmitter () {
    var k;
    for (k in EventEmitter.prototype) {
        if (EventEmitter.prototype.hasOwnProperty(k)) {
            this[k] = EventEmitter.prototype[k];
        }
    }
    this._listeners = {};
};

EventEmitter.prototype = {
    _listeners: null,

    emit: function (name, args) {
        args = args || [];
        if (this._listeners[name]) {
            for (var i=0; i<this._listeners[name].length; i++) {
                this._listeners[name][i].apply(this, args);
            }
        }
        return this;
    },

    on: function (name, listener) {
        this._listeners[name] = this._listeners[name] || [];
        this._listeners[name].push(listener);
        return this;
    },

    off: function (name, listener) {
        if (this._listeners[name]) {
            if (!listener) {
                delete this._listeners[name];
                return this;
            }
            for (var i=0; i<this._listeners[name].length; i++) {
                if (this._listeners[name][i] === listener) {
                    this._listeners[name].splice(i--, 1);
                }
            }
            this._listeners[name].length || delete this._listeners[name];
        }
        return this;
    },

    once: function (name, listener) {
        function ev () {
            this.off(ev);
            return listener.apply(this, arguments);
        }

        return this.on(name, ev);
    }
};

function loadFile (file, callback, timeout) {
    if (!(this instanceof loadFile)) {
        return new loadFile(file, callback, timeout);
    }

    var self        = this,
        alternates  = [],
        a, b, c, t;

    if (typeof file === 'string') {
        a = file.split('*:');
        b = a[ a[1] ? 1 : 0 ].split('||');
        self.id = a[1] ? a[0] : b[0];
        self.alternates = alternates;

        for (a=0; a<b.length; a++) {
            c = b[a].split('.');
            c = c[c.length - 1].toLowerCase();

            t = codecs[c] ? codecs[c].media : isIn(c, support.imageTypes) ? 'image' : 'document';

            if (codecs[c] && !codecs[c].supported) {
                continue;
            }

            alternates.push({
                type: t,
                path: b[a]
            });
        }

        alternates.length || alternates.push({
            type: t,
            path: b[a-1]
        });
    } else {
        delay(callback, TypeError('Invalid path'), self);
        return;
    }

    function loadNext() {
        var file = alternates.shift(),
            _timeoutTimer = null;

        if (!file) {
            delay(callback, {e: Error('No viable alternatives')}, null);
            return;
        }

        if (typeof timeout === 'number') {
            _timeoutTimer = setTimeout(function() {
                delay(callback, {e: Error('Load event not fired within ' + timeout + 'ms')}, self);
            }, timeout);
        }

        new loadFile[file.type](
                file.path,
                function (e, f) {

                    _timeoutTimer && clearTimeout(_timeoutTimer);

                    self.dom = f && f.dom;

                    if (e && self.alternates.length) {
                        return loadNext();
                    }

                    callback(e, self);
                });
    }

    loadNext();
}

function MediaFile (construct) {
    return function (filename, callback) {
        var self = this,
            file = construct();

        function onready () {
            file.onload = file.onerror = null;
            file.removeEventListener && file.removeEventListener('canplaythrough', onready, true);

            callback(null, self);
        }

        file.addEventListener && file.addEventListener('canplaythrough', onready, true);
        file.onload = onready;
        file.onerror = function (e) {
            callback(e, self);
        };

        self.dom = file;
        file.src = filename;

        file.load && file.load();
    };
}

loadFile.audio = MediaFile(AudioElement);
loadFile.video = MediaFile(VideoElement);
loadFile.image = MediaFile(ImageElement);

loadFile.document = function (file, callback) {
    var self        = this,
        parsedUrl   = /(\[(!)?(.+)?\])?$/.exec(file),
        mimeType    = parsedUrl[3],
        xhr     = self.dom = new XHR();

    if (!xhr) {
        delay(callback, Error('No XHR!'), self);
        return;
    }

    file        = file.substr(0, file.length - parsedUrl[0].length);
    file        += parsedUrl[2] ? (file.indexOf('?') === -1 ? '?' : '&') + 'fobarz=' + (+new Date) : '';

    mimeType && xhr.overrideMimeType(mimeType === '@' ? 'text/plain; charset=x-user-defined' : mimeType);

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        try {
            self.dom = xhr.responseXML && xhr.responseXML.documentElement ?
                xhr.responseXML :
                String(xhr.responseText || '') ;

            xhr.status === 200 ?
                callback(null, self) :
                callback({e: Error('Request failed: ' + xhr.status)}, self) ;
        } catch (e) {
            callback({e: e}, self);
        }
    };

    xhr.onerror = function (e) {
        callback(e, self);
    };

    xhr.open('GET', file, true);
    xhr.send();
};

(function () {
    var     dummyAudio = AudioElement(),
        dummyVideo = VideoElement(),
        i;

    support.audio = !!dummyAudio.canPlayType;
    support.video = !!dummyVideo.canPlayType;

    support.audioTypes = [];
    support.videoTypes = [];

    for (i in codecs) {
        if (codecs.hasOwnProperty(i)) {
            if (codecs[i].media === 'video') {
                (codecs[i].supported = support.video &&
                    dummyVideo.canPlayType(codecs[i].codec)) &&
                    support.videoTypes.push(i);
            } else if (codecs[i].media === 'audio') {
                (codecs[i].supported = support.audio &&
                    dummyAudio.canPlayType(codecs[i].codec)) &&
                    support.audioTypes.push(i);
            }
        }
    }
}());

if (!support.audio) {
    loadFile.audio = function (a, callback) {
        delay(callback, Error('<AUDIO> not supported.'), a);
    };
}
if (!support.video) {
    loadFile.video = function (a, callback) {
        delay(callback, Error('<VIDEO> not supported.'), a);
    };
}

function html5Preloader () {
    var self = this,
        args = arguments;

    if (!(self instanceof html5Preloader)) {
        self = new html5Preloader();
        args.length && self.loadFiles.apply(self, args);
        return self;
    }

    self.files = [];

    html5Preloader.EventEmitter.call(self);

    self.loadCallback = bind(self.loadCallback, self);

    args.length && self.loadFiles.apply(self, args);
}

html5Preloader.prototype = {
    active: false,
    files: null,
    filesLoading: 0,
    filesLoaded: 0,
    filesLoadedMap: {},
    timeout: null,

    loadCallback: function (e, f) {

        if (!this.filesLoadedMap[f.id]) {
            this.filesLoaded++;
            this.filesLoadedMap[f.id] = f;
        }

        this.emit(e ? 'error' : 'fileloaded', e ? [e, f] : [f]);

        if (this.filesLoading - this.filesLoaded === 0) {
            this.active = false;
            this.emit('finish');
            this.filesLoading = 0;
            this.filesLoaded = 0;
        }
    },

    getFile: function (id) {
        return  typeof id === 'undefined' ? map(this.files, function (f) {
                return f.dom;
            }) :
            typeof id === 'number' ? this.files[id].dom :
            typeof id === 'string' ? this.files[ID_PREFIX + id].dom :
            null;
    },

    removeFile: function (id) {
        var f, i;
        switch (typeof id) {
        case 'undefined':
            this.files = [];
            break;
        case 'number':
            f = this.files[id];
            this.files[ID_PREFIX + f.id] && delete this.files[ID_PREFIX + f.id];
            this.files.splice(id, 1);
            break;
        case 'string':
            f = this.files[ID_PREFIX + id];
            f && delete this.files[ID_PREFIX + id];

            for (i=0; i<this.files.length; i++) {
                this.files[i] === f && this.files.splice(i--, 1);
            }
        }
    },

    loadFiles: function () {
        var files   = [].slice.call(arguments),
            i, f;

        for (i=0; i<files.length; i++) {
            f = html5Preloader.loadFile(files[i], this.loadCallback, this.timeout);
            this.files.push(f);
            this.files[ID_PREFIX + f.id] = f;
            this.filesLoading++;
        }

        this.active = this.active || !!this.filesLoading;
    },

    addFiles: function (list) {
        return this.loadFiles.apply(this, list instanceof Array ? list : arguments);
    },

    getProgress: function () {
        return this.filesLoading ? this.filesLoaded / this.filesLoading : 1.0;
    }
};

html5Preloader.support = support;
html5Preloader.loadFile = loadFile;
html5Preloader.EventEmitter = EventEmitter;

return html5Preloader;

}());

var loader = html5Preloader();
loader.addFiles('http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/1.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/10.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/10a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/10aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/10b.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/10c.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/11.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/11a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/11aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/11b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/11c.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/12.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/12a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/12aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/12c.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/13.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/13a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/13aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/13c.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/14.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/14a.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/14aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/15a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/15aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/16.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/16a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/16aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/16b.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/16c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/17a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/17aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/17aa_last.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/17b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/18.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/18a.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/18aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19e.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/19f.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/1a.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/2.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20bb.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20e.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20gg.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20hh.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20ii.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/20jj.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21bb.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21cc.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21dd.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21ee.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21f.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21ff.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21gg.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/21hh.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/22.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/22a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/22aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/22bb.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/22f.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23bb.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23f.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23ff.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23g.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23gg.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/23hh.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24c.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24e.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24ee.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24f.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24ff.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24g.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24h.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24hh.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24i.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/24ii.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25bb.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25dd.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25e.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25ee.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25ff.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25g.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25gg.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25h.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25hh.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25ii.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25ii.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25jj.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/25kk.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26e.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26ee.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26ff.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26g.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26gg.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26h.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/26hh.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27cc.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27e.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27ee.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27gg.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/27hh.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28bb.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28cc.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28dd.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/28ee.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/29.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/29aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/29bb.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/29cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/29dd.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/2a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/3.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/30cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/30dd.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/31cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/32cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/33cc.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/34cc.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/3a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/4.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/4a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/4aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/5.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/5a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/5aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/6.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/6a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/6aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/7.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/7a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/7aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/7b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/7c.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/7d.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/8.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/8a.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/8aa.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/8b.gif',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/9.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/9a.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/9aa.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/9b.jpg',
'http://d1zd9zhjj7e0j.cloudfront.net/fracking/images/minimap.png');

        loader.on('finish', function(){
            if (window.jQuery && window.jQuery("#screen")) {
                $("#screen").fadeOut("fast");
            } else {
                window.isDoneLoading = true;
            }
        });
