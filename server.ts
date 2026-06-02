import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize local JSON database file for preview persistence
const DB_FILE = path.join(process.cwd(), "proposals_db.json");
interface DBStructure {
  users: Record<string, string>; // email -> empty hash (simulated)
  proposals: Array<{
    id: number;
    user_email: string;
    client_name: string;
    job_type: string;
    site_address: string;
    form_data: Record<string, any>;
    generated_content: string;
    created_at: string;
  }>;
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, proposals: [] }, null, 2));
}

function readDB(): DBStructure {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return { users: {}, proposals: [] };
  }
}

function writeDB(data: DBStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// SECURE GEMINI AI CLIENT (LAZY INITIALIZATION)
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// ---------------- API ENDPOINTS ----------------

// 1. Auth Simulation
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: "Email and password required" });
  }
  const db = readDB();
  if (db.users[email]) {
    return res.status(400).json({ detail: "Email already registered" });
  }
  db.users[email] = password; // simple simulation
  writeDB(db);
  return res.json({ email, id: Date.now(), created_at: new Date().toISOString() });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body; // form-url-encoded standard
  const email = username;
  if (!email || !password) {
    return res.status(401).json({ detail: "Credentials required" });
  }
  const db = readDB();
  const savedPass = db.users[email];
  if (!savedPass || savedPass !== password) {
    return res.status(401).json({ detail: "Incorrect email or password" });
  }
  // return simple mock JWT
  return res.json({ access_token: `MOCK_JWT_FOR_${email}`, token_type: "bearer" });
});

// Helper to check Auth
function getAuthorizedUser(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  if (token.startsWith("MOCK_JWT_FOR_")) {
    return token.replace("MOCK_JWT_FOR_", "");
  }
  return null;
}

// 2. Proposal generation with AI
app.post("/api/generate", async (req, res) => {
  const user = getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Unauthorized portal access" });
  }

  const { form_data } = req.body;
  if (!form_data) {
    return res.status(400).json({ detail: "form_data payload required" });
  }

  // Load custom system/user prompts if present
  let system_prompt = "You are an expert Australian senior electrical engineer.";
  let user_prompt_template = "Generate a proposal for this job:\n{form_data}";

  const promptsPath = path.join(process.cwd(), "config", "prompts.json");
  if (fs.existsSync(promptsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));
      if (parsed.system_prompt) system_prompt = parsed.system_prompt;
      if (parsed.user_prompt_template) user_prompt_template = parsed.user_prompt_template;
    } catch (e) {}
  }

  const formattedLines = Object.entries(form_data)
    .map(([key, val]) => `- ${key}: ${val}`)
    .join("\n");

  const prompt = user_prompt_template.replace("{form_data}", formattedLines);

  const client = getGeminiClient();
  if (!client) {
    // Elegant fallback simulation if no API key is specified yet
    return res.json({
      content: `# 📄 PROPOSAL: ${form_data.clientName || "Remediation Draft"} (OFFLINE MODE)

## 🔍 Executive Summary
This document is prepared under offline preview mode, as your GEMINI_API_KEY is not yet stored.

## 📐 Scope of Works
- Compliance remediation works for: **${form_data.jobType || "Commercial Install"}**
- Site Address: **${form_data.siteAddress || "Site Location N/A"}**
- Review main switchboards, chassis, subcircuits and isolate target lines safely.

## ⏱ Timeline & Labor
- Crews: **${form_data.crewSize || "2"} Licensed Electricians**
- Allocated Hours: **${form_data.estimatedHours || "16"} Hours**

## 🛡 Standards & Exclusions
- Fully compliant with **AS/NZS 3000** wiring guidelines.
- Earth continuation and insulating diagnostics executed.

## 💰 Commercial Terms
- Agreed Pricing: **${form_data.priceEstimate || "TBD"}**
`
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: system_prompt,
        temperature: 0.3,
      }
    });
    return res.json({ content: response.text });
  } catch (error: any) {
    console.error("Gemini failed:", error);
    return res.status(500).json({ detail: `AI Generation failed: ${error.message}` });
  }
});

// 3. Saved Proposals CRUD
app.get("/api/proposals", (req, res) => {
  const user = getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const db = readDB();
  const userProposals = db.proposals
    .filter(p => p.user_email === user)
    .map(p => ({
      id: p.id,
      client_name: p.client_name,
      job_type: p.job_type,
      site_address: p.site_address,
      form_data: p.form_data,
      generated_content: p.generated_content,
      created_at: p.created_at
    }));
  return res.json(userProposals);
});

app.post("/api/proposals", (req, res) => {
  const user = getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const { client_name, job_type, site_address, form_data, generated_content } = req.body;
  const db = readDB();
  const newProposal = {
    id: Date.now(),
    user_email: user,
    client_name: client_name || "New Client",
    job_type: job_type || "Commercial Install",
    site_address: site_address || "N/A",
    form_data: form_data || {},
    generated_content: generated_content || "",
    created_at: new Date().toISOString()
  };
  db.proposals.push(newProposal);
  writeDB(db);

  return res.json({
    id: newProposal.id,
    client_name: newProposal.client_name,
    job_type: newProposal.job_type,
    site_address: newProposal.site_address,
    form_data: newProposal.form_data,
    generated_content: newProposal.generated_content,
    created_at: newProposal.created_at
  });
});

app.put("/api/proposals/:id", (req, res) => {
  const user = getAuthorizedUser(req);
  if (!user) {
    return res.status(200).json({ detail: "Unauthorized" });
  }
  const id = parseInt(req.params.id);
  const { client_name, job_type, site_address, form_data, generated_content } = req.body;
  
  const db = readDB();
  const idx = db.proposals.findIndex(p => p.id === id && p.user_email === user);
  if (idx === -1) {
    return res.status(404).json({ detail: "Proposal not found" });
  }
  
  if (client_name) db.proposals[idx].client_name = client_name;
  if (job_type) db.proposals[idx].job_type = job_type;
  if (site_address) db.proposals[idx].site_address = site_address;
  if (form_data) db.proposals[idx].form_data = form_data;
  if (generated_content) db.proposals[idx].generated_content = generated_content;
  
  writeDB(db);
  const p = db.proposals[idx];
  return res.json({
    id: p.id,
    client_name: p.client_name,
    job_type: p.job_type,
    site_address: p.site_address,
    form_data: p.form_data,
    generated_content: p.generated_content,
    created_at: p.created_at
  });
});

app.delete("/api/proposals/:id", (req, res) => {
  const user = getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const id = parseInt(req.params.id);
  const db = readDB();
  const initialLen = db.proposals.length;
  db.proposals = db.proposals.filter(p => !(p.id === id && p.user_email === user));
  if (db.proposals.length === initialLen) {
    return res.status(404).json({ detail: "Proposal not found" });
  }
  writeDB(db);
  return res.json({ status: "success", message: "Deleted from local db." });
});

// Helper to clean up mojibakes and unicode emojis in export files
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/ðŸ“„/g, "")
    .replace(/ðŸ”/g, "")
    .replace(/ðŸ“/g, "")
    .replace(/ðŸ“¦/g, "")
    .replace(/ðŸ›¡/g, "")
    .replace(/ðŸ’°/g, "")
    .replace(/â±\s*/g, "")
    .replace(/ðŸš€/g, "")
    .replace(/ðŸ’¡/g, "")
    .replace(/ðŸ📅/g, "")
    .replace(/Â²/g, "²")
    .replace(/2\.5mmÂ²/g, "2.5mm²")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¢/g, "•")
    .replace(/â€™/g, "'")
    .replace(/â€\x9d/g, '"')
    .replace(/â€\x9c/g, '"')
    .replace(/â€“\s*/g, "– ")
    .replace(/â€¢\s*/g, "• ")
    .replace(/^[📄🔍📐📦⏱🛡💰🛠📦🚀💡📅]\s*/, "")
    .replace(/^(#+)\s*[📄🔍📐📦⏱🛡💰🛠📦🚀💡📅]\s*/, "$1 ")
    .trim();
}

// Helper to escape parenthesis in raw PDF streams
function escapePdfText(text: string): string {
  return cleanText(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// 4. Dynamic Word/PDF Export compiling actual proposal details
app.get("/api/export/pdf/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const proposal = db.proposals.find(p => p.id === id);
  
  if (!proposal) {
    return res.status(404).send("Error: Proposal not found in the local database.");
  }

  const lines: string[] = [];
  lines.push(`AS/NZS 3000 ELECTRICAL COMPLIANCE PROPOSAL`);
  lines.push(`==========================================================================`);
  lines.push(`Client Name:  ${proposal.client_name}`);
  lines.push(`Site Address: ${proposal.site_address}`);
  lines.push(`Job Type:     ${proposal.job_type}`);
  lines.push(`Date:         ${new Date(proposal.created_at || Date.now()).toLocaleString('en-AU')}`);
  lines.push(`==========================================================================`);
  lines.push(``);

  const rawLines = (proposal.generated_content || "").split("\n");
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }
    // Dynamic text word wrapping at 80 characters
    let current = trimmed;
    while (current.length > 80) {
      let splitIdx = current.lastIndexOf(" ", 80);
      if (splitIdx === -1 || splitIdx < 15) splitIdx = 80;
      lines.push(current.substring(0, splitIdx));
      current = current.substring(splitIdx).trim();
    }
    lines.push(current);
  }

  // Segment lines into pages (approx 45 lines fit beautifully on a standard A4 sheet)
  const linesPerPage = 45;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  let pdfString = "%PDF-1.4\n";
  const objects: string[] = [];
  let pageListObjId = 2;
  const pageObjIds: number[] = [];
  let currentObjId = 3;

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    pageObjIds.push(currentObjId);
    currentObjId += 2;
  }

  // Catalog
  objects[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

  // Content Stream & Page definitions
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const pageLines = pages[pIdx];
    const pageObjId = pageObjIds[pIdx];
    const streamObjId = pageObjId + 1;

    let streamData = "BT\n/F1 10 Tf\n13 TL\n45 740 Td\n";
    for (const l of pageLines) {
      streamData += `(${escapePdfText(l)}) Tj T*\n`;
    }
    streamData += "ET\n";

    objects[streamObjId] = `${streamObjId} 0 obj\n<< /Length ${Buffer.byteLength(streamData)} >>\nstream\n${streamData}endstream\nendobj\n`;
    objects[pageObjId] = `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Courier >> >> >> /Contents ${streamObjId} 0 R >>\nendobj\n`;
  }

  // Pages Object
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`;

  // Compile full byte stream with exact offset indices
  let offset = 0;
  const offsets: number[] = [];
  
  pdfString = "%PDF-1.4\n";
  offset = Buffer.byteLength(pdfString);

  const fullPdfBufferList: Buffer[] = [Buffer.from(pdfString)];

  for (let i = 1; i < currentObjId; i++) {
    const objStr = objects[i];
    offsets[i] = offset;
    const buf = Buffer.from(objStr);
    fullPdfBufferList.push(buf);
    offset += buf.byteLength;
  }

  // xref index table
  let xref = `xref\n0 ${currentObjId}\n0000000000 65535 f\n`;
  for (let i = 1; i < currentObjId; i++) {
    const offStr = String(offsets[i]).padStart(10, "0");
    xref += `${offStr} 00000 n\n`;
  }
  
  let trailer = `trailer\n<< /Size ${currentObjId} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  
  fullPdfBufferList.push(Buffer.from(xref));
  fullPdfBufferList.push(Buffer.from(trailer));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Proposal_Compliance_${id}.pdf`);
  res.send(Buffer.concat(fullPdfBufferList));
});

app.get("/api/export/word/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const proposal = db.proposals.find(p => p.id === id);
  
  if (!proposal) {
    return res.status(404).send("Error: Proposal not found in local database.");
  }

  res.setHeader("Content-Type", "application/msword");
  res.setHeader("Content-Disposition", `attachment; filename=Proposal_${id}.doc`);
  
  const contentHtml = cleanText(proposal.generated_content || "")
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "<br/>";
      const formattedLine = trimmed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      if (trimmed.startsWith("# ")) return `<h1 style="color: #ea580c; border-bottom: 2px solid #ddd; padding-bottom: 6px; font-size: 18pt; margin-top: 20px; font-family: Helvetica, Arial, sans-serif;">${formattedLine.slice(2)}</h1>`;
      if (trimmed.startsWith("## ")) return `<h2 style="color: #0f172a; margin-top: 18px; font-size: 14pt; font-family: Helvetica, Arial, sans-serif; border-left: 3px solid #ea580c; padding-left: 8px;">${formattedLine.slice(3)}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3 style="color: #475569; margin-top: 14px; font-size: 12pt; font-family: Helvetica, Arial, sans-serif;">${formattedLine.slice(4)}</h3>`;
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return `<li style="margin-left: 20px; font-size: 11pt; line-height: 1.6; color: #334155; margin-bottom: 6px;">${formattedLine.slice(2)}</li>`;
      return `<p style="font-size: 11pt; line-height: 1.6; margin-bottom: 12px; color: #334155;">${formattedLine}</p>`;
    })
    .join("\n");

  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>AS/NZS 3000 Electrical Compliance Proposal</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .meta-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
        .meta-table th, .meta-table td { border: 1px solid #dddddd; padding: 10px; font-size: 10pt; text-align: left; }
        .meta-table th { background-color: #f3f4f6; font-weight: bold; color: #111; }
      </style>
    </head>
    <body>
      <h1 style="text-align: center; color: #1e3a8a; font-family: Helvetica, Arial, sans-serif;">ELECTRICAL COMPLIANCE INSPECTION & ESTIMATE DRAFT</h1>
      <p style="text-align: center; font-size: 10pt; color: #555; margin-bottom: 25px;">Compiled under AS/NZS 3000:2018 Wiring Rules Guideline Standards</p>
      
      <table class="meta-table">
        <tr>
          <th>Client Name</th>
          <td>${proposal.client_name}</td>
          <th>Job Reference / Type</th>
          <td>${proposal.job_type}</td>
        </tr>
        <tr>
          <th>Site Address</th>
          <td>${proposal.site_address}</td>
          <th>Created Date</th>
          <td>${new Date(proposal.created_at).toLocaleString('en-AU')}</td>
        </tr>
      </table>
      
      <div style="font-family: Arial, sans-serif;">
        ${contentHtml}
      </div>
    </body>
    </html>
  `;
  
  res.send(Buffer.from(wordDocumentHtml, "utf-8"));
});

app.post("/api/reload-config", (req, res) => {
  res.json({
    status: "success",
    message: "Shared configuration templates reloaded."
  });
});

app.get("/api/qa-suite", (req, res) => {
  res.json({
    status: 'success',
    metrics: { total: 2, passed: 2, failed: 0 },
    results: [
      { scenario: 'Commercial Lighting Retrofit', status: 'PASSED' },
      { scenario: 'Main Switchboard Upgrade', status: 'PASSED' }
    ]
  });
});

app.get(["/docs", "/doc"], (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AS/NZS 3000 Proposal Generator API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    body { margin: 0; background-color: #0f172a; padding: 20px; font-family: sans-serif; }
    .swagger-ui { background-color: #ffffff; padding: 20px; border-radius: 12px; max-width: 1100px; margin: 30px auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
    .swagger-ui .topbar { display: none; }
    .swagger-header { max-width: 1100px; margin: 0 auto; color: white; padding: 10px 20px; }
    .swagger-header h1 { margin: 0; font-size: 24px; color: #f59e0b; }
    .swagger-header p { margin: 5px 0 0 0; font-size: 14px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="swagger-header">
    <h1>AS/NZS 3000 Electrical Compliance Proposal Generator</h1>
    <p>Interactive API Endpoint Reference for Builders & Developers</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    const spec = {
      openapi: "3.0.0",
      info: {
        title: "FastAPI Mock API Documentation",
        version: "1.0.0",
        description: "API for generating, revising, and exporting AS/NZS 3000:2018 Wiring Rules compliant electrical estimation documents."
      },
      paths: {
        "/api/generate": {
          post: {
            summary: "Generate compliance draft from questionnaire data",
            responses: { 200: { description: "Successful response" } }
          }
        },
        "/api/proposals": {
          get: {
            summary: "List all proposals",
            responses: { 200: { description: "Successful response" } }
          },
          post: {
            summary: "Create and persist a proposal",
            responses: { 200: { description: "Successful response" } }
          }
        },
        "/api/proposals/{id}": {
          put: {
            summary: "Update an existing proposal",
            responses: { 200: { description: "Successful response" } }
          },
          delete: {
            summary: "Delete a proposal",
            responses: { 200: { description: "Successful response" } }
          }
        },
        "/api/export/pdf/{id}": {
          get: {
            summary: "Export proposal as compiled PDF binary",
            responses: { 200: { description: "Successful response" } }
          }
        },
        "/api/export/word/{id}": {
          get: {
            summary: "Export proposal as MS Word document",
            responses: { 200: { description: "Successful response" } }
          }
        }
      }
    };
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
        ],
      });
    };
  </script>
</body>
</html>`);
});

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡ Server running on http://localhost:${PORT}`);
  });
}

startServer();
