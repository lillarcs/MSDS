/**
 * deer-vision — A-Frame post-processing component for tufted deer (Elaphodus cephalophus) POV.
 *
 * Renders the A-Frame scene to a WebGLRenderTarget, then applies a ShaderMaterial pass:
 *   • 5×5 Gaussian blur, sharp within ±10° of the horizon, 20/60-equivalent (~4 px) elsewhere
 *   • Red channel removed; blue channel boosted ×3
 *   • Reds/oranges desaturated to grey-brown (dichromacy / no L-cone)
 *   • Greens slightly desaturated
 *   • transparent:true — unrendered pixels stay alpha-0 so Quest 2 AR passthrough shows through
 *
 * Usage:  <a-scene deer-vision renderer="alpha:true" ...>
 *
 * Schema:
 *   verticalFov  [number, default 96]  Full vertical FOV of the headset in degrees.
 *                                       Quest 2 is ~96°. Drives the sharp-band calculation.
 */

/* ── Vertex shader ─────────────────────────────────────────────────────────── */
const DEER_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  // Quad vertices are already in clip space (−1..1); skip camera transforms.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/* ── Fragment shader ───────────────────────────────────────────────────────── */
const DEER_FRAG = /* glsl */`
precision highp float;

uniform sampler2D tDiffuse;
uniform vec2      uResolution;   // render-target pixel dimensions
uniform float     uHalfVFov;     // half vertical FOV in degrees

varying vec2 vUv;

// ── 5×5 Gaussian kernel (sigma≈1, unnormalised weights, sum=273) ────────────
// px = per-component pixel step (1/resolution * blurRadius)
vec4 gaussBlur(sampler2D tex, vec2 uv, vec2 px) {
  vec4 c = vec4(0.0);
  c += texture2D(tex, uv + vec2(-2.,-2.)*px) *  1.0;
  c += texture2D(tex, uv + vec2(-1.,-2.)*px) *  4.0;
  c += texture2D(tex, uv + vec2( 0.,-2.)*px) *  7.0;
  c += texture2D(tex, uv + vec2( 1.,-2.)*px) *  4.0;
  c += texture2D(tex, uv + vec2( 2.,-2.)*px) *  1.0;
  c += texture2D(tex, uv + vec2(-2.,-1.)*px) *  4.0;
  c += texture2D(tex, uv + vec2(-1.,-1.)*px) * 16.0;
  c += texture2D(tex, uv + vec2( 0.,-1.)*px) * 26.0;
  c += texture2D(tex, uv + vec2( 1.,-1.)*px) * 16.0;
  c += texture2D(tex, uv + vec2( 2.,-1.)*px) *  4.0;
  c += texture2D(tex, uv + vec2(-2., 0.)*px) *  7.0;
  c += texture2D(tex, uv + vec2(-1., 0.)*px) * 26.0;
  c += texture2D(tex, uv + vec2( 0., 0.)*px) * 41.0;
  c += texture2D(tex, uv + vec2( 1., 0.)*px) * 26.0;
  c += texture2D(tex, uv + vec2( 2., 0.)*px) *  7.0;
  c += texture2D(tex, uv + vec2(-2., 1.)*px) *  4.0;
  c += texture2D(tex, uv + vec2(-1., 1.)*px) * 16.0;
  c += texture2D(tex, uv + vec2( 0., 1.)*px) * 26.0;
  c += texture2D(tex, uv + vec2( 1., 1.)*px) * 16.0;
  c += texture2D(tex, uv + vec2( 2., 1.)*px) *  4.0;
  c += texture2D(tex, uv + vec2(-2., 2.)*px) *  1.0;
  c += texture2D(tex, uv + vec2(-1., 2.)*px) *  4.0;
  c += texture2D(tex, uv + vec2( 0., 2.)*px) *  7.0;
  c += texture2D(tex, uv + vec2( 1., 2.)*px) *  4.0;
  c += texture2D(tex, uv + vec2( 2., 2.)*px) *  1.0;
  return c / 273.0;
}

void main() {

  // ── 1. Adaptive blur: sharp ±10° from horizon, 20/60-equivalent elsewhere ─
  // vUv.y = 0.5 → screen centre = horizon when head is level.
  // angleDeg: how many degrees above/below the horizon this fragment is.
  float angleDeg = abs(vUv.y - 0.5) * 2.0 * uHalfVFov;

  // Ramp from 0 (sharp) to 4 px radius (20/60 equivalent) between 10° and 18°.
  // Using 4 px step on a 5×5 kernel spans ±8 px total, matching ~3 arcmin blur
  // at Quest-2 centre-fovea pixel density (~25–30 PPD).
  float blurRadius = smoothstep(10.0, 18.0, angleDeg) * 4.0;
  vec2  px         = (1.0 / uResolution) * blurRadius;

  vec4 s = (blurRadius < 0.01)
    ? texture2D(tDiffuse, vUv)
    : gaussBlur(tDiffuse, vUv, px);

  vec3 col = s.rgb;

  // ── 2. Hue detection — must happen before colour transformation ────────────
  float lum  = dot(col, vec3(0.299, 0.587, 0.114));
  float maxC = max(col.r, max(col.g, col.b));
  float minC = min(col.r, min(col.g, col.b));
  float chr  = maxC - minC + 0.0001;       // chroma (avoids divide-by-zero)

  // Red indicator: r is the max channel and b is well below it
  float redF = clamp((col.r - max(col.g, col.b)) / chr, 0.0, 1.0);

  // Orange indicator: hue ~15–45°, so g is the second-highest channel after r
  // Expressed as: g is clearly above b, and r is clearly above b
  float orgF = clamp((col.g - col.b) / chr, 0.0, 1.0) * redF;

  // Combine; weight both by saturation so neutral greys aren't affected
  float sat       = clamp((maxC - minC) * 4.0, 0.0, 1.0);
  float redOrange = clamp(max(redF, orgF * 0.8) * sat, 0.0, 1.0);

  // Green indicator: g is the max channel
  float greenF = clamp((col.g - max(col.r, col.b)) / chr, 0.0, 1.0) * sat;

  // ── 3. Desaturate reds/oranges → grey-brown ───────────────────────────────
  // (0.55 / 0.50 / 0.40 bias gives a warm-neutral tone at any luminance level)
  vec3 greyBrown = vec3(lum * 0.55, lum * 0.50, lum * 0.40);
  vec3 out3 = mix(col, greyBrown, redOrange);

  // ── 4. Slightly desaturate greens (deer M-cone sensitivity, no L-cone) ─────
  // Blend 35% toward grey for saturated green areas
  out3 = mix(out3, mix(vec3(lum), out3, 0.70), greenF * 0.35);

  // ── 5. Dichromacy filter: zero red channel; boost blue ×3 ─────────────────
  out3.r = 0.0;
  out3.b = min(1.0, out3.b * 3.0);

  // Preserve scene alpha so AR passthrough shows through transparent pixels
  gl_FragColor = vec4(out3, s.a);
}
`;

/* ── A-Frame component ─────────────────────────────────────────────────────── */
AFRAME.registerComponent('deer-vision', {
  schema: {
    verticalFov: { type: 'number', default: 96 },
  },

  init() {
    this.rt      = null;
    this.ppScene = null;
    this.ppCam   = null;
    this.ppMat   = null;
    this._orig   = null;

    const sceneEl = this.el.sceneEl;
    const go = () => this._setup(sceneEl.renderer);
    // renderer may already exist (desktop) or arrive via renderstart (XR)
    sceneEl.renderer ? go() : sceneEl.addEventListener('renderstart', go);
  },

  _setup(renderer) {
    const sz = new THREE.Vector2();
    renderer.getSize(sz);
    const W = sz.x, H = sz.y;

    // ── Render target: captures the main scene ─────────────────────────────
    this.rt = new THREE.WebGLRenderTarget(W, H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format:    THREE.RGBAFormat,
    });

    // ── Post-process pass: full-clip-space quad ────────────────────────────
    this.ppScene = new THREE.Scene();
    this.ppCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Manual BufferGeometry so we avoid any A-Frame primitive wrappers
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([-1,-1,0,  1,-1,0,  1,1,0,
                        -1,-1,0,  1, 1,0, -1,1,0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(
      new Float32Array([0,0,  1,0,  1,1,
                        0,0,  1,1,  0,1]), 2));

    this.ppMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse:    { value: null },
        uResolution: { value: new THREE.Vector2(W, H) },
        uHalfVFov:   { value: this.data.verticalFov * 0.5 },
      },
      vertexShader:   DEER_VERT,
      fragmentShader: DEER_FRAG,
      transparent:    true,   // lets AR passthrough show through alpha-0 regions
      depthTest:      false,
      depthWrite:     false,
    });

    this.ppScene.add(new THREE.Mesh(geo, this.ppMat));

    // ── Intercept renderer.render ──────────────────────────────────────────
    // Called once per eye in stereo XR; each pass gets the correct XR camera.
    const self = this;
    const orig = renderer.render.bind(renderer);
    this._orig  = orig;

    renderer.render = function (scene, camera) {
      // Guard: don't recurse when we render the pp quad itself
      if (scene === self.ppScene) { orig(scene, camera); return; }

      // Pass 1 — scene → render target
      const prevRT = renderer.getRenderTarget();
      renderer.setRenderTarget(self.rt);
      orig(scene, camera);

      // Pass 2 — post-process → XR framebuffer (or canvas)
      renderer.setRenderTarget(prevRT);
      self.ppMat.uniforms.tDiffuse.value = self.rt.texture;
      orig(self.ppScene, self.ppCam);
    };
  },

  remove() {
    if (this._orig && this.el.sceneEl.renderer) {
      this.el.sceneEl.renderer.render = this._orig;
    }
    this.rt    && this.rt.dispose();
    this.ppMat && this.ppMat.dispose();
  },
});
