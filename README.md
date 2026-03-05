# Agger Grand
Tell Us All The Dirt

## Project Overview
Agger Grand is a decision support system designed to help gardeners and small-scale farmers analyze soil health. The project integrates USDA soil classification standards with a custom recommendation engine to provide actionable soil improvement guidance.

## Local Setup
The site is static HTML, CSS, and JavaScript, but the compost table reads `data/compost.json` with `fetch()`. That means `compostTable.html` must be opened through a local web server. If you double-click the HTML file in Edge or another browser, the compost table will stay empty because the browser blocks that local JSON request.

### Run a local server
From the project root (`d:\aggergrand-main`), run:

```powershell
npx --yes serve -l 3000 .
```

Then open:

```text
http://localhost:3000/compostTable.html
```

### Stop the server
Press `Ctrl + C` in the terminal where the server is running.

### Notes
* Port `3000` is just an example. Any open port works.
* The server must be started from the project root so the browser can reach `data/compost.json`.
* If you still see an empty table, check the browser URL. It should start with `http://localhost:` and not `file:///`.

## System Architecture & Workflow
The project consists of two distinct phases of development:

### 1. The Core Analytics (Python)
* **Location:** `/model_development` (or whatever you named your python folder)
* **Function:** I developed the initial recommendation logic and soil texture algorithms using Python. This served as the testing ground to validate the USDA classification math and data structure.

### 2. The Web Deployment (HTML/JS)
* **Location:** Root directory
* **Function:** To make the tool accessible to users without a coding background, I translated the verified Python logic into a web-based interface.
* **Extended Features:**
    * **Soil Texture Calculator:** A user-friendly interface for the classification algorithm.
    * **Compost Database:** A structured dataset of compost types to match soil needs.
    * **Translated Logic:** The Python models were ported to JavaScript to run client-side for real-time feedback.
