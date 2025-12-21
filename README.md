![NexusDocs Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

# NexusDocs Intelligence Platform

**NexusDocs** is a privacy-first, local-first AI platform designed for high-throughput document analysis, entity extraction, and intelligence gathering. It leverages a "Hybrid Swarm" architecture to combine the speed of local LLMs with the reasoning power of cloud models.

---

## 🚀 Key Features

### 🧠 Hybrid Swarm Architecture
NexusDocs orchestrates multiple AI models working in concert:
- **Parallel Swarm**: Run multiple agents (Gemini, OpenRouter, Local Models) simultaneously on a single document to gather diverse perspectives.
- **Consensus Engine**: Automatically aggregates and cross-validates findings from all agents to reduce hallucinations (e.g., "[SWARM CONFIRMED]").
- **Resilient Failover**: If a primary agent fails, the system automatically routes the task to the next available provider.

### ⚡ Async Verification Pipeline ("Dual-Check")
A non-blocking verification system designed for speed and accuracy:
1.  **Fast Lane**: Your primary (fast/local) model scans documents rapidly.
2.  **Smart Routing**: If a "High Priority Individual" (e.g., Politician, Executive, Celebrity) is detected, the document is marked as **"VERIFYING"** (Purple Badge).
3.  **Background Verification**: A dedicated background agent picks up the task and uses your **Preferred Verifier** (e.g., Gemini with Google Search or a larger Local Model) to double-check the finding.
 *Result: You get the throughput of a small model with the accuracy of a large model.*

### 📊 Deep Analytics & Verified Ledger
Gain broad situational awareness over your document set:
- **Verified Individuals Ledger**: A live, sorted ledger of every entity confirmed by your agents, ranked by reference count.
- **Search & Filter**: Instantly filter the Verified Ledger by name or role to find specific subjects in large datasets.
- **Dossier Mode**: Click any verified name to inspect specific mentions, context, and signal strength across all documents.
- **Geographic & Corporate Matrix**: Visualize hotspots and organizational structures automatically extracted from the text.
- **Premium Case Files**: Export a professional, print-ready HTML dossier containing all verified intelligence, formatted for official use.

### 🖥️ Dynamic Local Nodes & Swarm
Full support for **LM Studio** and local inference with advanced capabilities:
- **JSON Enforcement**: Automatically "helps" local models output structured data by injecting strict system prompts, ensuring compatibility with the swarming engine.
- **Swarm Consensus**: When "Parallel Swarm" is enabled, local models working alongside cloud models vote on findings. Verified entities are marked with `[SWARM CONFIRMED]`.
- **Multi-Port Swarming**: Connect multiple local instances (e.g., Port 1234 and Port 1235) to simulate a local cluster.

### 🕵️ Agent Intelligence (v2.0)
The core agent has been upgraded with cognitive enhancements:
- **Chain of Thought (CoT)**: System prompts now enforce "step-by-step" reasoning to reduce hallucinations.
- **Confidence Scoring**: Every document is assigned a 0-100% confidence score based on extraction clarity.
- **Timeline Reconstruction**: The agent automatically extracts a chronological list of events (`Date` -> `Event`) from case files.
### 💬 Advanced Chat Interface
A premium command center for interacting with your data:
- **One-Tap Suggestions**: Rapidly launch "Briefings", "Risk Assessments", or "Entity Lists" with suggestion chips.
- **Thinking State**: Visual pulse indicator ("Analyzing Vector Space...") for real-time feedback.
- **Terminal UI**: Enhanced aesthetic for maximum readability and "hacker" feel.

---

## 💡 Operational Use Cases
**NexusDocs** is engineered for high-stakes environments where privacy, speed, and depth of analysis are paramount:

### 🕵️ Investigative Journalism
*   **Shell Company Resolution**: Ingest thousands of leaked corporate registry PDFs to link "Anonymous LLCs" back to specific beneficial owners identified in email signatures.
*   **Asset Tracing**: Use local vision models to scan seized hard drives for images of luxury assets (yachts, watches) or handwritten ledgers.
*   **Cross-Referencing**: Instantly verify if a specific name mentioned in a 2015 report appears in a new 2024 dump.

### ⚖️ Legal Defense & eDiscovery
*   **Contradiction Spotting**: Automatically flag witness statements where dates or locations conflict with flight logs or cell tower records.
*   **Privilege Review**: Rapidly classify unidentified documents as "Privileged" or "Responsive" based on entity context before manual review.
*   **Timeline Construction**: Extract every date mentioned in 5,000 pages of discovery to build a master chronological event list.

### 💰 Corporate Due Diligence
*   **Risk Extraction**: Parse hundreds of vendor contracts to identify non-standard liability clauses or high-risk jurisdictions.
*   **Executive Vetting**: Before a merger, cross-reference key executive names against global sanctions lists and negative news using the "Dual-Check" agent.
*   **Signal Detection**: Monitor internal communication dumps for specific code words or patterns indicative of IP theft.

### 🏛️ Historical & Academic Research
*   **Primary Source Analysis**: OCR and analyze non-searchable archival scans (e.g., Cold War telexes) to map social networks of the era.
*   **Policy Evolution**: Trace how specific terminology (e.g., "Climate Change") evolved across decades of government whitepapers.

### 🌐 Human Rights Monitoring
*   **Field Report Aggregation**: Ingest messy field notes and scanned witness testimonies to identify repeat perpetrators or locations of interest.
*   **Visual Documentation**: Archive and analyze photo evidence of damage or locations, linking them to specific dates and events in the timeline.

---

## 🛠️ Setup & Configuration

### Prerequisites
- **Node.js**: v18 or higher.
- **LM Studio** (Optional): For local LLM inference.

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/nexusdocs.git
    cd nexusdocs
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    Create a `.env.local` file (optional, or configure via UI settings):
    ```env
    VITE_GEMINI_API_KEY=your_key_here
    VITE_OPENROUTER_API_KEY=your_key_here
    ```

### Running Locally
```bash
npm run dev
```
Access the dashboard at `http://localhost:5173`.

---

## ⚙️ Configuration Guide

### Enabling "Dual-Check" Mode
1.  Go to **Settings** (Gear Icon).
2.  Enable **"Dual Check Mode"**.
3.  Select your **"Preferred Verifier"** (e.g., "Local Model B" or "Gemini").
    *   *Tip: Use a small model for the main loop and a large/reasoning model for the verifier.*

### Connecting LM Studio
1.  Start LM Studio and load a model.
2.  Start the Local Server (Default Port: `1234`).
3.  In NexusDocs **Settings**, enable "Local Model A" and verify the endpoint is `http://127.0.0.1:1234`.
4.  (Optional) Enter the specific **Model ID** (e.g., `llama-3-8b`) if you want NexusDocs to request a specific model load.

---

## 🔒 Privacy & Security
- **Local First**: Files are processed in your browser or sent directly to your local LM Studio instance.
- **No Persistence**: Document data is stored in `IndexedDB` (browser storage) and is never uploaded to a central NexusDocs server.
- **Keys**: API keys are stored in `localStorage` on your device.

---

---

## ❓ Troubleshooting
**Local Model Swarm Not Working?**
- Ensure LM Studio is running in **Server Mode**.
- Verify CORS is enabled in LM Studio settings.
- Check the Console (F12) for specific swarming errors (e.g., `Parallel Agent [lmstudio] FAILED`).

**Dual Check Not Triggering?**
- Verify the "Dual Check Mode" toggle is ON in Settings.
- Ensure the primary model is finding entities classified as "High Priority" (Politicians, Executives).

---

## 📅 Roadmap
- [ ] **Graph Visualization**: Interactive node-link diagram of all verified entities.
- [ ] **Native Video & Audio**: Support for MP4/MP3 ingestion to analyze bodycam footage and wiretaps.
- [ ] **Offline OCR**: Integrate Tesseract.js for purely local image text extraction.

---

## License
MIT License.
