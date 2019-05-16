const SHADER_VERT = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;


const SHADER_FRAG = `
#include <packing>

uniform sampler2D tDiffuse;
varying vec2 vUv;


float luma( vec3 col ){
    float light = 0.2126*col.r + 0.7152*col.g + 0.0722*col.b;
    return light;
}

float circle( vec2 _st, float _rad) {
    vec2 dist = _st - vec2(0.5);
    return 1. - smoothstep(_rad-0.001, _rad+0.001, dot(dist, dist)*5.);
}

void main()
{
    // normalize coords
    vec2 st = vUv;
    st.x = 1.0 - st.x;

    // grid coords
    float grid = 40.0;
    vec2 uv = st * grid;
    uv = fract(uv);

    // color from camera
    vec4 texColor = texture2D(tex0, uv);
    vec3 col = texColor.rgb;
    col = vec3(st.x, 0.0, st.y);
    
	// create texture
    //float rad = sqrt(luma(col.rgb));
    // float rad = 0.2;
    // float value = luma(col.rgb);
    // if(value < 0.2){
    //     col = vec3(0.1, 0.1, 0.2);
    // } else if(value < 0.4){
    //     col = vec3(0.5, 0.2, 0.5);
    // } else if(value < 0.55){
    //     col = vec3(0.5, 0.7, 0.85);
    // } else if(value < 0.75){
    //     col = vec3(0.7, 0.6, 0.9);
    // } else{
    //     col = vec3(0.95, 0.9, 0.95);
    // }


	// float alpha = 0.0;
    // if(0.2 < value && value < 0.5){
    //     alpha = 1.0;
    // }
    
    // float circs = circle(uv, rad);

    // output
    gl_FragColor = vec4(texColor.rgb, 1.0);
}`;