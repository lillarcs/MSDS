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

---

## WebXR Development Kick Start

A step-by-step guide to get you from zero to building and deploying your own WebXR experiments using Claude Code. Works on **macOS** and **Windows**.

### Prerequisites

- A **Meta Quest 2 or 3** headset
- A **GitHub account** — sign up free at [github.com](https://github.com)
- An **Anthropic account** — sign up at [console.anthropic.com](https://console.anthropic.com) (you'll need an API key or a Claude Max/Pro subscription)

### Step 1: Install tools

#### Node.js

You need Node.js (v18+) to install Claude Code.

**macOS:**
```bash
# Option A: Download installer from https://nodejs.org
# Option B: Using Homebrew
brew install node
```

**Windows:**
```bash
# Download installer from https://nodejs.org (LTS version)
# Or using winget:
winget install OpenJS.NodeJS.LTS
```

Verify: `node --version` should print `v18` or higher.

#### Git

**macOS:** Git comes pre-installed. If not: `xcode-select --install`

**Windows:** Download from [git-scm.com](https://git-scm.com/download/win) or:
```bash
winget install Git.Git
```

#### GitHub CLI

**macOS:**
```bash
brew install gh
```

**Windows:**
```bash
winget install GitHub.cli
```

Then authenticate:
```bash
gh auth login
```
Follow the prompts — choose **GitHub.com**, **HTTPS**, and authenticate via browser.

#### Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

On first run, Claude Code will ask you to log in with your Anthropic account.

> **From here on, you can let Claude do most of these steps for you.** Just start Claude Code (`claude`) and tell it:
> *"Read the kick start guide at https://github.com/toonhuysmans/MSDS and help me set everything up."*
> Claude will read the instructions and walk you through forking, cloning, enabling Pages, and getting started.

### Step 2: Fork and clone this repo

1. Go to [github.com/toonhuysmans/MSDS](https://github.com/toonhuysmans/MSDS)
2. Click **Fork** (top right) to create your own copy
3. Clone your fork:

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/MSDS.git
cd MSDS
```

### Step 3: Enable GitHub Pages on your fork

```bash
# This sets up GitHub Pages to serve your HTML files
gh api repos/YOUR_USERNAME/MSDS/pages -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/"

# Set the homepage URL on the repo
gh repo edit YOUR_USERNAME/MSDS --homepage "https://YOUR_USERNAME.github.io/MSDS/"
```

Your site will be live at: `https://YOUR_USERNAME.github.io/MSDS/`

### Step 4: Start Claude Code

```bash
cd MSDS
claude
```

You're now in an interactive AI coding session. Claude can see all the files in the folder. Try these prompts:

**Explore:**
- *"What experiments are in this repo?"*
- *"Explain how the speed constraint works in webxr-speed-constraint-v2.html"*

**Modify:**
- *"In soothing-shapes, make the confetti particles bigger and add more streamers"*
- *"Change the speed limit default to 10 cm/s"*
- *"Add a countdown timer to the proprioception experiment"*

**Create something new:**
- *"Create a new WebXR experiment where floating cubes orbit around the user and they have to catch them with both hands"*
- *"Build a hand tracking experiment that mirrors the left hand onto the right hand"*
- *"Make a VR drawing app where fingertips leave colored trails in the air"*

### Step 5: Test on your Quest

WebXR requires HTTPS. A few options:

**Option A: GitHub Pages (easiest, but slow iteration)**
```bash
git add *.html
git commit -m "My changes"
git push
```
Wait ~1 minute, then open `https://YOUR_USERNAME.github.io/MSDS/` on your Quest browser.

**Option B: Local server + same network (fastest iteration)**
```bash
npx serve .
```
Find your computer's local IP (`ifconfig` on Mac, `ipconfig` on Windows), then open `http://YOUR_IP:3000` on your Quest browser. Note: some WebXR features require HTTPS — use a self-signed cert or ngrok if needed.

**Option C: ngrok tunnel (works anywhere)**
```bash
# In one terminal:
npx serve . -l 8080

# In another terminal:
npx ngrok http 8080
```
ngrok gives you a public HTTPS URL you can open directly on your Quest.

### Step 6: Push your changes

After making changes with Claude Code:

```bash
# You can ask Claude to do this for you:
# "commit and push my changes"

# Or manually:
git add *.html
git commit -m "Add my new experiment"
git push
```

Your GitHub Pages site updates automatically within a minute.

### Tips

- **Start simple.** Ask Claude to modify an existing experiment before creating from scratch.
- **Be specific.** "Make the shapes spawn faster" works, but "Change spawn interval from 1.2s to 0.3s" is even better.
- **Iterate in conversation.** You don't need to get it right in one prompt — say "that's too fast, slow it down" or "the colors are too bright" and Claude will adjust.
- **Read the code.** Ask Claude to explain any part: *"How does the ghost hand freezing work?"*
- **Use the Quest browser console.** In the Quest browser, go to `chrome://inspect` from a connected desktop Chrome to see console logs and debug.

---

## Key features across experiments

- **Dynamic handedness detection** — left/right hand slots resolved at runtime
- **Per-frame visibility enforcement** — prevents Three.js from resetting hand visibility on reconnect
- **Head-relative offsets** — proprioceptive offsets rotate with the user's facing direction
- **100-frame moving average** — smooths noisy hand tracking speed data
- **All-joint speed tracking** — wrist + 5 fingertips checked for speed constraint
- **Stereo audio** — per-hand audio panning (left hand = left ear)
