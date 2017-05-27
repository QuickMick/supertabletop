/**
 * Created by Mick on 27.05.2017.
 */

/**
 * this class is taken from npm module "pixi-extra-filters"
 * unfortunately, the implementation did not work with pixijs v4, so a fix was implemented
 * @param viewWidth
 * @param viewHeight
 * @param thickness
 * @param color
 * @constructor
 */
function OutlineFilter(viewWidth, viewHeight, thickness, color) {
    PIXI.Filter.call(this,
        // vertex shader
        null,
        // fragment shader
        [
            'precision mediump float;',

            'varying vec2 vTextureCoord;',
            'uniform sampler2D uSampler;',

            'uniform float thickness;',
            'uniform vec4 outlineColor;',
            'uniform float pixelWidth;',
            'uniform float pixelHeight;',
            'vec2 px = vec2(pixelWidth, pixelHeight);',

            'void main(void) {',
            '    const float PI = 3.14159265358979323846264;',
            '    vec4 ownColor = texture2D(uSampler, vTextureCoord);',
            '    vec4 curColor;',
            '    float maxAlpha = 0.;',
            '    for (float angle = 0.; angle < PI * 2.; angle += ' + (1 / thickness).toFixed(7) + ') {',
            '        curColor = texture2D(uSampler, vec2(vTextureCoord.x + thickness * px.x * cos(angle), vTextureCoord.y + thickness * px.y * sin(angle)));',
            '        maxAlpha = max(maxAlpha, curColor.a);',
            '    }',
            '    float resultAlpha = max(maxAlpha, ownColor.a);',
            '    gl_FragColor = vec4((ownColor.rgb + outlineColor.rgb * (1. - ownColor.a)) * resultAlpha, resultAlpha);',
            '}'
        ].join('\n'),
        // custom uniforms
        {
            thickness: { type: '1f', value: thickness },
            outlineColor: { type: '4f', value: new Float32Array([0, 0, 0, 1]) },
            pixelWidth: { type: '1f', value: null },
            pixelHeight: { type: '1f', value: null },
        }
    );

    this.color = color;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
};

OutlineFilter.prototype = Object.create(PIXI.Filter.prototype);
OutlineFilter.prototype.constructor = OutlineFilter;
module.exports = OutlineFilter;

Object.defineProperties(OutlineFilter.prototype, {
    color: {
        get: function () {
            return PIXI.utils.rgb2hex(this.uniforms.outlineColor);
        },
        set: function (value) {
            this.uniforms.outlineColor = PIXI.utils.hex2rgb(value);
        }
    },

    viewWidth: {
        get: function () {
            return 1 / this.uniforms.pixelWidth;
        },
        set: function(value) {
            this.uniforms.pixelWidth = 1 / value;
        }
    },

    viewHeight: {
        get: function () {
            return 1 / this.uniforms.pixelHeight;
        },
        set: function(value) {
            this.uniforms.pixelHeight = 1 / value;
        }
    }
});

module.exports = OutlineFilter;