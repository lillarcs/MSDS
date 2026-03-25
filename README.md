# MSDS — WebXR Experiments

A collection of WebXR experiments for Meta Quest 2 & 3, exploring proprioception, motor constraints, and soothing interactions through hand tracking and controllers.

**Live demo:** [toonhuysmans.github.io/MSDS](https://toonhuysmans.github.io/MSDS/)

## Experiments

### Proprioception

| Experiment | Input | Description |
|---|---|---|
| [Proprioception Sandbox](https://toonhuysmans.github.io/MSDS/webxr-proprioception.html) | Hands | Ghost right hand with mesh model, head-relative offset adjustable via thumbstick. Toggle real hand visibility. |
| [Proprioception Experiment](https://toonhuysmans.github.io/MSDS/webxr-proprioception-experiment.html) | Hands | Full experiment: 10 blocks with random offsets (±15cm), 10 target-touch trials per block. Accuracy measurement window (300ms), CSV export, and in-VR plots with ±1 SD whiskers. |
| [Proprioception Original](https://toonhuysmans.github.io/MSDS/webxr-proprioception-original.html) | Hands | First prototype with sphere-joint ghost hand. |

### Speed Constraint

| Experiment | Input | Description |
|---|---|---|
| [Speed Constraint v1](https://toonhuysmans.github.io/MSDS/webxr-speed-constraint.html) | Hands | Movement speed limit on both hands. Ghost freezes blue when too fast, real hand shown transparent. Sawtooth stereo buzz audio. Joystick-adjustable limit. |
| [Speed Constraint v2](https://toonhuysmans.github.io/MSDS/webxr-speed-constraint-v2.html) | Hands | Same constraint with warm sine chord audio (fundamental + octave + fifth). Gentle pitch rise, stereo panning per hand. |
| [Speed Constraint Controllers](https://toonhuysmans.github.io/MSDS/webxr-speed-constraint-controllers.html) | Controllers | Speed constraint for Quest 3 controllers with sawtooth buzz audio. |
| [Speed Constraint Controllers Q2](https://toonhuysmans.github.io/MSDS/webxr-speed-constraint-controllers-q2.html) | Controllers | Quest 2 controller version with warm sine chord audio. |

### Games

| Experiment | Input | Description |
|---|---|---|
| [Soothing Shapes](https://toonhuysmans.github.io/MSDS/webxr-soothing-shapes.html) | Hands + Controllers | Touch floating shapes to burst them into colorful confetti and streamers with pentatonic chime sounds. Haptic feedback on controllers. Joystick-adjustable spawn rate and density. |

## Tech

- Single HTML files, no build step
- Three.js r162 via importmap (jsDelivr CDN)
- `XRHandModelFactory` for hand mesh rendering
- `XRControllerModelFactory` for controller models
- Web Audio API for sound synthesis
- WebXR Hand Tracking API following [Meta's implementation guide](https://developers.meta.com/horizon/documentation/web/webxr-hands/)

## How to use

1. Open any link above on your Quest browser
2. Press **Enter VR**
3. Switch to hand tracking or use controllers depending on the experiment

## Development with Claude Code

This project was built entirely using [Claude Code](https://claude.com/claude-code), Anthropic's CLI tool for AI-assisted software engineering.

### Setup

1. Install Claude Code:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. Navigate to the project folder:
   ```bash
   cd /path/to/MSDS
   ```

3. Start Claude Code:
   ```bash
   claude
   ```

4. Ask Claude to create or modify experiments. Example prompts:
   - *"Create a new WebXR hand tracking experiment that..."*
   - *"Add haptic feedback when touching shapes"*
   - *"Make the speed limit adjustable with the joystick"*

### Workflow

- Each experiment is a **single self-contained HTML file** — no bundler, no dependencies to install
- Claude Code reads, edits, and creates files directly in this folder
- Test locally by serving over HTTPS (required for WebXR):
  ```bash
  npx serve .
  ```
  Then open `https://localhost:3000` on your Quest browser (or use a tunnel like ngrok for remote access)
- Push changes to GitHub to update the live Pages site:
  ```bash
  git add *.html && git commit -m "description" && git push
  ```

## Key features across experiments

- **Dynamic handedness detection** — left/right hand slots resolved at runtime
- **Per-frame visibility enforcement** — prevents Three.js from resetting hand visibility on reconnect
- **Head-relative offsets** — proprioceptive offsets rotate with the user's facing direction
- **100-frame moving average** — smooths noisy hand tracking speed data
- **All-joint speed tracking** — wrist + 5 fingertips checked for speed constraint
- **Stereo audio** — per-hand audio panning (left hand = left ear)
