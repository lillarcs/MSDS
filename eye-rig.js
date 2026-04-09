/**
 * eye-rig — A-Frame post-processing component for tufted deer binocular simulation.
 *
 * Supersedes deer-vision. Add to <a-scene> instead of deer-vision.
 *
 * Features
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. CYCLOVERGENCE
 *    Deer eyes exhibit ocular torsion correlated with head pitch (extorsion on
 *    downward gaze). The shader detects which eye is being rendered (via
 *    gl_FragCoord vs the split-point), then counter-rotates each eye's UV
 *    sampling around its centre so the visual horizon stays level even when
 *    the head pitches forward. torsionPerPitch controls the ratio (deg/deg).
 *
 * 2. WIDE-FOV COMPRESSION
 *    Deer have ~310° total FOV vs ~200° human. The component counter-rotates a
 *    '#world' wrapper entity by (1 − fovCompression) of each frame's head
 *    delta, so a small physical head-turn sweeps more of the virtual scene.
 *    fovCompression = 1.0 is normal (no effect); 0.6 means 40% of each rotation
 *    is cancelled, making the world appear wider/more panoramic.
 *
 * 3. DUSK MODE  (call el.components['eye-rig'].toggleDuskMode())
 *    Simulates high-sensitivity rod vision at low light:
 *    • 18× brightness multiplier (scotopic gain)
 *    • Desaturate to near-monochrome (rods are achromatic, 6% residual colour)
 *    • Motion contrast: temporal diff between ping-pong RTs → bright flash on
 *      moving objects, mimicking the rod "off-response" edge-detection bias.
 *
 * Schema
 * ──────────────────────────────────────────────────────────────────────────────
 *   verticalFov      number  96      Full vertical FOV in degrees (Quest 2 ≈ 96°)
 *   torsionPerPitch  number  0.15    Deg of eye torsion per deg of head pitch
 *   fovCompression   number  0.60    Fraction of head-rotation applied to virtual view
 *   worldSelector    string  #world  CSS selector for the scene-content wrapper entity
 *   duskMode         bool    false   Toggle rod-vision mode
 *   duskBrightness   number  18      Scotopic gain multiplier
 *
 * XR stereo note
 * ──────────────────────────────────────────────────────────────────────────────
 * When renderer.xr.isPresenting, Three.js renders both eyes into our capture RT
 * side-by-side (left [0, W/2], right [W/2, W]). The fragment shader detects the
 * eye via gl_FragCoord.x ≥ uResolution.x * 0.5 and maps UVs accordingly.
 * In multiview mode (if enabled by the browser/runtime) this may not hold;
 * set uStereoSplit manually if needed.
 */

/* ─── Vertex shader ──────────────────────────────────────────────────────────*/
const RIG_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  // Geometry spans clip-space [-1,1]. Skip camera matrices so this fills
  // every viewport (including XR per-eye viewports) without distortion.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/* ─── Fragment shader ────────────────────────────────────────────────────────*/
const RIG_FRAG = /* glsl */`
precision highp float;

// Textures
uniform sampler2D tDiffuse;     // current frame (side-by-side in XR stereo)
uniform sampler2D tPrev;        // previous frame  (for dusk-mode motion detection)

// Geometry / FOV
uniform vec2  uResolution;      // full RT dimensions (both eyes wide in XR stereo)
uniform float uHalfVFov;        // half vertical FOV in degrees

// Cyclovergence
uniform float uTorsionRad;      // magnitude of eye torsion (radians); sign is per-eye
uniform float uStereoSplit;     // 0.5 = XR side-by-side, 1.0 = mono/sequential

// Dusk mode (using float 0/1 instead of bool for broader GPU compatibility)
uniform float uDuskMode;        // 0.0 or 1.0
uniform float uDuskBrightness;  // scotopic gain (default 18.0)

varying vec2 vUv;

// ── 5×5 Gaussian, sigma≈1, 25 taps, sum=273 ──────────────────────────────────
vec4 gaussBlur(sampler2D tex, vec2 uv, vec2 px) {
  vec4 c = vec4(0.0);
  c += texture2D(tex, uv+vec2(-2.,-2.)*px) *  1.0;
  c += texture2D(tex, uv+vec2(-1.,-2.)*px) *  4.0;
  c += texture2D(tex, uv+vec2( 0.,-2.)*px) *  7.0;
  c += texture2D(tex, uv+vec2( 1.,-2.)*px) *  4.0;
  c += texture2D(tex, uv+vec2( 2.,-2.)*px) *  1.0;
  c += texture2D(tex, uv+vec2(-2.,-1.)*px) *  4.0;
  c += texture2D(tex, uv+vec2(-1.,-1.)*px) * 16.0;
  c += texture2D(tex, uv+vec2( 0.,-1.)*px) * 26.0;
  c += texture2D(tex, uv+vec2( 1.,-1.)*px) * 16.0;
  c += texture2D(tex, uv+vec2( 2.,-1.)*px) *  4.0;
  c += texture2D(tex, uv+vec2(-2., 0.)*px) *  7.0;
  c += texture2D(tex, uv+vec2(-1., 0.)*px) * 26.0;
  c += texture2D(tex, uv+vec2( 0., 0.)*px) * 41.0;
  c += texture2D(tex, uv+vec2( 1., 0.)*px) * 26.0;
  c += texture2D(tex, uv+vec2( 2., 0.)*px) *  7.0;
  c += texture2D(tex, uv+vec2(-2., 1.)*px) *  4.0;
  c += texture2D(tex, uv+vec2(-1., 1.)*px) * 16.0;
  c += texture2D(tex, uv+vec2( 0., 1.)*px) * 26.0;
  c += texture2D(tex, uv+vec2( 1., 1.)*px) * 16.0;
  c += texture2D(tex, uv+vec2( 2., 1.)*px) *  4.0;
  c += texture2D(tex, uv+vec2(-2., 2.)*px) *  1.0;
  c += texture2D(tex, uv+vec2(-1., 2.)*px) *  4.0;
  c += texture2D(tex, uv+vec2( 0., 2.)*px) *  7.0;
  c += texture2D(tex, uv+vec2( 1., 2.)*px) *  4.0;
  c += texture2D(tex, uv+vec2( 2., 2.)*px) *  1.0;
  return c / 273.0;
}

void main() {

  // ────────────────────────────────────────────────────────────────────────────
  // 1. PER-EYE SETUP
  //    In XR stereo the render target is side-by-side: left=[0,0.5], right=[0.5,1].
  //    We detect the eye by comparing gl_FragCoord.x to the midpoint, then remap
  //    vUv into that eye's [0,1] local space for downstream calculations.
  // ────────────────────────────────────────────────────────────────────────────
  bool  stereo    = (uStereoSplit < 0.75);
  float halfW     = uResolution.x * 0.5;

  // isRight: 1.0 for right eye, 0.0 for left (or mono)
  float isRight = stereo ? step(halfW, gl_FragCoord.x) : 0.0;

  // Normalised UV local to this eye's half of the RT ([0,1]×[0,1])
  float xOffset   = isRight * 0.5;                     // 0.0 left, 0.5 right
  vec2  localUV   = vec2(vUv.x * (stereo ? 2.0 : 1.0) - isRight, vUv.y);

  // ────────────────────────────────────────────────────────────────────────────
  // 2. CYCLOVERGENCE — rotate local UV around eye centre (0.5, 0.5)
  //    Deer extorsion: right eye rolls CW (+), left eye rolls CCW (−)
  //    when pitching down. uTorsionRad is always positive; sign flips per eye.
  // ────────────────────────────────────────────────────────────────────────────
  float eyeSign  = 1.0 - 2.0 * (1.0 - isRight); // left = -1, right = +1 … wait, inverted:
  // Actually: left eye (-1), right eye (+1) for extorsion on down-pitch:
  eyeSign = stereo ? (isRight * 2.0 - 1.0) : 1.0;  // -1 left, +1 right

  float torsion  = uTorsionRad * eyeSign;
  float cosT = cos(torsion), sinT = sin(torsion);

  // Aspect-correct rotation (eye is square in angular space, not pixel space)
  float eyeAspect = (stereo ? halfW : uResolution.x) / uResolution.y;
  vec2  d = localUV - vec2(0.5);
  d.x *= eyeAspect;
  d = vec2(cosT * d.x - sinT * d.y, sinT * d.x + cosT * d.y);
  d.x /= eyeAspect;
  vec2 rotLocalUV = clamp(vec2(0.5) + d, vec2(0.0), vec2(1.0));

  // Map back to the full RT's UV space for texture sampling
  vec2 uv = vec2(rotLocalUV.x * (stereo ? 0.5 : 1.0) + xOffset, rotLocalUV.y);

  // ────────────────────────────────────────────────────────────────────────────
  // 3. ADAPTIVE BLUR
  //    Sharp within ±10° of horizon; smoothstep to 4 px radius (20/60) beyond.
  // ────────────────────────────────────────────────────────────────────────────
  float angleDeg   = abs(uv.y - 0.5) * 2.0 * uHalfVFov;
  float blurRadius = smoothstep(10.0, 18.0, angleDeg) * 4.0;
  vec2  px         = (1.0 / uResolution) * blurRadius;

  vec4 s = (blurRadius < 0.01)
    ? texture2D(tDiffuse, uv)
    : gaussBlur(tDiffuse, uv, px);
  vec3 col = s.rgb;

  // ────────────────────────────────────────────────────────────────────────────
  // 4. DEER DICHROMACY COLOUR CORRECTION  (identical to deer-vision.js)
  // ────────────────────────────────────────────────────────────────────────────
  float lum  = dot(col, vec3(0.299, 0.587, 0.114));
  float maxC = max(col.r, max(col.g, col.b));
  float minC = min(col.r, min(col.g, col.b));
  float chr  = maxC - minC + 0.0001;
  float sat  = clamp((maxC - minC) * 4.0, 0.0, 1.0);

  float redF      = clamp((col.r - max(col.g, col.b)) / chr, 0.0, 1.0);
  float orgF      = clamp((col.g - col.b) / chr, 0.0, 1.0) * redF;
  float redOrange = clamp(max(redF, orgF * 0.8) * sat, 0.0, 1.0);
  float greenF    = clamp((col.g - max(col.r, col.b)) / chr, 0.0, 1.0) * sat;

  vec3 greyBrown = vec3(lum * 0.55, lum * 0.50, lum * 0.40);
  vec3 out3 = mix(col, greyBrown, redOrange);
  out3 = mix(out3, mix(vec3(lum), out3, 0.70), greenF * 0.35);
  out3.r = 0.0;
  out3.b = min(1.0, out3.b * 3.0);

  // ────────────────────────────────────────────────────────────────────────────
  // 5. DUSK MODE — rod-vision simulation
  //    Activated by uDuskMode = 1.0.
  // ────────────────────────────────────────────────────────────────────────────
  if (uDuskMode > 0.5) {
    // Scotopic gain: rods are ~100× more sensitive than cones; 18× is conservative
    out3 = clamp(out3 * uDuskBrightness, 0.0, 1.0);

    // Rods are achromatic — desaturate to near-monochrome, preserve 6% colour
    // (slight blue-green bias is authentic: rods peak at ~498 nm)
    float lumD = dot(out3, vec3(0.299, 0.587, 0.114));
    vec3  mono = vec3(lumD * 0.94, lumD * 0.97, lumD * 1.06); // subtle Purkinje tint
    out3 = mix(mono, out3, 0.06);

    // Motion contrast: temporal difference → bright edge flash
    // tPrev holds the previous frame captured in the same eye half.
    vec4  prev      = texture2D(tPrev, uv);
    float motionMag = length(s.rgb - prev.rgb);                // raw pixel delta
    float motionW   = smoothstep(0.025, 0.14, motionMag);      // threshold + ramp

    // "Off-response": moving edges appear as bright, faintly warm bursts —
    // luminance spike with just enough warmth to indicate the rod response bias
    vec3 flash = clamp(vec3(lumD * 2.2 + 0.2, lumD * 1.9 + 0.1, lumD * 1.5), 0.0, 1.0);
    out3 = mix(out3, flash, motionW);
  }

  gl_FragColor = vec4(out3, s.a);
}
`;

/* ─── A-Frame component ──────────────────────────────────────────────────────*/
AFRAME.registerComponent('eye-rig', {
  schema: {
    verticalFov:     { type: 'number',   default: 96     },
    torsionPerPitch: { type: 'number',   default: 0.15   },
    fovCompression:  { type: 'number',   default: 0.60   },
    worldSelector:   { type: 'string',   default: '#world' },
    duskMode:        { type: 'boolean',  default: false  },
    duskBrightness:  { type: 'number',   default: 18.0   },
  },

  init() {
    // Render-target ping-pong (A = current frame, B = previous frame)
    this._rtA = null; this._rtB = null;
    this._rtCur = null; this._rtPrev = null;

    // Post-process pass
    this._ppScene = null;
    this._ppCam   = null;
    this._ppMat   = null;
    this._origRender = null;

    // FOV-compression state
    this._prevHeadQ  = new THREE.Quaternion();
    this._sceneOffQ  = new THREE.Quaternion();
    this._prevHeadQOK = false;
    this._worldEl    = null;

    const sceneEl = this.el.sceneEl;
    const go = () => this._setup(sceneEl.renderer);
    sceneEl.renderer ? go() : sceneEl.addEventListener('renderstart', go);
  },

  // ── Private: build render targets + shader + intercept renderer ────────────
  _setup(renderer) {
    const sz = new THREE.Vector2();
    renderer.getSize(sz);
    const W = sz.x, H = sz.y;

    const rtOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format:    THREE.RGBAFormat,
    };
    this._rtA = new THREE.WebGLRenderTarget(W, H, rtOpts);
    this._rtB = new THREE.WebGLRenderTarget(W, H, rtOpts);
    this._rtCur  = this._rtA;
    this._rtPrev = this._rtB;

    // Full-clip-space quad
    this._ppScene = new THREE.Scene();
    this._ppCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([-1,-1,0,  1,-1,0,  1,1,0,
                        -1,-1,0,  1, 1,0, -1,1,0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(
      new Float32Array([0,0, 1,0, 1,1,
                        0,0, 1,1, 0,1]), 2));

    this._ppMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse:       { value: null },
        tPrev:          { value: null },
        uResolution:    { value: new THREE.Vector2(W, H) },
        uHalfVFov:      { value: this.data.verticalFov * 0.5 },
        uTorsionRad:    { value: 0.0 },
        uStereoSplit:   { value: 1.0 },  // updated each tick
        uDuskMode:      { value: 0.0 },
        uDuskBrightness:{ value: this.data.duskBrightness },
      },
      vertexShader:   RIG_VERT,
      fragmentShader: RIG_FRAG,
      transparent:    true,
      depthTest:      false,
      depthWrite:     false,
    });
    this._ppScene.add(new THREE.Mesh(geo, this._ppMat));

    // Intercept renderer.render  ────────────────────────────────────────────
    // Called once per frame (mono) or once per eye (XR non-multiview).
    // In XR, Three.js handles stereo internally within orig(); our RT captures
    // both eyes side-by-side, and uStereoSplit = 0.5 tells the shader.
    const self = this;
    const orig = renderer.render.bind(renderer);
    this._origRender = orig;

    renderer.render = function(scene, camera) {
      if (scene === self._ppScene) { orig(scene, camera); return; }

      const prevRT = renderer.getRenderTarget();

      // Pass 1 — scene → current RT
      renderer.setRenderTarget(self._rtCur);
      orig(scene, camera);

      // Pass 2 — post-process → XR framebuffer or canvas
      renderer.setRenderTarget(prevRT);
      self._ppMat.uniforms.tDiffuse.value = self._rtCur.texture;
      self._ppMat.uniforms.tPrev.value    = self._rtPrev.texture;

      // In XR mode use the real XR camera so Three.js sets per-eye viewports;
      // our vertex shader ignores projection matrices so the quad still fills
      // each eye's viewport correctly.
      const ppCamera = (renderer.xr && renderer.xr.isPresenting) ? camera : self._ppCam;
      orig(self._ppScene, ppCamera);

      // Ping-pong: what was current is now "previous"
      const tmp = self._rtCur;
      self._rtCur  = self._rtPrev;
      self._rtPrev = tmp;
    };
  },

  // ── tick: update uniforms and FOV compression each frame ───────────────────
  tick() {
    if (!this._ppMat) return;

    const sceneEl  = this.el.sceneEl;
    const camera   = sceneEl.camera;
    if (!camera) return;

    const renderer = sceneEl.renderer;
    const inXR     = !!(renderer && renderer.xr && renderer.xr.isPresenting);

    // ── Cyclovergence ───────────────────────────────────────────────────────
    // Get world-space head quaternion; extract pitch via YXZ Euler order.
    const headQ = new THREE.Quaternion();
    camera.getWorldQuaternion(headQ);
    const euler    = new THREE.Euler().setFromQuaternion(headQ, 'YXZ');
    const pitchDeg = THREE.MathUtils.radToDeg(euler.x);

    // Pitch down (negative x) → extorsion → positive torsion magnitude.
    // The shader applies ±sign per eye: left=-torsion, right=+torsion.
    const torsionDeg = -pitchDeg * this.data.torsionPerPitch;
    this._ppMat.uniforms.uTorsionRad.value = THREE.MathUtils.degToRad(torsionDeg);

    // ── FOV uniform from live camera ────────────────────────────────────────
    const fovSrc = (camera.isArrayCamera && camera.cameras.length)
      ? camera.cameras[0] : camera;
    if (fovSrc.isPerspectiveCamera) {
      this._ppMat.uniforms.uHalfVFov.value = fovSrc.fov * 0.5;
    }

    // ── Stereo detection ────────────────────────────────────────────────────
    this._ppMat.uniforms.uStereoSplit.value =
      (inXR && camera.isArrayCamera) ? 0.5 : 1.0;

    // ── Dusk mode ───────────────────────────────────────────────────────────
    this._ppMat.uniforms.uDuskMode.value        = this.data.duskMode ? 1.0 : 0.0;
    this._ppMat.uniforms.uDuskBrightness.value  = this.data.duskBrightness;

    // ── FOV compression ─────────────────────────────────────────────────────
    this._applyFovCompression(headQ);
  },

  // ── FOV compression: counter-rotate the world wrapper each tick ────────────
  // The #world entity (or worldSelector target) is rotated opposite to the
  // head movement by (1 − fovCompression) of each frame's angular delta.
  // Net effect: the scene appears to respond more slowly to head turns,
  // simulating the subjective "panoramic stability" of wide-FOV animals.
  _applyFovCompression(curHeadQ) {
    if (!this._worldEl) {
      this._worldEl = this.el.sceneEl.querySelector(this.data.worldSelector);
      if (!this._worldEl) return;
    }

    if (!this._prevHeadQOK) {
      this._prevHeadQ.copy(curHeadQ);
      this._prevHeadQOK = true;
      return;
    }

    // delta = prevQ⁻¹ × curQ  (the rotation applied this frame by the headset)
    const delta = this._prevHeadQ.clone().invert().multiply(curHeadQ);

    // Slerp identity → delta⁻¹ by (1 − fovCompression) to get counter-rotation
    const counter = new THREE.Quaternion().slerp(
      delta.clone().invert(),
      1.0 - this.data.fovCompression
    );

    this._sceneOffQ.multiply(counter);
    this._worldEl.object3D.quaternion.copy(this._sceneOffQ);

    this._prevHeadQ.copy(curHeadQ);
  },

  // ── Public API ──────────────────────────────────────────────────────────────
  enableDuskMode()  { this.el.setAttribute('eye-rig', 'duskMode', true);  },
  disableDuskMode() { this.el.setAttribute('eye-rig', 'duskMode', false); },
  toggleDuskMode()  { this.el.setAttribute('eye-rig', 'duskMode', !this.data.duskMode); },

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  remove() {
    if (this._origRender && this.el.sceneEl.renderer) {
      this.el.sceneEl.renderer.render = this._origRender;
    }
    this._rtA   && this._rtA.dispose();
    this._rtB   && this._rtB.dispose();
    this._ppMat && this._ppMat.dispose();
  },
});
