# AI Tab Organizer

**AI Tab Organizer** is a lightweight and powerful browser extension (Manifest V3) that leverages the **Groq API (Llama 3)** to instantly analyze, sort, and group your open browser tabs into logical, color-coded categories with a single click.

---

## Features
* **Intelligent Grouping:** The AI analyzes tab titles and URLs to generate contextual categories (e.g., *Work*, *Social*, *Shopping*, *News*).
* **Blazing Fast:** Powered by Groq's inference engine for near-instantaneous response times.
* **Privacy-Focused:** The extension communicates directly with the AI provider's API. No intermediary servers, no data logging.
* **Modern Dark UI:** A sleek, compact, and beautiful popup interface designed to fit modern browser aesthetics.

---

## Installation (Developer Mode)

Since this project is open-source, you can load it into your browser in less than a minute:

1. **Download the code:** Click the green `Code` button above and select **Download ZIP** (or clone the repository using `git clone`).
2. **Extract the file:** Unzip the downloaded archive on your computer.
3. **Open Extensions in Chrome:** Type `chrome://extensions/` in your browser's address bar and press Enter.
4. **Enable Developer Mode:** Toggle the **Developer mode** switch in the top-right corner.
5. **Load the Extension:** Click on **Load unpacked** in the top-left corner and select the extracted folder (the one containing the `manifest.json` file).

---

## Initial Setup

To get the extension up and running, you will need a free API key:
1. Head over to the [Groq Cloud Console](https://console.groq.com/) and create a free account.
2. Go to the **API Keys** section and click **Create API Key**.
3. Open the extension popup in your browser, paste your key (`gsk_...`), and click **Save**.
4. Open a bunch of chaotic tabs, click **Organize Tabs with AI**, and watch them clean themselves up!

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
