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

## Three Routes to VR Proprioception Experiments

There are three ways to build VR experiments for this project, ranging from easiest to most advanced. Pick the one that matches your skill level and goals.

### Route 1: Single HTML + Claude Code (easiest)

**Best for:** Quick prototyping, no prior VR experience needed, zero setup friction.

This is how every experiment in this repo was built. You write nothing — you describe what you want and Claude Code generates single self-contained HTML files using WebXR and Three.js. No installs, no project files, no build steps. Deploy via GitHub Pages and open on your Quest browser.

**Pros:** Fastest from idea to working VR prototype. Everything is one file. Easy to share.
**Cons:** Limited to what WebXR + Three.js can do. No visual scene editor. Text-based workflow.

Follow the **Kick Start guide** below to get started.

### Route 2: PlayCanvas + Claude Desktop via MCP (recommended for designers)

**Best for:** Designers and visual thinkers who want a 3D editor with drag-and-drop, combined with AI that can directly control the editor. Lowest friction for people who prefer visual tools.

[PlayCanvas](https://playcanvas.com) is a browser-based 3D engine with a visual editor, built-in WebXR support, and one-click publishing. Using the official PlayCanvas MCP server, Claude Desktop can control the editor directly — creating entities, managing assets, configuring scenes, and more.

#### Prerequisites

- **Claude Desktop** with a Pro subscription (free tier context is too small) — download from [claude.ai/download](https://claude.ai/download)
- **Node.js 18+** — download from [nodejs.org](https://nodejs.org)
- **Google Chrome** — the editor extension only runs in Chrome
- A free **PlayCanvas account** — sign up at [playcanvas.com](https://playcanvas.com)

#### Step 1: Download the MCP Server

Go to [github.com/playcanvas/editor-mcp-server](https://github.com/playcanvas/editor-mcp-server). Click **Code → Download ZIP**. Extract to a convenient folder:

**Windows:** `C:\editor-mcp-server`
**macOS:** `/Users/your-username/editor-mcp-server`

Then install dependencies:

```bash
# Windows
cd C:\editor-mcp-server
npm install

# macOS
cd /Users/your-username/editor-mcp-server
npm install
```

#### Step 2: Configure Claude Desktop

Go to **Claude → Settings → Developer → Edit Config**. This opens `claude_desktop_config.json`. Paste the config below, adjusting the path:

**Windows:**
```json
{
  "mcpServers": {
    "playcanvas": {
      "command": "cmd",
      "args": ["/c", "npx", "tsx", "C:\\editor-mcp-server\\src\\server.ts"],
      "env": { "PORT": "52000" }
    }
  }
}
```

**macOS:**
```json
{
  "mcpServers": {
    "playcanvas": {
      "command": "npx",
      "args": ["tsx", "/Users/your-username/editor-mcp-server/src/server.ts"],
      "env": { "PORT": "52000" }
    }
  }
}
```

> **macOS + nvm users:** If you see Node version errors, replace `"command": "npx"` with the full path (run `which npx` in Terminal to find it, e.g. `/Users/you/.nvm/versions/node/v18.17.1/bin/npx`).

Restart Claude Desktop.

#### Step 3: Install the Chrome Extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked** → select the `extension` folder inside your MCP server folder
4. The PlayCanvas MCP extension appears in your extensions list

#### Step 4: Open PlayCanvas and Connect

1. Go to [playcanvas.com](https://playcanvas.com) and open a project in the Editor
2. Click the **Extensions icon** in Chrome's toolbar → open the PlayCanvas MCP extension
3. Click **Connect** (port should match your config, default: `52000`)
4. Switch to **Claude Desktop** and start issuing commands

#### What Claude Can Do Once Connected

- **Entity management** — create, modify, duplicate, reparent, delete entities
- **Asset management** — create, list, delete, instantiate templates
- **Scene settings** — render and physics configuration
- **Asset Store** — search, retrieve, and download assets

Try prompts like:
- *"Create a VR scene with a floor, some floating cubes, and hand tracking enabled"*
- *"Add a script to this entity that detects hand collisions and plays a sound"*
- *"Set up a proprioceptive offset experiment — mirror the right hand with a 10cm lateral shift"*

#### Limitations

- Only **one PlayCanvas Editor instance** can be connected at a time
- **Claude Pro subscription** strongly recommended for sufficient context
- Works with **Claude Desktop only** — not the claude.ai web interface
- Chrome extension requires **Google Chrome**

**Resources:**
- [PlayCanvas MCP Server (GitHub)](https://github.com/playcanvas/editor-mcp-server)
- [PlayCanvas WebXR Guide](https://developer.playcanvas.com/user-manual/xr/)
- [PlayCanvas Hand Tracking Tutorial](https://developer.playcanvas.com/tutorials/webxr-hand-tracking/)

### Route 3: Unity + Meta SDK (most advanced)

**Best for:** Students with Unity experience who want full access to Quest hardware features, production-quality rendering, and the complete Meta SDK.

Unity with the Meta XR SDK gives you the most powerful and flexible development environment, but also the steepest learning curve and longest setup time.

**Get started:** [Meta Unity Development Guide](https://developers.meta.com/horizon/develop/unity/)

**Pros:** Full Quest hardware access, best performance, huge ecosystem, industry standard.
**Cons:** Heavy setup (Unity install, SDK config, build & deploy cycle). Requires C# knowledge. Slower iteration than web-based approaches.

---

## WebXR Development Kick Start (Route 1)

A step-by-step guide to get you from zero to building and deploying your own WebXR experiments using Claude Code. Works on **macOS** and **Windows**.

### Prerequisites

- A **Meta Quest 2 or 3** headset
- A **GitHub account** — sign up free at [github.com](https://github.com)
- An **Anthropic API key** — provided by the instructor during class (no personal subscription needed)

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

#### Set the API key

The instructor will provide an Anthropic API key during class. Set it as an environment variable **before** running Claude Code:

**macOS / Linux (Terminal):**
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

To make it permanent, add the line above to your `~/.zshrc` (macOS) or `~/.bashrc` (Linux):
```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-xxxxx' >> ~/.zshrc
source ~/.zshrc
```

**Windows (Command Prompt):**
```cmd
set ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-xxxxx"
```

To make it permanent on Windows, go to **Settings → System → About → Advanced system settings → Environment Variables** and add `ANTHROPIC_API_KEY` with the key as the value.

> **Replace `sk-ant-xxxxx` with the actual key provided in class.** Do not share this key or commit it to Git.

Now start Claude Code:
```bash
claude
```
It will use the API key automatically — no login or subscription needed.

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
