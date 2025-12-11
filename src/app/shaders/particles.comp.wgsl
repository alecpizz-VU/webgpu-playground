struct Particle {
    pos: vec2f,
    vel: vec2f,
    size: f32,
    angle: f32,
    angVel: f32,
    _pad: f32,
}

@group(0) @binding(0)
var<storage, read_write> particles: array<Particle>;

struct SimUniforms {
    dt: f32,
    time: f32,
    particleCount: f32,
    pad0: f32,
    baseAttract: f32,
    drag: f32,
    attractionFalloff: f32,
    minDriftSpeed: f32,
    maxDriftSpeed: f32,
    attractionSmoothing: f32,
    mouseInfluence: f32,
    pad1: f32,
    worldMin: vec2<f32>,
    worldMax: vec2<f32>,
    mouseTarget: vec2<f32>,
    pad2: vec2<f32>,
}

@group(0) @binding(1)
var<uniform> sim : SimUniforms;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  let count = u32(sim.particleCount);
  if (i >= count) {
    return;
  }

  let dt = sim.dt;

  // Load current particle state
  var p = particles[i];
  var pos = p.pos;
  var vel = p.vel;

  // Small velocity jitter to keep particles from perfectly overlapping. This
  // acts like a tiny random acceleration based on position and time.
  let jitterSeed1 = dot(pos, vec2<f32>(12.9898, 78.233)) + sim.time * 43758.5453;
  let jitterSeed2 = dot(pos, vec2<f32>(93.9898, 67.345)) + sim.time * 12345.6789;
  let jx = fract(sin(jitterSeed1) * 43758.5453) * 2.0 - 1.0;
  let jy = fract(sin(jitterSeed2) * 12345.6789) * 2.0 - 1.0;
  let jitterStrength = 0.75; // in velocity units per second
  vel = vel + vec2<f32>(jx, jy) * (jitterStrength * dt);

  // Mouse-driven attraction with falloff and drag
  if (sim.mouseInfluence > 0.0) {
    var toMouse = sim.mouseTarget - pos;
    var dist = length(toMouse);
    if (dist < 0.0001) {
      dist = 0.0001;
    }

    // Normalize direction toward mouse
    let invDist = 1.0 / dist;
    let dir = toMouse * invDist;

    // Build a tangential direction (perpendicular to dir) so particles can
    // orbit around the mouse instead of only falling straight in.
    let tangent = vec2<f32>(-dir.y, dir.x);
    let orbitFactor = 0.6; // 0 = pure attraction, 1 = pure orbit
    let mainDir = normalize(dir * (1.0 - orbitFactor) + tangent * orbitFactor);

    let falloff = 1.0 / (1.0 + dist * dist * sim.attractionFalloff);
    let strength = sim.baseAttract * falloff * sim.mouseInfluence;

    vel = vel + mainDir * (strength * dt);

    let dragFactor = max(0.0, 1.0 - sim.drag * dt);
    vel = vel * dragFactor;
  }

  // When mouse influence is low, ensure a minimum drift speed so particles
  // don't come to a complete stop after attraction fades out.
  if (sim.mouseInfluence < 0.05) {
    let speed = length(vel);
    let minSpeed = sim.minDriftSpeed;
    let maxSpeed = sim.maxDriftSpeed;

    if (speed < 1e-4) {
      // Pseudo-random direction based on index; deterministic but good enough
      let seed = vec2<f32>(f32(i), 37.0);
      let h = fract(sin(dot(seed, vec2<f32>(12.9898, 78.233))) * 43758.5453);
      let theta = h * 6.28318530718; // 2*pi
      vel = vec2<f32>(cos(theta), sin(theta)) * minSpeed;
    } else if (speed < minSpeed) {
      let scale = minSpeed / speed;
      vel = vel * scale;
    } else if (speed > maxSpeed) {
      let scale = maxSpeed / speed;
      vel = vel * scale;
    }
  }

  // Integrate position
  pos = pos + vel * dt;

  // Wrap-around using world bounds from uniforms
  let minP = sim.worldMin;
  let maxP = sim.worldMax;
  let size = maxP - minP;

  if (pos.x < minP.x) {
    let delta = minP.x - pos.x;
    pos.x = maxP.x - (delta % size.x);
  } else if (pos.x > maxP.x) {
    let delta = pos.x - maxP.x;
    pos.x = minP.x + (delta % size.x);
  }

  if (pos.y < minP.y) {
    let delta = minP.y - pos.y;
    pos.y = maxP.y - (delta % size.y);
  } else if (pos.y > maxP.y) {
    let delta = pos.y - maxP.y;
    pos.y = minP.y + (delta % size.y);
  }

  // Write back updated state and angle aligned to velocity
  p.pos = pos;
  p.vel = vel;
  p.angle = atan2(vel.y, vel.x);
  particles[i] = p;
}
