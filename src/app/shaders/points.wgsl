struct Particle {
    pos: vec2f,
    vel: vec2f,
    size: f32,
    angle: f32,
    angVel: f32,
    _pad: f32,
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
@group(0) @binding(1) var<storage, read> particles: array<Particle>;

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) angle: f32,
}

@vertex
fn vs_main(@builtin(vertex_index) vNdx: u32, @builtin(instance_index) i: u32)
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
    let p = particles[i];
    let vRel = p.pos - uni.viewCenter;

    let zoomX = uni.zoom * (uni.resolution.y / uni.resolution.x);
    let ndcCenter = vec2f(vRel.x * zoomX, vRel.y * uni.zoom);
    var out: VSOut;
    out.position = vec4f(ndcCenter + pos * (p.size * uni.sizeScale) / uni.resolution, 0, 1);
    out.uv = pos;
    out.angle = p.angle;

    return out;
}

struct FSIn {
    @location(0) uv: vec2f,
    @location(1) angle: f32,
}

@fragment
fn fs_main(in: FSIn)
    -> @location(0) vec4f {
    // Rotate UV into particle-angle space so we can build an oriented trail shape
    let s = sin(in.angle);
    let c = cos(in.angle);
    let uvRot = vec2f(
        in.uv.x * c - in.uv.y * s,
        in.uv.x * s + in.uv.y * c,
    );

    // Stretch into an oriented ellipse (narrow across, long along the trail)
    let trailUv = vec2f(uvRot.x * 2.5, uvRot.y * 0.6);
    let r = length(trailUv);
    let aa = fwidth(r);
    let e = max(uni.edge, aa);
    let mask = 1.0 - smoothstep(1.0 - e, 1.0 + e, r);

    // Premultiplied output (matches pipeline blending: one/one-minus-src-alpha)
    let alpha = mask * uni.color.a;
    let rgb = uni.color.rgb * alpha;
    return vec4f(rgb, alpha);
}