# MouseMarathon 🎯

## Basic Details
### Team Name: Quartz

### Team Members
- Team Lead: Muhammed M A - SOE
- Member 2: Muhammed Ramzin P - SOE

### Project Description
MouseMarathon is a delightfully useless Chrome extension that tracks the physical distance your cursor travels across the web in real time, competing on a global Supabase-backed leaderboard. To reward your sedentary athletic efforts, it interrupts your browsing at distance milestones with full-screen, jumpscare Malayalam movie memes and looping buzzer chaos.

### The Problem (that doesn't exist)
Millions of knowledge workers spend 8+ hours a day furiously thrashing their mice across screens, burning approximately zero calories while doing the digital equivalent of hiking Mount Everest with a single index finger. Until now, this heroic display of sedentary endurance went completely unmeasured, unranked, and unrewarded. MouseMarathon solves the profound tragedy of unacknowledged cursor mileage by calculating every millimetre of your pointless desk movement, posting it to a global leaderboard, and ensuring you get the sensory assault you deserve.

### The Solution (that nobody asked for)
Through an over-engineered cocktail of browser trigonometry and pure auditory disruption:
- **The Desk Odometer:** Using Euclidean distance math (0.264583 mm per pixel), we track every micro-twitch and frantic scroll across the entire web, turning chronic procrastination into quantifiable "athletic" mileage.
- **The Global Flex:** A real-time Supabase backend aggregates your desk sprint onto a live global leaderboard, finally giving you proof that you worked harder than your coworkers today.
- **Trauma-Based Positive Reinforcement:** Just when you enter a flow state, the browser hits the brakes: crossing milestones triggers an inescapable, full-screen Malayalam meme jumpscare paired with a looping siren alarm that refuses to shut up until you click your way out.

---

## Technical Details

### Technologies/Components Used

**For Software:**
- **Languages used:** JavaScript (ES6+), HTML5, CSS3, SQL (PL/pgSQL)
- **Frameworks used:** Chrome Extension Platform (Manifest V3 Architecture: Service Workers, Content Scripts, Action Popups)
- **Libraries used:** Web Audio API, HTML5 Audio API
- **Tools used:** Supabase (PostgreSQL, REST API, RPC functions), Git, GitHub, Chrome DevTools, Visual Studio Code


---

### Implementation

**For Software:**

# Installation
```bash
# Clone the project repository
git clone [https://github.com/Ramzin007/MouseMarathon.git](https://github.com/Ramzin007/MouseMarathon.git)

# Navigate into the project folder
cd MouseMarathon
```
# Run
```Bash
# 1. Open Google Chrome and go to: chrome://extensions
# 2. Toggle on "Developer mode" in the top-right corner.
# 3. Click "Load unpacked" in the top-left corner.
# 4. Select the "MouseMarathon" folder containing manifest.json.
# 5. (Recommended for instant audio playback):
#    Go to chrome://flags/#autoplay-policy, set to "No user gesture is required", and click Relaunch.
# 6. Browse the web and start rolling your cursor!
```
# Project Documentation
## For Software:

### Screenshots
![Popup Odometer](Add screenshot 1 here with proper name)
Retro arcade popup showing live distance tracking, custom runner nickname, and global Supabase leaderboard rankings.

![Milestone Jumpscare](Add screenshot 2 here with proper name)
Full-screen Malayalam comedy meme jumpscare overlay appearing when a milestone distance is reached.

![DevTools Tracking](Add screenshot 3 here with proper name)
Real-time cursor distance calculation and batch synchronization via Chrome runtime messaging.

# Diagrams
```text
┌─────────────────────────────────────────────────────────────┐
│                      Webpage / DOM                          │
│  (mousemove events -> Euclidean calculation -> 200ms flush) │
└──────────────────────────────┬──────────────────────────────┘
                               │ chrome.runtime.sendMessage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Service Worker (background.js)                │
│  - Tracks total meters & detects milestone triggers         │
│  - Syncs deltas to Supabase RPC (increment_distance)        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
  chrome.tabs.sendMessage           chrome.storage.local
  (TRIGGER_CELEBRATION)                        │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│       Overlay Jumpscare      │ │      Action Popup UI        │
│  - Random Malayalam meme     │ │  - Live odometer display    │
│  - Looping audio buzzer      │ │  - Global Top 10 rankings   │
└──────────────────────────────┘ └─────────────────────────────┘
```
Architecture and runtime communication pipeline of MouseMarathon.

# Project Demo
## Video
[Add your demo video link here]
Demonstrates real-time odometer updates in the popup, automatic Supabase leaderboard sync, and a live Malayalam meme jumpscare triggering with sound.

## Additional Demos
GitHub Repository: https://github.com/Ramzin007/MouseMarathon

# Team Contributions
Muhammed M A: Extension architecture (Manifest V3), distance tracking mechanics, audio looping integration, meme jumpscare overlay design, testing, and documentation.

Ramzin: Supabase backend integration, database schema, atomic RPC increment functions,UI/UX design for popup odometer and leaderboard synchronization.

---

Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
