# Agger Grand
Tell Us All The Dirt
# Agger Grand Soil Analytics Platform

## Project Overview
Agger Grand is a decision support system designed to help gardeners and small-scale farmers analyze soil health. The project integrates USDA soil classification standards with a custom recommendation engine to provide actionable soil improvement guidance.

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
