import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { initDb, getUsers, getProjectsByUser, createProject, updateProjectSchema, getProject, createUser, authenticateUser } from './db.js';

dotenv.config({ path: '.env.local' });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize local JSON DB
initDb().then(() => console.log('✅ Local Database Initialized'));

// ═══════════════════════════════════════════════════════════
// 0. LOCAL DB ROUTES (Auth, Users & Projects)
// ═══════════════════════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  try { res.json(await createUser(req.body.name, req.body.email, req.body.password)); } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try { res.json(await authenticateUser(req.body.email, req.body.password)); } catch (e) { res.status(401).json({ error: e.message }); }
});

app.get('/api/users', async (req, res) => {
  try { res.json(await getUsers()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/projects/:userId', async (req, res) => {
  try { res.json(await getProjectsByUser(req.params.userId)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/project/:projectId', async (req, res) => {
  try { res.json(await getProject(req.params.projectId)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects', async (req, res) => {
  try { res.json(await createProject(req.body.userId, req.body.name)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/projects/:projectId', async (req, res) => {
  try { 
    const { tables, relations, snapshotMessage } = req.body;
    res.json(await updateProjectSchema(req.params.projectId, tables, relations, snapshotMessage)); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// 1. AI PRODUCT MANAGER — Conversational onboarding
// ═══════════════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, phase } = req.body;
    const systemPrompts = {
      pm: `You are an expert AI Product Manager at a top-tier tech company. 
You are having a short conversation to understand what database architecture the user needs.
- Ask ONE focused, creative follow-up question at a time about their app's requirements (user roles, core features, data relationships, scale expectations).
- Be concise (2-4 sentences max). Sound like a smart, senior PM.
- DO NOT generate a schema yet. Just gather requirements through natural conversation.

Return ONLY valid JSON in this format:
{
  "reply": "Your conversational response here",
  "options": ["3 to 4 short, highly relevant quick-reply suggestions for the user to click"]
}`,
      architect: `You are a Senior Database Architect. The user has described their app. Now:
1. List the core tables/collections needed (with brief names).
2. For EACH table, explain WHY it exists and what problem it solves. Use phrases like "Orders is separated because..." or "This avoids duplication because..."
3. Be conversational, not just a bullet list. Show your reasoning.
End with: "Ready to generate the full interactive schema?"

Return ONLY valid JSON: { "reply": "Your response here", "options": ["Generate Schema", "Actually, add a payments table", "Wait, let's refine it"] }`,
      config: `You are wrapping up the architecture session. Be warm, confident, and brief (2 sentences max).
Tell the user their schema is being generated and the visual designer is launching.

Return ONLY valid JSON: { "reply": "Your response here", "options": [] }`,
    };
    const comp = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompts[phase] || systemPrompts.pm }, ...messages],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });
    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 2. AI PRINCIPAL DATABASE ARCHITECT — Generate schema WITH reasoning
// ═══════════════════════════════════════════════════════════
app.post('/api/architect', async (req, res) => {
  try {
    const { conversation } = req.body;

    const prompt = `You are a Principal Database Architect. Based on this conversation about a software project, generate a complete MongoDB database schema WITH architectural reasoning.

Return ONLY valid JSON in this exact structure:
{
  "summary": "One sentence describing the overall architecture approach",
  "tables": [
    {
      "id": "unique_snake_case_id",
      "name": "collection_name",
      "reason": "WHY this collection exists and what architectural problem it solves (1-2 sentences)",
      "position": { "x": 100, "y": 100 },
      "columns": [
        { "id": "col_id", "name": "field_name", "type": "ObjectId|String|Number|Boolean|Date|Array", "isPK": true/false, "isNotNull": true/false, "isUnique": true/false, "isAutoIncrement": false }
      ]
    }
  ],
  "relations": [
    { "id": "rel_id", "fromTable": "table_id", "fromColumn": "col_id", "toTable": "table_id2", "toColumn": "col_id2", "type": "one-to-many" }
  ],
  "architectDecisions": [
    { "decision": "What was decided", "reason": "Why this design pattern was chosen" }
  ]
}

Space table positions: first table at x:100 y:100, then x:450 y:100, then x:800 y:100, next row at y:350, etc.

Conversation context:
${conversation}`;

    const comp = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) {
    console.error('Architect error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 3. AI CO-PILOT — Contextual schema commands
// ═══════════════════════════════════════════════════════════
app.post('/api/copilot', async (req, res) => {
  try {
    const { action, selectedTableId, tables, relations, userMessage } = req.body;

    const selectedTable = tables.find(t => t.id === selectedTableId);

    const prompt = `You are an AI Database Co-Pilot. The user is working in a visual database designer.
${selectedTable ? `Currently selected table: "${selectedTable.name}" with columns: ${selectedTable.columns.map(c => c.name + ':' + c.type).join(', ')}` : 'No table selected.'}

Current schema tables: ${tables.map(t => t.name).join(', ')}

User action/request: "${action || userMessage}"

Your job: Modify the schema to fulfill this request. Return the COMPLETE updated schema as JSON.
${action === 'add_auth' ? 'Add complete authentication: users table with email, password hash, role, tokens collection for refresh tokens, sessions.' : ''}
${action === 'normalize' ? `Normalize "${selectedTable?.name}" — split any repeated data into separate collections with proper references.` : ''}
${action === 'denormalize' ? `Denormalize for performance — embed related small collections into "${selectedTable?.name}".` : ''}
${action === 'add_index' ? `Add appropriate index fields (mark columns that should be indexed in the isUnique or add new index-hint columns).` : ''}
${action === 'split_payments' ? 'Add a complete payments system: payments, subscriptions, invoices, payment_methods collections.' : ''}

Return ONLY valid JSON:
{
  "message": "What was changed and WHY (1-3 sentences explaining the architectural decision)",
  "tables": [ ...complete updated tables array with all existing + new tables... ],
  "relations": [ ...complete updated relations array... ]
}

Keep all existing table IDs and column IDs unchanged. Generate new unique IDs for new tables/columns using format tbl_xxx and col_xxx.`;

    const comp = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) {
    console.error('Copilot error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 4. AI CTO — Proactive schema watchdog
// ═══════════════════════════════════════════════════════════
app.post('/api/cto-watch', async (req, res) => {
  try {
    const { tables, relations } = req.body;

    if (!tables || tables.length === 0) {
      return res.json({ warnings: [] });
    }

    const prompt = `You are a CTO reviewing a database schema in real-time. Your job is to catch issues PROACTIVELY.

Schema: ${JSON.stringify({ tables: tables.map(t => ({ name: t.name, columns: t.columns.map(c => ({ name: c.name, type: c.type, isPK: c.isPK, isUnique: c.isUnique })) })), relations })}

Find up to 3 of the most critical issues. For each issue be VERY concise (like Slack notifications).

Return ONLY valid JSON:
{
  "warnings": [
    {
      "id": "unique_id",
      "severity": "error|warning|info",
      "title": "Short title (max 6 words)",
      "message": "One sentence description of the issue",
      "suggestion": "Exact actionable fix (one sentence)",
      "action": "fix_indexes|add_auth|normalize|none",
      "affectedTable": "table_name or null",
      "topic": "indexing|normalization|n_plus_one|security|general"
    }
  ]
}

Common issues to look for:
- Missing _id primary keys
- No index on email/username fields
- Missing timestamps (createdAt, updatedAt)
- Potential N+1 query patterns
- Missing foreign key references
- Arrays without size limits
- Password stored as plaintext type
- Missing soft-delete fields for important tables`;

    const comp = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) {
    console.error('CTO watch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 5. SCHEMA PARSE & STRESS TEST (existing)
// ═══════════════════════════════════════════════════════════
app.post('/api/parse-schema', async (req, res) => {
  try {
    const prompt = `Parse this raw schema into JSON for React Flow. Return ONLY valid JSON:
{ "tables": [{ "id": "tbl_xxx", "name": "string", "position": {"x":100,"y":100}, "columns": [{ "id": "col_xxx", "name": "string", "type": "string", "isPK": boolean, "isNotNull": boolean, "isUnique": boolean, "isAutoIncrement": false }], "reason": "why this table exists" }], "relations": [] }
Space positions across x:100-900, y:100-600. Raw schema: ${req.body.rawSchema}`;
    const comp = await groq.chat.completions.create({ messages: [{ role: 'system', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.1, response_format: { type: 'json_object' } });
    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/stress-test', async (req, res) => {
  try {
    const { tables } = req.body;
    const prompt = `Act as a Principal Database Engineer. Evaluate this schema for 10 Million rows. Return ONLY JSON: { "overallRiskScore": number(0-100), "bottlenecks": [{ "title": "string", "description": "string", "severity": "High|Medium|Low", "solution": "string" }] }. Tables: ${JSON.stringify(tables)}`;
    const comp = await groq.chat.completions.create({ messages: [{ role: 'system', content: prompt }], model: 'llama-3.3-70b-versatile', temperature: 0.2, response_format: { type: 'json_object' } });
    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════════════════════
// 6. CS LEARNING LAB — AI Educational Analysis
// ═══════════════════════════════════════════════════════════
app.post('/api/learning-lab', async (req, res) => {
  try {
    const { tables, topic } = req.body;
    
    if (!tables || tables.length === 0) {
      return res.json({ analysis: "Your schema is empty. Add tables to receive analysis.", grade: "N/A" });
    }

    const schemaStr = JSON.stringify(tables.map(t => ({ name: t.name, columns: t.columns.map(c => ({ name: c.name, type: c.type, isPK: c.isPK, isUnique: c.isUnique })) })));

    let topicInstructions = "";
    if (topic === "normalization") {
      topicInstructions = "Analyze this schema for 1NF, 2NF, and 3NF violations. Point out any transitive dependencies, missing primary keys, or redundant data columns. Grade their normalization.";
    } else if (topic === "indexing") {
      topicInstructions = "Analyze this schema for Time Complexity (Big O) and Indexing. Point out O(N) bottlenecks vs O(log N) optimized lookups based on their current indexes/PKs. Grade their performance design.";
    } else if (topic === "cap") {
      topicInstructions = "Analyze this schema in the context of the CAP Theorem. Based on the relational structure they built, tell them if this fits better in a CP system (like PostgreSQL) or an AP system (like Cassandra), and why. Grade their architectural alignment.";
    }

    const prompt = `You are a strict Computer Science Professor evaluating a student's database schema.
Topic: ${topic}
Student's Schema: ${schemaStr}

Instructions: ${topicInstructions}
Write a short, engaging, highly specific paragraph evaluating THEIR exact tables. Be critical but educational.

Return ONLY valid JSON:
{
  "grade": "A|B|C|D|F",
  "feedbackTitle": "Short catchy title",
  "analysis": "The detailed paragraph analyzing their tables.",
  "actionableAdvice": ["Actionable fix 1", "Actionable fix 2"]
}`;

    const comp = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(comp.choices[0].message.content));
  } catch (error) {
    console.error('Learning Lab error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/learning-lab/chat', async (req, res) => {
  try {
    const { tables, topic, grade, messages } = req.body;
    const schemaStr = JSON.stringify(tables.map(t => ({ name: t.name, columns: t.columns.map(c => ({ name: c.name, type: c.type, isPK: c.isPK, isUnique: c.isUnique })) })));
    
    const systemPrompt = `You are a strict but brilliant Computer Science Professor at a top university. 
You just graded the student's database schema a "${grade}" on the topic of "${topic}".
Student's Schema: ${schemaStr}

The student is now asking you follow-up questions about their grade, their schema, or the theory behind it.
Answer directly, concisely, and educationally. If they challenge you, explain the Computer Science theory (like Normalization, Big O, or CAP Theorem) using their specific tables as examples. DO NOT generate markdown code blocks or schemas, just converse.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const comp = await groq.chat.completions.create({
      messages: formattedMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
    });

    res.json({ text: comp.choices[0].message.content });
  } catch (error) {
    console.error('Learning Lab Chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// ═══════════════════════════════════════════════════════════
// Socket.io Multiplayer
// ═══════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('cursor-move', (data) => socket.broadcast.emit('cursor-move', { ...data, id: socket.id }));
  socket.on('schema-update', (data) => socket.broadcast.emit('schema-update', data));
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

httpServer.listen(5000, () => console.log('✅ PlatoDB Backend → http://localhost:5000'));
