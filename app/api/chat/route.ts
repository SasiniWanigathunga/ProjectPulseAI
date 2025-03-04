import axios from "axios";
import Groq from "groq-sdk";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextResponse } from "next/server";

// Environment variables
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GROQ_API_KEY,
  JIRA_API_TOKEN,
  JIRA_USERNAME,
  JIRA_INSTANCE_URL,
} = process.env;

// Initialize your Astra DB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// -------------------------
// Utility: Get embedding for a given text using your external service
const getEmbedding = async (text) => {
  try {
    const response = await axios.post("http://192.248.10.120:8000/embedding", { text });
    return response.data.embedding;
  } catch (error) {
    console.error("Error fetching embedding:", error);
    throw error;
  }
};

// -------------------------
// Utility: Call Jira’s REST API using a JQL query
async function performJiraJQLQuery(jql) {
  const url = `${JIRA_INSTANCE_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}`;
  const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString("base64");
  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });
  return response.data;
}

// -------------------------
// Utility: Determine if the message appears to be Jira-related
function isJiraQuery(message) {
  // A simple heuristic: check if the message mentions "jira", "issue", or your project name.
  return /jira/i.test(message) || /issue/i.test(message) || /ProjectPulseAI/i.test(message);
}

// -------------------------
// POST handler for your LLM chatbot
export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content || "";

    // ---------- RAG Component: Retrieve related documents from Astra DB ----------
    let docContext = "";
    try {
      const embedding = await getEmbedding(latestMessage);
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: embedding,
        },
        limit: 10,
      });
      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap, null, 2);
    } catch (err) {
      console.error("Error querying Astra DB:", err);
      docContext = "Error fetching related documents.";
    }

    // ---------- Jira Component: Fetch Jira issues if query is Jira-related ----------
    let jiraContext = "";
    if (isJiraQuery(latestMessage)) {
      // Customize the JQL query as needed
      const jql = "project = ProjectPulseAI AND status != 'Closed'";
      try {
        const jiraData = await performJiraJQLQuery(jql);
        // jiraContext = `Jira Issues:\n${JSON.stringify(jiraData.issues, null, 2)}`;
        const jiraIssuesSummary = jiraData.issues
          .map(issue => `Key: ${issue.key}, Summary: ${issue.fields.summary}, Status: ${issue.fields.status.name}`)
          .join("\n");
        jiraContext = `Jira Issues:\n${jiraIssuesSummary}`;
      } catch (err) {
        console.error("Error querying Jira:", err);
        jiraContext = "Error fetching Jira issues.";
      }
    }

    // ---------- Build the combined system prompt ----------
    const systemMessage = {
      role: "system",
      content: `You are an AI Assistant with access to external knowledge sources.

----------------------
Retrieval-Augmented Generation (RAG) Context:
START CONTEXT
${docContext}
END CONTEXT
----------------------
Jira Issues Context:
START JIRA CONTEXT
${jiraContext}
END JIRA CONTEXT
----------------------
Use the above contexts as appropriate when answering the user's query.
Question: ${latestMessage}
`,
    };

    // ---------- Call the Groq Chat Completions API ----------
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages: [systemMessage, ...messages],
      temperature: 0.6,
      max_completion_tokens: 1024,
      top_p: 0.95,
      stream: true,
    });

    // Stream the response back to the client
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (err) {
    console.error("Error processing request:", err);
    return new NextResponse("Error processing request", { status: 500 });
  }
}
