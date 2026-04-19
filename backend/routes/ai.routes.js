import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import alasql from 'alasql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ─── Utility: Guess Column Types ─────────────────────────────────────
function extractSchemaAndData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Read first 100 rows for schema detection
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    to: 100
  });

  if (records.length === 0) throw new Error('CSV is empty');

  const schema = {};
  const firstRow = records[0];

  Object.keys(firstRow).forEach(key => {
    schema[key] = 'string';
    // Check if numeric
    if (!isNaN(parseFloat(records[0][key]))) {
      schema[key] = 'number';
    }
  });

  return { schema, sampleData: records.slice(0, 5), fullCsvString: content };
}

// ─── Dual-Provider AI Strategy (Gemini → Groq fallback) ──────────────
// Per PDA: "If Gemini hits a rate limit or becomes unresponsive, 
// the system automatically redirects requests to Groq"
async function generateAIContent(prompt) {
  // Try Gemini first
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    console.log('[AI] Response from: Gemini');
    return result.response.text();
  } catch (geminiError) {
    console.warn('[AI] Gemini failed, falling back to Groq:', geminiError.message);
    
    // Fallback to Groq
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2048,
      });
      console.log('[AI] Response from: Groq (fallback)');
      return chatCompletion.choices[0]?.message?.content || '';
    } catch (groqError) {
      console.error('[AI] Both Gemini and Groq failed:', groqError.message);
      throw new Error(`AI unavailable: Gemini (${geminiError.message}), Groq (${groqError.message})`);
    }
  }
}

// ─── POST /api/ai/suggest (Single Chart) ─────────────────────────────
router.post('/suggest', async (req, res) => {
  try {
    const { datasetName, prompt } = req.body;
    
    if (!datasetName) return res.status(400).json({ error: 'datasetName required' });
    
    // Find the file
    const filePath = path.join(__dirname, '../uploads', datasetName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dataset file not found on disk' });
    }

    // Extract Schema
    const { schema, sampleData, fullCsvString } = extractSchemaAndData(filePath);

    // Parse all rows for alasql using csv-parse
    const allRecords = parse(fullCsvString, { columns: true, skip_empty_lines: true, cast: true });

    // Ask LLM What to aggregate
    const sysPrompt = `
      You are an AI Business Analyst. 
      The user wants a chart for: "${prompt || 'something interesting'}"
      Here is the dataset schema: ${JSON.stringify(schema)}
      Sample data: ${JSON.stringify(sampleData)}

      Decide EXACTLY ONE chart configuration to build.
      You must respond in pure JSON (no markdown).
      Format:
      {
        "chartType": "bar" | "line" | "pie" | "area" | "kpi",
        "title": "String title for the chart",
        "xAxis": "column name to group by (dimension)",
        "yAxis": "column name to aggregate (measure)",
        "aggregationFunction": "SUM" | "AVG" | "COUNT"
      }
    `;

    let suggestionText = await generateAIContent(sysPrompt);
    suggestionText = suggestionText.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestion = JSON.parse(suggestionText);

    // Now, run ALASQL to aggregate the real data!
    let data;
    if (suggestion.chartType === 'kpi') {
      const query = `SELECT ${suggestion.aggregationFunction}([${suggestion.yAxis}]) AS val FROM ?`;
      const sqlResult = alasql(query, [allRecords]);
      data = [{ name: suggestion.title, value: sqlResult[0].val || 0 }];
    } else {
      const query = `SELECT [${suggestion.xAxis}] AS name, ${suggestion.aggregationFunction}([${suggestion.yAxis}]) AS val FROM ? GROUP BY [${suggestion.xAxis}] ORDER BY val DESC LIMIT 15`;
      const sqlResult = alasql(query, [allRecords]);
      data = sqlResult.map(r => ({ name: r.name, value: r.val }));
    }

    return res.json({
      success: true,
      chartConfig: {
        id: `chart_${Date.now()}`,
        type: suggestion.chartType,
        title: suggestion.title,
        data: data,
        xAxis: suggestion.xAxis,
        yAxis: suggestion.yAxis,
        layout: { x: 0, y: 0, w: 6, h: 4 } // Default grid position
      }
    });

  } catch (error) {
    console.error('AI Suggest Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/ai/auto-dashboard (Full Professional Dashboard) ───────
router.post('/auto-dashboard', async (req, res) => {
  try {
    const { datasetName } = req.body;
    
    if (!datasetName) return res.status(400).json({ error: 'datasetName required' });

    // Find the file
    const filePath = path.join(__dirname, '../uploads', datasetName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dataset file not found on disk' });
    }

    const { schema, sampleData, fullCsvString } = extractSchemaAndData(filePath);
    const allRecords = parse(fullCsvString, { columns: true, skip_empty_lines: true, cast: true });

    // Step 1: Ask LLM for a FULL dashboard layout (multiple charts)
    const dashPrompt = `
You are an expert Business Intelligence Dashboard Designer.
Analyze this dataset and design a COMPLETE professional dashboard.

Dataset Schema: ${JSON.stringify(schema)}
Sample Data (first 5 rows): ${JSON.stringify(sampleData)}
Total Records: ${allRecords.length}

TASK: Design exactly 6 chart+KPI configurations for a professional BI dashboard.
The dashboard should include:
- 2–3 KPI cards (key metrics like totals, averages, counts)
- 1 Bar chart (comparison)
- 1 Line or Area chart (trends / distributions)
- 1 Pie chart (composition / proportions)

RULES:
1. Use ONLY column names that exist in the schema above.
2. For each chart, specify xAxis (dimension column) and yAxis (measure column) based on the schema.
3. For KPIs, xAxis can be null.
4. Use aggregation functions: SUM, AVG, COUNT, MAX, MIN.
5. Give each chart a clear, professional title.

Respond in PURE JSON (no markdown, no explanation). Format:
[
  {
    "chartType": "kpi" | "bar" | "line" | "area" | "pie",
    "title": "Descriptive Title",
    "xAxis": "column_name or null for KPI",
    "yAxis": "column_name to aggregate",
    "aggregationFunction": "SUM" | "AVG" | "COUNT" | "MAX" | "MIN"
  }
]
Return EXACTLY 6 items in the array.
    `;

    let responseText = await generateAIContent(dashPrompt);
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const chartConfigs = JSON.parse(responseText);

    if (!Array.isArray(chartConfigs) || chartConfigs.length === 0) {
      throw new Error('AI returned invalid dashboard configuration');
    }

    // Step 2: Execute ALASQL for each chart to get REAL aggregated data
    const canvasElements = [];

    // Layout engine: position charts professionally on the 1600x900 canvas
    // Row 1: KPIs across the top
    // Row 2-3: Charts in a 2-column grid
    let kpiIndex = 0;
    let chartIndex = 0;

    for (let i = 0; i < chartConfigs.length; i++) {
      const cfg = chartConfigs[i];
      let data = [];

      try {
        if (cfg.chartType === 'kpi') {
          const aggFn = cfg.aggregationFunction || 'SUM';
          const query = `SELECT ${aggFn}([${cfg.yAxis}]) AS val FROM ?`;
          const sqlResult = alasql(query, [allRecords]);
          data = [{ name: cfg.title, value: sqlResult[0]?.val || 0 }];
        } else {
          const aggFn = cfg.aggregationFunction || 'SUM';
          const xCol = cfg.xAxis || Object.keys(schema).find(k => schema[k] === 'string');
          const yCol = cfg.yAxis || Object.keys(schema).find(k => schema[k] === 'number');
          
          if (xCol && yCol) {
            const query = `SELECT [${xCol}] AS name, ${aggFn}([${yCol}]) AS val FROM ? GROUP BY [${xCol}] ORDER BY val DESC LIMIT 12`;
            const sqlResult = alasql(query, [allRecords]);
            data = sqlResult.map(r => ({ name: r.name, value: r.val }));
          }
        }
      } catch (sqlErr) {
        console.warn(`SQL error for chart "${cfg.title}":`, sqlErr.message);
        data = [{ name: 'Error', value: 0 }];
      }

      // Calculate position on the canvas
      let x, y, w, h;

      if (cfg.chartType === 'kpi') {
        // KPIs: 3 across the top, evenly spaced
        const kpiWidth = 460;
        const kpiGap = 40;
        x = 40 + kpiIndex * (kpiWidth + kpiGap);
        y = 30;
        w = kpiWidth;
        h = 160;
        kpiIndex++;
      } else {
        // Charts: 2-column grid below KPIs
        const chartWidth = 720;
        const chartHeight = 320;
        const col = chartIndex % 2;
        const row = Math.floor(chartIndex / 2);
        x = 40 + col * (chartWidth + 40);
        y = 230 + row * (chartHeight + 30);
        w = chartWidth;
        h = chartHeight;
        chartIndex++;
      }

      canvasElements.push({
        id: `chart_${Date.now()}_${i}`,
        type: cfg.chartType,
        title: cfg.title,
        data: data,
        xAxis: cfg.xAxis,
        yAxis: cfg.yAxis,
        x, y, w, h
      });
    }

    return res.json({
      success: true,
      dashboardName: `${datasetName.replace(/\.[^/.]+$/, '')} Dashboard`,
      canvasElements
    });

  } catch (error) {
    console.error('Auto Dashboard Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/ai/chat (RAG Chat with Dataset) ──────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { datasetName, question } = req.body;

    if (!datasetName) return res.status(400).json({ error: 'datasetName required' });
    if (!question) return res.status(400).json({ error: 'question required' });

    // Find the file
    const filePath = path.join(__dirname, '../uploads', datasetName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dataset file not found on disk' });
    }

    const { schema, sampleData, fullCsvString } = extractSchemaAndData(filePath);
    const allRecords = parse(fullCsvString, { columns: true, skip_empty_lines: true, cast: true });

    // Build context: schema, stats, and sample data
    // Compute basic statistics for numeric columns
    const stats = {};
    const numericCols = Object.keys(schema).filter(k => schema[k] === 'number');
    
    for (const col of numericCols) {
      try {
        const sumResult = alasql(`SELECT SUM([${col}]) AS s, AVG([${col}]) AS a, MIN([${col}]) AS mn, MAX([${col}]) AS mx, COUNT([${col}]) AS c FROM ?`, [allRecords]);
        stats[col] = {
          sum: sumResult[0].s,
          avg: sumResult[0].a,
          min: sumResult[0].mn,
          max: sumResult[0].mx,
          count: sumResult[0].c
        };
      } catch (e) {
        // skip column if SQL fails
      }
    }

    // Compute unique values for categorical columns (top 10)
    const categoricalInfo = {};
    const stringCols = Object.keys(schema).filter(k => schema[k] === 'string');
    
    for (const col of stringCols) {
      try {
        const uniqueResult = alasql(`SELECT DISTINCT [${col}] AS val FROM ? LIMIT 10`, [allRecords]);
        categoricalInfo[col] = uniqueResult.map(r => r.val);
      } catch (e) {
        // skip
      }
    }

    const ragPrompt = `
You are an expert AI Data Analyst for AutoBI Studio. 
The user is interacting with their dataset and asking questions about it.

DATASET CONTEXT:
- Total Records: ${allRecords.length}
- Schema (column_name: type): ${JSON.stringify(schema)}
- Sample Data (first 5 rows): ${JSON.stringify(sampleData)}
- Numeric Column Statistics: ${JSON.stringify(stats)}
- Categorical Column Unique Values (top 10): ${JSON.stringify(categoricalInfo)}

USER QUESTION: "${question}"

INSTRUCTIONS:
1. Answer ONLY based on the dataset context provided above.
2. Be specific with numbers and data points.
3. If the question requires a calculation, perform it from the statistics provided.
4. Format your response in a clean, readable way.
5. If you can't answer with the given data, say so clearly.
6. Keep your response concise but informative (2-4 paragraphs max).
7. Do NOT use markdown code blocks. Use plain text with bullet points if needed.

Answer:
`;

    const answer = await generateAIContent(ragPrompt);

    return res.json({
      success: true,
      answer,
      context: {
        totalRecords: allRecords.length,
        columnsUsed: Object.keys(schema).length
      }
    });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
