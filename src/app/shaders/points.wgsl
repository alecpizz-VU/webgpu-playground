struct Vertex {
    @location(0) position: vec2f,
    @location(1) size: f32
}

struct Uniforms {
    resolution: vec2f,
    sizeScale: f32,
    edge: f32,
    color: vec4f,
    // World-to-NDC camera parameters
    viewCenter: vec2f,
    zoom: f32,
    _pad: f32,
}

@group(0) @binding(0) var<uniform> uni : Uniforms;

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@vertex
fn vs_main(vert: Vertex, @builtin(vertex_index) vNdx: u32)
    -> VSOut {
    let points = array(
        vec2f(-1, -1),
        vec2f( 1, -1),
        vec2f(-1,  1),
        vec2f(-1,  1),
        vec2f( 1, -1),
        vec2f( 1,  1),
    );
    let pos = points[vNdx];
    // World to NDC (uniform scale with aspect compensation)
    let vRel = vert.position - uni.viewCenter;
    let zoomX = uni.zoom * (uni.resolution.y / uni.resolution.x);
    let ndcCenter = vec2f(vRel.x * zoomX, vRel.y * uni.zoom);
    var out: VSOut;
    out.position = vec4f(ndcCenter + pos * (vert.size * uni.sizeScale) / uni.resolution, 0, 1);
    out.uv = pos;
    return out;
}

struct FSIn {
    @location(0) uv: vec2f,
}

@fragment
fn fs_main(in: FSIn)
    -> @location(0) vec4f {
    let r = length(in.uv);
    let aa = fwidth(r);
    let e = max(uni.edge, aa);
    let mask = 1.0 - smoothstep(1.0 - e, 1.0 + e, r);

    // Premultiplied output (matches pipeline blending: one/one-minus-src-alpha)
    let alpha = mask * uni.color.a;
    let rgb = uni.color.rgb * alpha;
    return vec4f(rgb, alpha);
}