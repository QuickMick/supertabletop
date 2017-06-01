/**
 * Created by Mick on 01.06.2017.
 */

require('pixi.js');
require('pixi-extra-filters');

var core = PIXI.filters;
var BlurFilter = core.BlurFilter;
var BlurXFilter = core.BlurXFilter;
var VoidFilter = core.VoidFilter;

'use strict';
function BlurYTintFilter() {
    PIXI.Filter.call(this,
        // vertex shader
        [
            'attribute vec2 aVertexPosition;',
            'attribute vec2 aTextureCoord;',
            'attribute vec4 aColor;',

            'uniform float strength;',
            'uniform vec2 offset;',
            'uniform mat3 projectionMatrix;',

            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',
            'varying vec2 vBlurTexCoords[6];',

            'void main(void) {',
            '   gl_Position = vec4((projectionMatrix * vec3((aVertexPosition+offset), 1.0)).xy, 0.0, 1.0);',
            '   vTextureCoord = aTextureCoord;',
            '   vBlurTexCoords[ 0] = aTextureCoord + vec2(0.0, -0.012 * strength);',
            '   vBlurTexCoords[ 1] = aTextureCoord + vec2(0.0, -0.008 * strength);',
            '   vBlurTexCoords[ 2] = aTextureCoord + vec2(0.0, -0.004 * strength);',
            '   vBlurTexCoords[ 3] = aTextureCoord + vec2(0.0,  0.004 * strength);',
            '   vBlurTexCoords[ 4] = aTextureCoord + vec2(0.0,  0.008 * strength);',
            '   vBlurTexCoords[ 5] = aTextureCoord + vec2(0.0,  0.012 * strength);',

            '   vColor = vec4(aColor.rgb * aColor.a, aColor.a);',
            '}'
        ].join('\n'),
        // fragment shader
        [
            'precision lowp float;',
            'varying vec2 vTextureCoord;',
            'varying vec2 vBlurTexCoords[6];',
            'varying vec4 vColor;',

            'uniform vec3 color;',
            'uniform float alpha;',

            'uniform sampler2D uSampler;',
            'void main(void) {',
            '    vec4 sum = vec4(0.0);',

            '   sum += texture2D(uSampler, vBlurTexCoords[ 0])*0.004431848411938341;',
            '   sum += texture2D(uSampler, vBlurTexCoords[ 1])*0.05399096651318985;',
            '   sum += texture2D(uSampler, vBlurTexCoords[ 2])*0.2419707245191454;',
            '   sum += texture2D(uSampler, vTextureCoord     )*0.3989422804014327;',
            '   sum += texture2D(uSampler, vBlurTexCoords[ 3])*0.2419707245191454;',
            '   sum += texture2D(uSampler, vBlurTexCoords[ 4])*0.05399096651318985;',
            '   sum += texture2D(uSampler, vBlurTexCoords[ 5])*0.004431848411938341;',

            '   gl_FragColor = vec4( color.rgb * sum.a * alpha, sum.a * alpha );',
            '}'
        ].join('\n')
    );

    this.uniforms.blur = 1 / 512;
    this.uniforms.color = new Float32Array([0, 0, 0]);
    this.uniforms.alpha = 0.7;
    this.uniforms.offset = new Float32Array([5, 5]);
    this.uniforms.strength = 1;

    this.passes = 1;
    this.strength = 4;
}

BlurYTintFilter.prototype = Object.create(PIXI.Filter.prototype);
BlurYTintFilter.prototype.constructor = BlurYTintFilter;

BlurYTintFilter.prototype.apply = function(filterManager, input, output, clear) {
    this.uniforms.strength = (1 / output.size.height) * (output.size.height / input.size.height);

    this.uniforms.strength *= this.strength;
    this.uniforms.strength /= this.passes;

    if (this.passes === 1) {
        filterManager.applyFilter(this, input, output, clear);
    } else {
        var renderTarget = filterManager.getRenderTarget(true);
        var flip = input;
        var flop = renderTarget;

        for (var i = 0; i < this.passes - 1; i++) {
            filterManager.applyFilter(this, flip, flop, clear);

            var temp = flop;
            flop = flip;
            flip = temp;
        }

        filterManager.applyFilter(this, flip, output, clear);
        filterManager.returnRenderTarget(renderTarget);
    }
};

Object.defineProperties(BlurYTintFilter.prototype, {
    blur: {
        get: function() {
            return this.strength;
        },
        set: function(value) {
            this.padding = value * 0.5;
            this.strength = value;
        }
    }
});

function DropShadowFilter() {
    PIXI.Filter.call(this);

    this.blurXFilter = new BlurXFilter();
    this.blurYTintFilter = new BlurYTintFilter();
    this.defaultFilter = new VoidFilter();

    this.padding = 30;

    this._dirtyPosition = true;
    this._angle = 45 * Math.PI / 180;
    this._distance = 10;
    this.alpha = 0.75;
    this.hideObject = false;
    this.blendMode = PIXI.BLEND_MODES.MULTIPLY;
}

DropShadowFilter.prototype = Object.create(PIXI.Filter.prototype);
DropShadowFilter.prototype.constructor = DropShadowFilter;

DropShadowFilter.prototype.apply = function(filterManager, input, output) {
    var renderTarget = filterManager.getRenderTarget(true);

    if (this._dirtyPosition) {
        this._dirtyPosition = false;
        this.blurYTintFilter.uniforms.offset[0] = Math.sin(this._angle) * this._distance;
        this.blurYTintFilter.uniforms.offset[1] = Math.cos(this._angle) * this._distance;
    }

    filterManager.applyFilter(this.blurXFilter, input, renderTarget, true);
    filterManager.renderer.state.setBlendMode(this.blendMode);

    filterManager.applyFilter(this.blurYTintFilter, renderTarget, output, false);
    filterManager.renderer.state.setBlendMode(PIXI.BLEND_MODES.NORMAL);

    if(!this.hideObject) {
        filterManager.applyFilter(this.defaultFilter, input, output);
    }

    filterManager.returnRenderTarget(renderTarget);
};

Object.defineProperties(DropShadowFilter.prototype, {
    blur: {
        get: function() {
            return this.blurXFilter.blur;
        },
        set: function(value) {
            this.blurXFilter.blur = this.blurYTintFilter.blur = value;
        }
    },
    blurX: {
        get: function() {
            return this.blurXFilter.blur;
        },
        set: function(value) {
            this.blurXFilter.blur = value;
        }
    },
    blurY: {
        get: function() {
            return this.blurYTintFilter.blur;
        },
        set: function(value) {
            this.blurYTintFilter.blur = value;
        }
    },
    color: {
        get: function() {
            return PIXI.utils.rgb2hex(this.blurYTintFilter.uniforms.color);
        },
        set: function(value) {
            PIXI.utils.hex2rgb(value, this.blurYTintFilter.uniforms.color);
        }
    },
    alpha: {
        get: function() {
            return this.blurYTintFilter.uniforms.alpha;
        },
        set: function(value) {
            this.blurYTintFilter.uniforms.alpha = value;
        }
    },
    distance: {
        get: function() {
            return this._distance;
        },
        set: function(value) {
            this._dirtyPosition = true;
            this._distance = value;
        }
    },
    angle: {
        get: function() {
            return this._angle;
        },
        set: function(value) {
            this._dirtyPosition = true;
            this._angle = value;
        }
    }
});

module.exports = DropShadowFilter;