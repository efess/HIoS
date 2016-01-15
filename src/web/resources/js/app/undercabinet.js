
var Promise = require('promise');
var $ = require('jquery');
var ajax = require('./ajax');
var spectrum = require('spectrum');

var presets = {
    party: [
        0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
        0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
        0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
        0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
    ],
    christmas: [
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF,
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF,
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF,
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF        
    ],
    cute: [
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC,
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC,
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC,
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC
    ],
    dawn: [
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233,
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233,
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233,
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233
    ],
    bluegreen: [
        0x0000FF, 0x0000FF, 0x0000FF, 0x0000FF,
        0xFFFFFF, 0xFFFFFF, 0x0000FF, 0x00FF00,
        0x00FF00, 0x0000FF, 0x0000FF, 0xFFFFFF,
        0xFFFFFF, 0x0000FF, 0x00FF00, 0x0000FF        
    ],
    rainbow: [
        0xFF0000, 0xD52A00, 0xAB5500, 0xAB7F00,
        0xABAB00, 0x56D500, 0x00FF00, 0x00D52A,
        0x00AB55, 0x0056AA, 0x0000FF, 0x2A00D5,
        0x5500AB, 0x7F0081, 0xAB0055, 0xD5002B
    ]
}
var last = {
    r: 0,
    g: 0,
    b: 0
}
var currentPallete = presets.party;

var changedPallete= false;
var led_array = [];
var led_count = 100;
var animationStates = [];
var PartyColors_p = [
    0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
    0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
    0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
    0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
];

function red(color) { return color >> 16;}
function green(color) { return (color >> 8) & 0xFF;}
function blue(color) { return color & 0xFF;}
function combine(r,g,b) { return (r << 16) | (g << 8) | b; }
function random(min, max) {
    if(min && !max && max != 0) {
        max = min;
        min = 0;
    } else {
        min = min || 0;
        max = max || 0xFF;
    }
    return Math.floor(Math.random() * (max - min) + min);
}
function max(a, b, c) {
     var m = a;
     (m < b) && (m = b);
     (m < c) && (m = c);
     return m;
}
function setColor(color) {
    $('.pixel').css('background-color', 'rgb('+ color.r+','+ color.g+','+ color.b+')');
    last = color;
}
function blendA(color1, color2, alph) {
    var alpha = alph + 1;
    var inv_alpha = 256 - alph;
    
    return combine((red(color1) * alpha + inv_alpha * red(color2)) >> 8, 
        (green(color1) * alpha + inv_alpha * green(color2)) >> 8,
        (blue(color1) * alpha + inv_alpha * blue(color2)) >> 8);
}
function scale(value, maxValue) {
    return ((value || 1) * maxValue) >> 8;
}
function scaleC(color, maxValue) {
    // scale
    if(maxValue == 0xFF) {
        return;
    }
    return {
        r: scale(color.r, maxValue),
        g: scale(color.g, maxValue),
        b: scale(color.b, maxValue)
    };
}
function changeBrightness(color, newBrightness) {
    var maxValue = max(color.r, color.g, color.b) || 1;
    return {
        r: Math.round((color.r * newBrightness) / maxValue),
        g: Math.round((color.g * newBrightness) / maxValue),
        b: Math.round((color.b * newBrightness) / maxValue),
    }
}
var undercabinet = {
    hookupEvents: function(){
        $('input', $('#color-red')).on('change', undercabinet.changeColor);
        $('input', $('#color-green')).on('change', undercabinet.changeColor);
        $('input', $('#color-blue')).on('change', undercabinet.changeColor);
        $('.do-animate').on('click', undercabinet.animate);
        $('.send-color').on('click', undercabinet.sendToDevice);
        
        var simulation = $('.led-simulation');
        for(var i = 0; i < led_count; i++) {
            var newPixel = document.createElement('div');
            newPixel.className = 'pixel';
            newPixel.id = "pix-" + i;
            simulation.append(newPixel);
        }
        var presetLists = $('.pallete-preset');
        for(var key in presets) {
            presetLists.append('<option value="'+ key + '">'+ key + '</option>');
        }
        var selectList = $('.animation-list');
        selectList.append('<option value="0">None</option>');
        selectList.append('<option value="1">Smooth Color motion</option>');
        selectList.append('<option value="2">Twinkle</option>');
        selectList.append('<option value="4">Runner</option>');
        selectList.append('<option value="5">Discrete</option>');
        
        var transitionLists = $('.transition-list');
        
        transitionLists.append('<option value="0">None</option>');
        transitionLists.append('<option value="1">Fade</option>');
        transitionLists.append('<option value="2">Pixelate</option>');
        $('.pallete-preset', $('.animation-testing')).on('change', function(e) {
            currentPallete = presets[$(e.target).val()];    
        });
        
        $('.color-value').spectrum({
            showAlpha: false,
            showInput: false,
            showPalette: true,
            showSelectionPalette: true,
            localStorageKey: "spectrum.picker",
            clickoutFiresChange: true,
            showButtons: false,
            replacerClassName: 'picker-val',
            change: function(color) {
                changedPallete = true
            }
        }); 
        $('.pallete-preset', $('.pallete-setting')).on('change', function(e){
            changedPallete= true;
            var presetVal = $(e.target).val();
            for(var i = 0; i < presets[presetVal].length; i++ ){
                $('.p' + i, $('.pallete-setting')).spectrum("set",
                 'rgb(' + red(presets[presetVal][i]) + ',' + green(presets[presetVal][i]) + ',' + blue(presets[presetVal][i]) + ')');
            }
        });
    }, 
    changeColor: function(){
        var red = $('input', $('#color-red')).val(),
            green = $('input', $('#color-green')).val(),
            blue = $('input', $('#color-blue')).val();
            $('.color-part-value-disp', $('#color-red')).text(red);
            $('.color-part-value-disp', $('#color-green')).text(green);
            $('.color-part-value-disp', $('#color-blue')).text(blue);
            
            $('.color-preview').css('background-color', 'rgb('+ red+','+ green+','+ blue+')');

            var color = (red << 16) | (green << 8) | blue;
            $('.color-value').text(color);
    },
    sendToDevice: function() {
        var payload = {
            color: {
                red: $('input', $('#color-red')).val(),
                green: $('input', $('#color-green')).val(),
                blue: $('input', $('#color-blue')).val()
            },
            options: {
                occupied: {
                    brightness: $('.occupied .brightness input').val(),
                    animation: $('.occupied .animation select').val(),
                    transition: $('.occupied .transition select').val(),
                },
                unoccupied: {
                    brightness: $('.unoccupied .brightness input').val(),
                    animation: $('.unoccupied .animation select').val(),
                    transition: $('.unoccupied .transition select').val(),
                }
            }
        }
        // Only send pallete if it changed
        if(changedPallete) {
            var pallete = [];
            var $palleteSetting = $('.pallete-setting');
            for(var i = 0; i < 16; i++ ){
                var color = $('.p' + i, $palleteSetting).spectrum("get");
                pallete.push((color._r << 16) | (color._g << 8) | (color._b));
            }
            payload.pallete = pallete;
        }
        undercabinet.postChanges(payload);
        changedPallete = false;
    },
    pullCurrentState: function(){
        var statusBox = $('.status-message');
        ajax.post('/undercabinet/getState', '')
            .then(function(resp) {
                statusBox.removeClass('error-message');
                statusBox.hide();
                undercabinet.setCurrentState(resp);
            }, function _fail() {
                statusBox.addClass('error-message');
                statusBox.text("Failed polling device... Yell at Joe!");
                statusBox.show();
            });
    },
    setCurrentState: function(stateData) {
        var options = stateData.options;
        var color = stateData.color;
        
        $('.occupied .brightness input').val(options.occupied.brightness);
        $('.occupied .animation select').val(options.occupied.animation);
        $('.occupied .transition select').val(options.occupied.transition);
        
        $('.unoccupied .brightness input').val(options.unoccupied.brightness);
        $('.unoccupied .animation select').val(options.unoccupied.animation);
        $('.unoccupied .transition select').val(options.unoccupied.transition);
        
        $('input', $('#color-red')).val(red(color));
        $('input', $('#color-green')).val(green(color));
        $('input', $('#color-blue')).val(blue(color));
        
        $('.color-preview').css('background-color', 'rgb('+ red(color)+','+ green(color)+','+ blue(color)+')');

        $('.color-value').text(color);
        $('.color-part-value-disp', $('#color-red')).text(red(color));
        $('.color-part-value-disp', $('#color-green')).text(green(color));
        $('.color-part-value-disp', $('#color-blue')).text(blue(color));
         
        if(stateData.pallete) {
            var $palleteSetting = $('.pallete-setting');
            var pallete = stateData.pallete;
            for(var i = 0; i < pallete.length; i++ ){
                $('.p' + i, $palleteSetting).spectrum("set",
                 'rgb(' + red(pallete[i]) + ',' + green(pallete[i]) + ',' + blue(pallete[i]) + ')');
            }
        }
    },
    postChanges: function(payload) {
        ajax.post('/undercabinet/changeOptions', JSON.stringify(payload), {
            contentType: "application/json; charset=utf-8"});
    },
    animate: function() {
        var animap = { 
            1: undercabinet.animations.floatingGradients,
            2: undercabinet.animations.twinkle
            //1: undercabinet.animations.,
            //1: undercabinet.animations.floatingGradients,
        };
        var animationSelection = parseInt($('.animation-list', $('.animation-testing')).val());
            animationStates.forEach(function(states) {
                states.stop = true;
            });
        if(animationSelection === 0) {
            return;
        }
        if(animap[animationSelection]){
            undercabinet.animationLoop(animap[animationSelection]);
        }
    },
    animationLoop: function(frameFn, options){
        function doFrame(state){
            if(!state) {
                state = {
                    done: false,
                    frameNum: 0,
                    options: options || {}
                }
                animationStates.push(state);
            } else {
                state.frameNum++;
            }
            if(!state.done && !state.stop){
                frameFn(state);
                setTimeout(doFrame, 30, state);
            } else {
                var idx = animationStates.indexOf(state);
                if(idx >= 0) {
                    animationStates.splice(idx, 1);
                }
            }
        }
        
        doFrame();
    },
    animations: {
        pixelate: function(state) {
            var frameCount = 20;
            
            if(!state.toColor) {
                var red = $('input', $('#color-red')).val(),
                    green = $('input', $('#color-green')).val(),
                    blue = $('input', $('#color-blue')).val();
                    
                state.toColor = {
                    r: parseInt(red),
                    g: parseInt(green),
                    b: parseInt(blue)  
                };
                state.cache = [];
                state.pixelsPerTransition = led_count / 20;
                for(var i = 0; i < 13; i++)
                {
                    state.cache.push(0);
                }
            }
           
            if(state.frameNum < frameCount) {
                var pixelsInTransition = 0;
                var pixel = 0;
                while(pixelsInTransition < state.pixelsPerTransition)
                {
                    pixel = Math.round(Math.random(Date.now()) * 100 % 100);
                    if(!((state.cache[pixel >> 3] >> (pixel % 8)) & 1))
                    {
                        state.cache[pixel >> 3] |= (1 << (pixel % 8));
                        $('#pix-' + pixel).css('background-color', 'rgb('+ state.toColor.r+','+ state.toColor.g+','+ state.toColor.b+')');
                        //ws2812.setPixelColor(pixel, toColor);
                        pixelsInTransition++;
                    }
                }
            } else {
                for(var i = 0; i < led_count; i++)
                {
                    $('.pixel').css('background-color', 'rgb('+ state.toColor.r+','+ state.toColor.g+','+ state.toColor.b+')');
                }
                last = state.toColor;
                state.done = true;
            }
        },
        floatingGradients: function(state) {
            var pallete = currentPallete;
            var numOfRandoms = 4;

            var palleteSize = pallete.length;
            var divisor = Math.floor(led_count / pallete.length);

            var RANDOM_NODE_COUNT = 4;
            var randomIdxOffset = palleteSize;

            if(!state.setup){
                state.cache = [];
                state.randomCount = RANDOM_NODE_COUNT;
                // mark values that will have random movement
                for(var i = 0; i < state.randomCount; i++) {
                    var rand = random(2, 5);
                    if(i > 0) {
                        rand += state.cache[randomIdxOffset + i - 1];
                    }
                    if(rand < palleteSize) {
                        state.cache[randomIdxOffset + i] = rand;
                    } else {
                        state.randomCount--;
                    }
                }
                state.freqOffset = palleteSize + state.randomCount;
                state.randomOffsetValue = state.freqOffset + state.randomCount;

                for(var i = 0; i < numOfRandoms; i++) {
                    state.cache[state.freqOffset + i] = random(100, 200);
                }

                for(var i = 0; i < palleteSize; i++) {
                    // set start locations
                    state.cache[i] = divisor * (i + 1);
                }
                for(var i = 0; i < state.randomCount; i++) {
                    state.cache[state.randomOffsetValue + i] = state.cache[state.cache[randomIdxOffset + i]];
                }
                state.setup = true;
            }

            for(var i = 0; i < state.randomCount; i++) {
                state.cache[state.cache[randomIdxOffset + i]] = (state.cache[state.randomOffsetValue + i] +
                    Math.floor(Math.sin(state.frameNum / state.cache[state.freqOffset + i]) * 90)) % led_count;
            }

            var stretch = Math.floor(state.frameNum  / 6) % led_count;//Math.floor(Math.sin(state.frameNum / 200) * 90 + 20);

            function setColor(idx, color) {
                $('#pix-' + idx).css('background-color', 'rgb(' + red(color) + ',' + green(color)+ ',' + blue(color) + ')');
            }
            var DIFFUSE_WIDTH = 15;
            function alpha_level(distance){
                return  distance / DIFFUSE_WIDTH * 255;
            }
            led_array = [];
            for(var i = 0; i < led_count; i ++) {
                led_array[i] = 0;
            }
            for(var i = 0; i < palleteSize - 1; i++) {
                var thisColor = pallete[i];
                var position = state.cache[i]+ stretch;

                for(var j = -DIFFUSE_WIDTH + 1; j < DIFFUSE_WIDTH; j++) {
                    var k = (j + position + led_count ) % led_count;
                    // Use GetPixel/SetPixel on arduino
                    led_array[k] = blendA(led_array[k], thisColor, alpha_level(Math.abs(j)));
                }
            }

            for(var i = 0; i < led_count; i++) {
                setColor(i, led_array[i]);
            }
        },
        twinkle: function(state) {
            var normal = last;
            var brightness = max(normal.r, normal.g, normal.b);
            if(brightness == 0xFF) {
                state.done = true;
                // can't do brighter than max....
                return;
            }
            var twinkleVal = 0xFF >> 1;
            var difference = 0xFF - brightness;
            
            if(!state.setup) { 
                state.setup = true;
                state.cache = [];
                for(var i = 0 ; i < led_count; i++) {
                    state.cache[i] = 0;
                }
            }
            var newTwinkles = 0;
            if(0 === random(0, 7)) {
                newTwinkles = random(0, Math.ceil(led_count * .02 + 1));
            }
            
            for(var i = 0; i < newTwinkles; i++) {
                var nextTwinkle = random(0, led_count);
                if(state.cache[nextTwinkle] === 0) {
                    state.cache[nextTwinkle] = twinkleVal;
                }
            }
            
            for(var i = 0; i < led_count; i++) {
                if(state.cache[i] > 0) {
                    state.cache[i] -= 2;
                } else {
                    state.cache[i] = 0;
                }
            }
            for(var i = 0; i < led_count; i++)
            {
                var entry = normal;
                if(state.cache[i] > 0 && !(random(0, 20) === 0)){
                    
                    entry = changeBrightness(normal, brightness + Math.ceil((state.cache[i] / twinkleVal) * difference));
                }
                $('#pix-' + i).css('background-color', 'rgb('+ entry.r+','+ entry.g+','+ entry.b+')');
            }
        },
        fade: function(state) {
            var frameCount = 20;
            
            if(!state.toColor) {
                var red = $('input', $('#color-red')).val(),
                    green = $('input', $('#color-green')).val(),
                    blue = $('input', $('#color-blue')).val();
                state.fromColor = last;
                state.currentColor = last;
                state.toColor = {
                    r: parseInt(red),
                    g: parseInt(green),
                    b: parseInt(blue)  
                };
                state.steps = {
                    rStep: Math.round((state.toColor.r - last.r) / frameCount),
                    gStep: Math.round((state.toColor.g - last.g) / frameCount),
                    bStep: Math.round((state.toColor.b - last.b) / frameCount)
                }
            }
            // function setColor(color) {
            //     $('.pixel').css('background-color', 'rgb('+ color.r+','+ color.g+','+ color.b+')');
            //     last = color;
            // }
            if(state.frameNum < frameCount - 1){
                state.currentColor = {
                    r: state.currentColor.r + state.steps.rStep,
                    g: state.currentColor.g + state.steps.gStep,
                    b: state.currentColor.b + state.steps.bStep
                };
                setColor(state.currentColor);
            } else {
                setColor(state.toColor);
                state.done = true;
            }
        }
    }
}

$(document).ready(function(){

    undercabinet.hookupEvents();
    undercabinet.pullCurrentState();
}); 
 
module.exports = undercabinet;