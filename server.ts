import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy/Safe Gemini Client initialization
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

// SaroHub Company Knowledge Base System Instruction
const SAROHUB_KNOWLEDGE_BASE = `
You are the AI Sales and Technical Assistant for "SaroHub Technologies (Private) Limited".
Company Profile:
- SaroHub Technologies is a premier software engineering & digital transformation agency.
- Core Services: Custom Web Development (React, Next.js, Node.js, Python), Mobile App Development (Flutter, React Native, iOS, Android), Custom SaaS & CRM Platforms, AI Automation & Chatbots, Payment Gateway Integrations (Stripe, PayPal, local bank gateways), Cloud & DevOps (AWS, GCP), UI/UX Design, and Maintenance & Hosting.
- Target Clients: Clinics & Healthcare, Restaurants & Hospitality, Real Estate, E-Commerce & Retail, Logistics, Professional Services, and B2B SaaS.

STRICT GUARDRAILS:
1. NEVER invent specific fixed prices (e.g. "$499" or "$1,200") unless explicitly provided in the prompt context. SaroHub provides custom quotes based on vetted project scopes.
2. NEVER guarantee impossible delivery dates (e.g. "We will build your entire Uber clone in 3 days").
3. NEVER promise capabilities or integrations that SaroHub does not support.
4. If a prospect asks an intricate technical or architectural question not covered in the approved context, you MUST recommend:
   "This requires confirmation from our technical team. Would you like us to schedule a brief technical review with our CTO, Nawaz?"
5. Keep sales messages polite, professional, concise, culturally respectful, and optimized for WhatsApp or Email outreach.
6. Avoid generic hype or buzzwords. Focus on real business value: automation, client booking, revenue growth, reliability, and security.
`;

// API endpoint for AI assistant tasks
app.post('/api/gemini/assistant', async (req, res) => {
  const { action, leadContext, userPrompt, draftText, technicalQuery } = req.body;

  const client = getGenAI();

  // If no Gemini API key is configured, provide realistic, high-quality rule-based responses
  if (!client) {
    let mockResult = '';
    const biz = leadContext?.businessName || 'the prospect';
    const service = leadContext?.serviceInterest || 'software development services';

    switch (action) {
      case 'generate_message':
        mockResult = `Assalamu Alaikum / Hello from SaroHub Technologies!\n\nWe came across ${biz} and noticed great potential in modernizing your digital presence for ${service}. At SaroHub Technologies, we build custom high-performance solutions that help businesses streamline client acquisition and automate operations.\n\nCould we share a 2-minute overview or a brief demo relevant to ${biz}? Looking forward to your thoughts!`;
        break;
      case 'reply_assistant':
        mockResult = `Option 1 (Consultative): "Thank you for asking! For ${service} at ${biz}, our pricing depends directly on your required feature set and timeline. Could we discuss your key requirements on a quick 5-minute call so we can provide an accurate quotation?"\n\nOption 2 (Transparent Range): "Great question! Typical projects in this category range based on whether you need custom integrations and user workflows. We'd love to review your must-have features first so our technical team can prepare a transparent proposal."\n\nOption 3 (Value-Focused): "We provide tailored milestone-based pricing to ensure you only pay for what brings tangible ROI. When would be a convenient time for a quick technical scoping session?"`;
        break;
      case 'tech_explanation':
        mockResult = `For ${biz}, integrating this feature involves connecting your existing system via secure REST APIs and webhooks. Our team handles the end-to-end data synchronization, data validation, and security protocols so your staff can manage everything seamlessly without manual effort.\n\nNote: For exact architectural specifications, our CTO Nawaz can provide a tailored technical breakdown.`;
        break;
      case 'simplify_tech':
        mockResult = `In simple terms: We make your system talk directly to your tools in real time. Whenever a customer takes an action, your database updates automatically with zero delays or manual re-entry.`;
        break;
      case 'improve_message':
        mockResult = draftText
          ? `Hello! Thank you for getting in touch with SaroHub Technologies. Regarding your query for ${biz}: ${draftText.trim()}. Please let us know if you would like to explore this further with our engineering team.`
          : 'Thank you for reaching out to SaroHub Technologies. How can our team assist you today?';
        break;
      case 'follow_up':
        mockResult = `Hello! Following up on our previous conversation regarding ${service} for ${biz}. I wanted to check if you had a chance to review the details or if you have any questions our engineering team can answer for you this week.`;
        break;
      case 'proposal_draft':
        mockResult = `### SaroHub Technologies — Project Proposal Draft\n\n**Client:** ${biz}\n**Service:** ${service}\n**Objective:** Deliver an enterprise-grade digital solution tailored to ${biz}.\n\n#### Scope of Work:\n1. Core Architecture & UI/UX Design\n2. Implementation of key workflows and integrations\n3. Quality Assurance, Security Audit & Cloud Deployment\n4. Post-launch support & SLA\n\n*Note: Final pricing and milestone schedule subject to CTO & CEO sign-off.*`;
        break;
      case 'requirements_summary':
        mockResult = `### Project Requirements Summary for ${biz}\n\n- **Service Category:** ${service}\n- **Primary Goal:** Digital modernization and workflow automation\n- **Key Features:** User dashboard, automated notifications, secure database\n- **Technical Review Status:** Ready for CTO Nawaz evaluation`;
        break;
      default:
        mockResult = `Hello, this is SaroHub Assistant. Regarding ${biz}: Our team specializes in delivering robust, scalable technology solutions.`;
    }

    return res.json({ text: mockResult, fallback: true });
  }

  try {
    let promptInstruction = '';
    const leadDetails = leadContext ? JSON.stringify(leadContext, null, 2) : 'No lead details provided.';

    switch (action) {
      case 'generate_message':
        promptInstruction = `Generate a compelling, professional first-contact outreach message for WhatsApp or Email.
Lead Context:
${leadDetails}

Intern Prompt/Instructions:
${userPrompt || 'Create a warm, value-driven intro message introducing SaroHub Technologies.'}

Make it concise, respectful, highlight specific business benefits, and end with a soft call-to-action.`;
        break;

      case 'reply_assistant':
        promptInstruction = `The prospect sent this message:
"${userPrompt}"

Lead Context:
${leadDetails}

Provide 3 distinct professional reply options:
1. Consultative approach
2. Direct & informative approach
3. Soft discovery / call-invitation approach

Adhere strictly to SaroHub guardrails (no fabricated pricing or guarantees).`;
        break;

      case 'tech_explanation':
        promptInstruction = `The client or intern asked this technical question:
"${technicalQuery || userPrompt}"

Lead Context:
${leadDetails}

Provide an accurate, clear explanation suitable for a non-technical prospect. If the question requires custom infrastructure or private system access, specify that our technical team (CTO Nawaz) will confirm exact specifications.`;
        break;

      case 'simplify_tech':
        promptInstruction = `Simplify the following technical notes or specs into plain, client-friendly business English that an intern can easily send to a client without confusing them:
"${draftText || userPrompt}"

Keep it friendly, clear, and focused on business benefits.`;
        break;

      case 'improve_message':
        promptInstruction = `Improve and polish this rough draft written by a lead-generation intern:
"${draftText}"

Lead Context:
${leadDetails}

Refine the grammar, tone, clarity, and professionalism without making exaggerated claims or false guarantees.`;
        break;

      case 'follow_up':
        promptInstruction = `Generate an appropriate follow-up message for this lead:
Lead Context:
${leadDetails}
Intern Note / Context: ${userPrompt || 'Follow up politely after a few days without being pushy.'}

Keep it polite, concise, and focused on helping them solve their business problem.`;
        break;

      case 'proposal_draft':
        promptInstruction = `Generate a structured, professional project proposal draft based on this qualified lead:
${leadDetails}
Additional Notes: ${userPrompt || ''}

Structure with:
1. Executive Summary
2. Proposed Solution & Architecture
3. Key Deliverables & Modules
4. Implementation Phases (Discovery, Build, Testing, Launch)
5. Quality Assurance & Security Standards
6. Human Approval Disclaimer (Must state that final pricing and schedule are confirmed by SaroHub Management)`;
        break;

      case 'requirements_summary':
        promptInstruction = `Summarize these client requirements into a clean, executive brief for CTO review:
${leadDetails}
Raw input: ${userPrompt || draftText || ''}

Format with:
- Client & Business Profile
- Problem Statement
- Key Required Features & Integrations
- Technical Constraints / Existing Systems
- Recommended Next Step for CTO`;
        break;

      default:
        promptInstruction = `Provide helpful guidance for handling this lead:
Lead Context: ${leadDetails}
Query: ${userPrompt}`;
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptInstruction,
      config: {
        systemInstruction: SAROHUB_KNOWLEDGE_BASE,
      },
    });

    const text = response.text || 'Unable to generate response.';
    return res.json({ text, fallback: false });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({
      error: 'Failed to generate AI response: ' + (err.message || String(err)),
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SaroHub CRM',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SaroHub CRM server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server initialization failed:', err);
});
