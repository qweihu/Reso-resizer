# Reso-resizer / レゾリサイズ

Tired of inconsistent screenshot sizes? A blessing for perfectionist product managers and developers!

Reso-resizer (レゾリサイズ) is a minimalist and elegant Chrome extension designed for those who pursue pixel-perfect precision. It allows you to resize your browser window to any exact resolution with one click—whether for standardizing screenshots or simulating different device displays. ✨

🌟 Core Magic (Features)

🎯 Pixel-Perfect Control: Say goodbye to eyeballing! Enter your target resolution and the browser window instantly adjusts, ensuring screenshot dimensions are spot-on.
🔄 Preset/Custom Dual Mode:

Preset Mode: One-click selection of common resolutions (MacBook, iPhone, iPad, etc.), ready to use out of the box.
Custom Mode: Freely input any width and height to meet your special requirements.


🖼️ Smart Viewport Mode: Optional adjustment of only the webpage's visible area (Viewport), automatically excluding browser toolbars, address bars, and bookmark bars, making the content area perfectly match your target size.
🌍 Native Multi-Language Support: Automatically detects browser language environment and seamlessly switches between Chinese, Japanese, and English—no manual settings required.
⚙️ Configuration-Driven: All preset resolutions are centrally managed in config.json. Modify configurations without touching code, making maintenance super easy.


🧩 How Does It Work?
Reso-resizer's core principle is simple yet efficient:

Standard Mode: Directly calls Chrome API to resize the entire browser window to the specified dimensions.
Viewport Mode:

Injects a script to get the current webpage's actual visible area size (innerWidth/innerHeight).
Calculates the extra space occupied by browser borders and toolbars.
Automatically compensates for this space, ensuring the webpage content area perfectly matches your target resolution.




🛠️ Installation & Usage

Download or clone this repository to your local machine.
Open Chrome browser and navigate to chrome://extensions/.
Enable "Developer mode" in the top right corner.
Click "Load unpacked" and select this project folder.
Click the Reso-resizer icon in the browser toolbar and start precise control!


⚙️ How to Customize Configuration?
All configurations are centralized in the config.json file:

Add/Modify Preset Resolutions: Add or remove options in the presets array, supporting multilingual labels.
Change Default Resolution: Adjust the defaultResolution value.
Enable Viewport Mode by Default: Set defaultViewportOnly to true.

The configuration file includes detailed multilingual comments—easy to understand at a glance!

📄 Open Source License
MIT License - Free to use, contributions welcome!

---

Make every screenshot perfectly unified, starting with Reso-resizer! 🚀# Reso-resizer
