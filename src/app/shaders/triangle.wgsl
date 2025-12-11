struct Globals {
    time: f32,
    rotate_speed: f32
};

@group(0) @binding(0)
var<uniform> globals : Globals;

@vertex
fn vs_main(@location(0) in_vertex_position: vec2f) -> @builtin(position) vec4f {
    let angle = globals.time * globals.rotate_speed;
    let c = cos(angle);
    let s = sin(angle);
    let rot = mat2x2(c, -s, s, c);
    let pos = rot * in_vertex_position;
    return vec4f(pos, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4f {
    let time = globals.time;
    let sin = sin(time);
    let color = mix(vec4f(1.0, 0.0, 0.0, 1.0), vec4f(0.0, 1.0, 0.0, 1.0), sin);
    return color;
}