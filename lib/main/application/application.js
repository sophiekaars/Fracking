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
        VIDEO_SLUG = '<video width="' + WIDTH + '" height="' + HEIGHT + '" src="movies/%id.%ext" data-autoplay="%autoplay" data-video="%ident"></video>',

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
            9: ["bottom", 10],
            10: ["bottom", 11, "left", '11a', "right", '11aa'],
            11: ["bottom", 12, "left", '11a', "right", '11aa'],
            12: ["bottom", 13, "left", '12a'],
            '12a': [false, 12],
            
            // 2. Leasing - left
            '9b': ["bottom", '10b'],
            '10b': ["bottom", '11b', "left", '10c'],
            '10c': [false, '10b'],
            '11b': ["right", '11a'],
            '11a': ["left", '11b', "right", 11],
            
            // 2. Leasing - right
            
             '11aa': ["bottom", '12aa'],
             '12aa': ["bottom", 13],
             
             // 3. Prospecting
             
             13: ["left", '14a', "right", '14aa'],
             
             // 3. Prospecting - left
             
             '14a': ["bottom", '15a'],
             '15a': ["bottom", '16a'],
             '16a': ["bottom", '17a', "left", '16b'],
             '16b': ["bottom", '17a', "left", '16c'],
             '16c': [false, '16b'],
             '17a': ["bottom", '18a'],
             '18a': ["bottom", 19],
             
             // 3. Prospecting - right
             
             '14aa': ["bottom", '15aa'],
             '15aa': ["bottom", '16aa'],
             '16aa': ["bottom", '17aa', "left", '16b'],
             '17aa': ["bottom", '18aa'],
             '18aa': ["bottom", 19],
             
             // 4. Financing - middle
             
             19: ["bottom", 20, "left", '19a', "right", '19aa'],
             20: ["bottom", 21],
             21: ["bottom", 22],
             22: ["bottom", 23],
             
             // 4. Financing - left
             
             '19a': ["bottom", '20a', "left", '19b', "right", 19],
             '19b': ["left", '19c', "right", '19a'],
             '19c': ["left", '19d', "right", '19b'],
             '19d': ["bottom", '24f', "left", '19e', "right", '19c'],
             '19e': ["left", '19f', "right", '19d'],
             '20a': ["bottom", '21a'],
             '21a': ["bottom", '22a'],
             '22a': ["bottom", 23],
             
             // 4. Financing - right
             
             '19aa': ["bottom", '20aa'],
             '20aa': ["bottom", '21aa', "right", '20bb'],
             '20bb': ["bottom", '21bb'],
             '21bb': ["bottom", '22bb', "right", '21cc'],
             '21cc': ["left", '21bb', "right", '21dd'],
             '21dd': ["left", '21cc', "right", '21ee'],
             '21ee': ["left", '21dd', "right", '21ff'],
             '21ff': ["left", '21ee', "right", '21gg'],
             '21gg': ["bottom", '25ii', "left", '21ff', "right", '21hh'],
             '21hh': ["left", '21gg', "top", '20hh'],
             '20hh': ["bottom", '21hh', "right", '20ii'],
             '20ii': ["left", '20hh', "right", '20jj'],
             '22bb': ["bottom", '23bb'],
             '23bb': ["left", 23],
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
             
             // 5. Production - right
             
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
        		}
        		4 : 4,
        		'5a': '5a',
        		'7a': '7a',
        		'7b': '7b',
        		'7c': '7c',
        		'15a': '15a',
        		'6aa':{
        		"drawer-maps": [false, '6aa_maps'],
				"drawer-fieldwork": [false, '6aa_fieldwork'],
                "drawer-gravimetry": [false, '6aa_gravimetry'],
                "drawer-geomorphology": [false, '6aa_geomorphology'],
                "drawer-geochemistry": [false, '6aa_geochemistry'],
                "drawer_oil": [false, '6aa_oil'],     
                }
                '14a':{
                "14a-button": [false, '14a'],
                }
        		'15aa': '15aa',
        		'16aa': '16aa',
        		'25jj': '25jj',
        		'26ff': '26ff'
        		
//             '2': '2',
//             '3a': '3a',
//             '4a': {
//                 "4a-button": [false, '4a']
//             },
//             '5a': {
//                 "5a-button": [false, '5a']
//             },
//             '4aa': {
//                 "drawer-maps": [false, '4aa_maps'],
//                 "drawer-fieldwork": [false, '4aa_fieldwork'],
//                 "drawer-gravimetry": [false, '4aa_gravimetry'],
//                 "drawer-geomorphology": [false, '4aa_geomorphology'],
//                 "drawer-geochemistry": [false, '4aa_geochemistry'],
//                 "drawer-surprise": [false, '4aa_oil']
//             },
//             '5aa':'5aa'
         },

        //these are the drawers on your image map.

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
                      "drawer-surprise"
                  ]
                  
                
//             "[id^=4a]": [
//                 "4a-button"
//             ],
//             "[id^=5a]": [
//                 "5a-button"
//             ]
         },

        //this is the duration of each video for each drawer.
         VIDEO_TIMES = {
//             "drawer-maps": 9500,
//             "drawer-fieldwork": 7500,
//             "drawer-gravimetry": 10500,
//             "drawer-geomorphology": 10500,
//             "drawer-geochemistry": 7500,
//             "drawer-surprise": 2500,
//             "4a-button": 4500,
//             "5a-button": 12500
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
                autoDir = restoreDirection;
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
                backward = false;

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

                op = $("[data-index=" + currentScreen + "]");
                o = {
                    scrollTop: op.css("top"),
                    scrollLeft: op.css("left")
                };
            }

            if (backward) pp.trigger("slide-out");
            else op.trigger("slide-in");

            $(".mover").fadeOut("slow");
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
                    var ee = e.find("video"),
                        me = ee[0];
                    if (ee.attr("data-autoplay") === "yes") {
                        me.currentTime = 0;
                        me.play();
                    }
                //  me.playbackRate = 1;
                }
            });

        $("#viewport-scroller")
            .scrollTop(startAt.top)
            .scrollLeft(startAt.left);

        cleanupScroll();

        $.each(mappedVideos, function (selector, elements) {
            $(selector).on("click", function (event) {
                event.preventDefault();
                var e = $(event.target),
                    s = e.parents(".screen");
                if ($.inArray(e.attr("alt"), elements) > -1) {
                    var ee = s.find("video[data-video=" + e.attr("alt") + "]").show(),
                        me = ee[0];

                        if (me) {
                            me.currentTime = 0;
                            me.play();
                            setTimeout(function () {
                                me.pause();
                                me.currentTime = 0;
                                ee.hide();
                            }, INSTANT ? 0 : VIDEO_TIMES[e.attr("alt")]);
                        } else {
                            console.log("no video defined for this map!", e.attr("alt"));
                        }
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
    });

}(window.jQuery));

