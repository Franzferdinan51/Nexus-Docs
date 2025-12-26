![NexusDocs Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

# NexusDocs Intelligence Platform

**NexusDocs** is a privacy-first, local-first AI platform designed for high-throughput document analysis, entity extraction, and intelligence gathering. It leverages a **"Hybrid Swarm"** architecture to combine the speed of local LLMs with the reasoning power of cloud models.

---

## 🚀 Key Features

### 🧠 Parallel Processing Architecture
NexusDocs orchestrates multiple AI models to maximize throughput or accuracy. You can choose between two powerful strategies:

#### 1. Consensus Mode (Swarm)
*   **Best for:** Accuracy & Validation.
*   **Behavior:** Multiple agents (e.g., Gemini + Local Model A + OpenRouter) analyze the **same document** simultaneously.
*   **Output:** The system aggregates findings. Entities confirmed by multiple models are marked as `[SWARM CONFIRMED]`, significantly reducing hallucinations.

#### 2. Distributed Mode (High-Throughput)
*   **Best for:** Speed & Bulk Processing.
*   **Behavior:** The processing queue is split across your active agents. Agent A takes Document 1, Agent B takes Document 2, etc.
*   **Output:** processing speed increases linearly with the number of active local/cloud nodes.

### ⚡ Async Verification Pipeline ("Dual-Check")
A non-blocking verification system designed for speed and precision:
1.  **Fast Lane**: Your primary (fast/local) model scans documents rapidly.
2.  **Smart Routing**: If a "High Priority Individual" (e.g., Politician, Executive, Celebrity) is detected, the document is marked as **"VERIFYING"** (Purple Badge).
3.  **Background Verification**: A dedicated background agent picks up the task and uses your **Preferred Verifier** (e.g., Gemini with Google Search) to double-check the finding without slowing down the main queue.

### 🖥️ Dynamic Local Nodes
Full support for **LM Studio** and local inference with advanced capabilities:
-   **Quad-Core Swarm**: Connect up to **4 distinct local models** (Ports `1234`, `1235`, `1236`, `1237`) to run simultaneously.
-   **JSON Enforcement**: The system automatically "helps" local models output structured data.

---

## 🤖 Recommended System Prompt for Local AI
To ensure your local LLMs (Llama 3, Mistral, Qwen, etc.) output compatible JSON for NexusDocs, we recommend using the following system prompt in your model settings (e.g., in LM Studio's "System Prompt" field).

> **Note:** NexusDocs injects this automatically via API, but setting it as a default in your runner can improve stability for smaller models.

```text
TASK: PERFORM FORENSIC ANALYSIS OF THE PROVIDED DOCUMENT/IMAGE.

CRITICAL INSTRUCTIONS:
- IDENTIFY: Visually recognize famous individuals, political figures, or known actors if present.
- INFER: Use context clues (badges, nameplates, captions, uniforms) to deduce identities.
- DESCRIBE: If a person is unknown, provide specific details (e.g., "Man with facial scar," "Woman in pilot uniform") instead of generic labels.
- READ: extract all legible text, names, dates, and locations.

1. SUMMARY: Concise overview of who is in the image/document and what is happening.
2. ENTITIES: List EVERY person found. Use "Visually Identified" in context if recognized by face.
3. POIs: Flag any high-profile targets (Epstein, Maxwell, Politicians, Royals).
4. KEY INSIGHTS: Connect visual elements to potential evidence (e.g., "Meeting suggests close association").
5. VISUAL OBJECTS: distinctive items (Safe, Aircraft Tail Number, Passport).
6. EVIDENCE TYPE: e.g., "Surveillance Photo", "Flight Log", "Passport Scan".
7. TIMELINE: Chronological list of events ({ date, event }).
8. CONFIDENCE: 0-100 score of your certainty.

Respond with a valid JSON object. IMPORTANT: Escape all double quotes within strings.
Containing:
- summary (string)
- entities (array of objects with name, role, context, isFamous)
- keyInsights (array of strings)
- sentiment (string)
- documentDate (string, if found)
- flaggedPOIs (array of strings)
- locations (array of strings)
- organizations (array of strings)
- visualObjects (array of strings)
- evidenceType (string)
- confidenceScore (number)
- timelineEvents (array of {date, event})
```

---

## 🛠️ Setup & Configuration

### Prerequisites
-   **Node.js**: v18 or higher.
-   **LM Studio** (Optional): For local LLM inference.

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
3.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Access the dashboard at `http://localhost:5173`.

---

## ⚙️ Configuration Guide

### Enabling "Dual-Check" Mode
1.  Go to **Settings** (Gear Icon).
2.  Enable **"Dual Check Mode"**.
3.  Select your **"Preferred Verifier"** (e.g., "Gemini" for web validation or "Local Model D" for privacy).

### Connecting LM Studio
1.  Start LM Studio and load a vision-capable model (recommended: `llama-3.2-vision` or `llava`).
2.  Start the Local Server (Default Port: `1234`).
3.  In NexusDocs **Settings**, enable "Local Model A".
4.  Ensure Endpoint is `http://127.0.0.1:1234`.

### 🧠 Optimal Local Models & Context Settings
NexusDocs sends large context chunks (up to **40,000 characters** or ~10k tokens) to ensure full document analysis.

> [!WARNING]
> Standard "8k Context" models will fail with complex documents. You must use models with **16k+ Context Windows**.

**Recommended Configuration:**
-   **Minimum Context**: `16384` (16k)
-   **Ideal Context**: `32768` (32k) or higher.
-   *In LM Studio: Increase the "Context Length" slider in the right sidebar before loading the model.*

**Verified High-Performance Models:**
The following vision-capable models have been vetted for the NexusDocs pipeline:
-   **GLM-4v-9B (Flash)**: Excellent balance of speed and visual reasoning.
-   **Qwen3-VL-8B**: High-precision OCR and chart reading.
-   **Qwen3-VL-30B-a3b**: SOTA performance for deep analysis.
-   (Legacy) **Llama-3.2-11B-Vision**: Good general performance.

---

## 🔒 Privacy & Security
-   **Local First**: Files are processed in your browser or sent directly to your local LM Studio instance.
-   **No Persistence**: Document data is stored in `IndexedDB` (browser storage) and is never uploaded to a central NexusDocs server.
-   **Keys**: API keys are stored in `localStorage` on your device.

---

## License
MIT License.
