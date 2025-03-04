// import { DataAPIClient } from "@datastax/astra-db-ts"
// import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
// // import OpenAI from "openai"
// import Groq from "groq-sdk"
// import axios from "axios"
// import {RecursiveCharacterTextSplitter } from "langchain/text_splitter"

// import "dotenv/config"

// type SimilarityMetric = "dot_product" | "cosine" | "euclidean" 

// const { 
//     ASTRA_DB_NAMESPACE, 
//     ASTRA_DB_COLLECTION, 
//     ASTRA_DB_API_ENDPOINT, 
//     ASTRA_DB_APPLICATION_TOKEN, 
//     OPEN_AI_API_KEY,
//     GROQ_API_KEY,
//     HUGGING_FACE_API_KEY
// } = process.env

// const f1Data = [
//     'https://en.wikipedia.org/wiki/Formula_One',
//     'https://formula1.com/en/latest/all',
//     'https://www.forbes.com/sites/brettknight/2023/11/29/formula-1s-highest-paid-drivers-2023/',
//     'https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship',
//     'https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions',
//     'https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
//     'https://www.formula1.com/en/results.html/2024/races.html',
//     'https://www.formula1.com/en/racing/2024.html'
// ]

// const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
// const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

// const groq = new Groq({ apiKey: GROQ_API_KEY });
// // const openai = new OpenAI({ apiKey: OPEN_AI_API_KEY })

// // const HF_MODEL = "sentence-transformers/all-mpnet-base-v2"

// // const getHuggingFaceEmbeddings = async (text: string): Promise<number[]> => {
// //     try {
// //         const response = await axios.post(
// //             `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}?wait_for_model=true`,
// //             {
// //                 inputs: text
// //             },
// //             {
// //                 headers: {Authorization: `Bearer ${HUGGING_FACE_API_KEY}`},
// //             }
// //         )
// //         const embeddings = response.data

// //         if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
// //             const numTokens = embeddings.length
// //             const dimension = embeddings[0].length

// //             const meanEmbedding = new Array(dimension).fill(0)

// //             embeddings.forEach((tokenEmbedding: number[]) => {
// //                 tokenEmbedding.forEach((value, i) => {
// //                     meanEmbedding[i] += value
// //                 })
// //             })

// //             for (let i = 0; i < dimension; i++) {
// //                 meanEmbedding[i] /= numTokens
// //             }

// //             return meanEmbedding
// //         }

// //         return embeddings
// //     } catch (error) {
// //         console.error("Error getting Hugging Face embeddings", error)
// //         throw error
// //     }
// // }

// // const getHuggingFaceEmbedding = async (text: string, retries = 3): Promise<number[]> => {
// //     const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}?wait_for_model=true`
// //     for (let attempt = 0; attempt < retries; attempt++) {
// //       try {
// //         const response = await axios.post(
// //           url,
// //           { inputs: text },
// //           {
// //             headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
// //           }
// //         )
        
// //         const embeddings = response.data
// //         // Pooling logic (averaging tokens if needed)
// //         if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
// //           const numTokens = embeddings.length
// //           const dimension = embeddings[0].length
// //           const meanEmbedding = new Array(dimension).fill(0)
// //           embeddings.forEach((tokenEmbedding: number[]) => {
// //             tokenEmbedding.forEach((value, i) => {
// //               meanEmbedding[i] += value
// //             })
// //           })
// //           for (let i = 0; i < dimension; i++) {
// //             meanEmbedding[i] /= numTokens
// //           }
// //           return meanEmbedding
// //         }
        
// //         return embeddings
// //       } catch (error) {
// //         console.error(`Attempt ${attempt + 1} failed:`, error)
// //         if (attempt === retries - 1) {
// //           throw error
// //         }
// //         // Wait a bit before retrying (e.g., 1 second)
// //         await new Promise(resolve => setTimeout(resolve, 1000))
// //       }
// //     }
// //     throw new Error("Failed to get embedding after retries")
// //   }

// const getEmbedding = async (text) => {
//     try {
//       const response = await axios.post('http://192.248.10.120:8000/embedding', { text });
//       return response.data.embedding;
//     } catch (error) {
//       console.error('Error fetching embedding:', error);
//       throw error;
//     }
//   }

// const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 512,
//     chunkOverlap: 100
// })

// const createCollection = async (similarityMetric: SimilarityMetric = "dot_product" ) => {
//     const res = await db.createCollection(ASTRA_DB_COLLECTION, {
//         vector: {
//             dimension: 768,
//             metric: similarityMetric
//         }
//     })
//     console.log(res)
// }

// const loadSampleData = async () => {
//     const collection = await db.collection(ASTRA_DB_COLLECTION)
//     for await (const url of f1Data) {
//         const content = await scrapePage (url)
//         const chunks = await splitter.splitText(content)
//         for await (const chunk of chunks) {
//             // const embedding = await openai.embeddings.create({
//             //     model: "text-embedding-3-small",
//             //     input: chunk,
//             //     encoding_format: "float"
//             // })
//             const vector = await getEmbedding(chunk)
//             // const vector = embedding.data[0].embedding

//             const res = await collection.insertOne({
//                 $vector: vector,
//                 text: chunk
//             })
//         }
//     }
// }

// const scrapePage = async (url: string) => {
//     const loader = new PuppeteerWebBaseLoader(url, {
//         launchOptions: {
//             headless: true
//         },
//         gotoOptions: {
//             waitUntil: "domcontentloaded"
//         },
//         evaluate: async (page, browser) => {
//             const result = await page.evaluate(() => document.body.innerHTML)
//             await browser.close()
//             return result
//         }
//     })
//     return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
// }

// createCollection().then(() => {loadSampleData()})

import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const { 
  ASTRA_DB_NAMESPACE, 
  ASTRA_DB_COLLECTION, 
  ASTRA_DB_API_ENDPOINT, 
  ASTRA_DB_APPLICATION_TOKEN, 
  OPEN_AI_API_KEY,
  GROQ_API_KEY,
  HUGGING_FACE_API_KEY
} = process.env;

const f1Data = [
  // "https://en.wikipedia.org/wiki/Formula_One",
  // "https://formula1.com/en/latest/all",
  // "https://www.forbes.com/sites/brettknight/2023/11/29/formula-1s-highest-paid-drivers-2023/",
  // "https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship",
  // "https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions",
  // "https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship",
  // "https://www.formula1.com/en/results.html/2024/races.html",
  // "https://www.formula1.com/en/racing/2024.html",
  "./app/data/ChangeRequestDocument.docx",
  "./app/data/CommunicationPlan.docx",
  "./app/data/DetailedBudgetDocument.docx",
  "./app/data/DetailedProjectPlan.docx",
  "./app/data/EmployeeAssignmentOrganizationalChart.docx",
  "./app/data/KickoffMeetingMinutes.docx",
  "./app/data/ProjectCharter.docx",
  "./app/data/ProjectClosureLessonsLearned.docx",
  "./app/data/RiskManagementPlan.docx",
  "./app/data/WorkBreakdownStructure.docx",
  "https://www.ganttic.com/blog/resource-planning-tools",
  "https://www.forecast.app/blog/best-resource-management-tools",
  "https://www.projectmanager.com/guides/resource-management",
  "https://www.theguardian.com/it-starts-with-smartsheet/2025/jan/31/from-deadlines-to-budgets-project-management-skills-have-become-vital-for-everyone-heres-how-to-make-it-all-easier",
  "https://www.theguardian.com/it-starts-with-smartsheet/2025/jan/31/fewer-meetings-greater-collaboration-how-a-project-management-tool-helped-a-crane-builder-reach-new-heights",
  "https://en.wikipedia.org/wiki/Employee_scheduling_software",
  "https://arxiv.org/abs/2103.02330"
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const getEmbedding = async (text: string) => {
  try {
    const response = await axios.post("http://192.248.10.120:8000/embedding", { text });
    return response.data.embedding;
  } catch (error) {
    console.error("Error fetching embedding:", error);
    throw error;
  }
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

// // Function to load documents from a URL based on file type
// const loadDocumentFromUrl = async (url: string): Promise<string> => {
//   // Determine file type from URL (e.g., pdf, docx, or html)
//   const urlObj = new URL(url);
//   const pathname = urlObj.pathname;
//   const extension = pathname.split(".").pop()?.toLowerCase();

//   if (extension === "pdf") {
//     // Download PDF and save to a temporary file
//     const response = await axios.get(url, { responseType: "arraybuffer" });
//     const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.pdf`);
//     fs.writeFileSync(tempFilePath, response.data);
//     const loader = new PDFLoader(tempFilePath);
//     const docs = await loader.load();
//     fs.unlinkSync(tempFilePath); // clean up
//     return docs.map((doc) => doc.pageContent).join("\n");
//   } else if (extension === "docx" || extension === "doc") {
//     // Download DOCX and save to a temporary file
//     const response = await axios.get(url, { responseType: "arraybuffer" });
//     const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.docx`);
//     fs.writeFileSync(tempFilePath, response.data);
//     const loader = new DocxLoader(tempFilePath);
//     const docs = await loader.load();
//     fs.unlinkSync(tempFilePath);
//     return docs.map((doc) => doc.pageContent).join("\n");
//   } else {
//     // Default to web scraping for HTML pages
//     const loader = new PuppeteerWebBaseLoader(url, {
//       launchOptions: { headless: true },
//       gotoOptions: { waitUntil: "domcontentloaded" },
//       evaluate: async (page, browser) => {
//         // Get the text content of the page
//         const result = await page.evaluate(() => document.body.innerText);
//         await browser.close();
//         return result;
//       },
//     });
//     const content = await loader.scrape();
//     return content || "";
//   }
// };

const loadDocumentFromUrl = async (input: string): Promise<string> => {
  // Determine if the input is a URL or a local file path
  const isRemote = input.startsWith("http");

  // Determine file extension from the input string
  let extension;
  if (isRemote) {
    const urlObj = new URL(input);
    const pathname = urlObj.pathname;
    extension = pathname.split(".").pop()?.toLowerCase();
  } else {
    extension = input.split(".").pop()?.toLowerCase();
  }

  if (extension === "pdf") {
    if (isRemote) {
      const response = await axios.get(input, { responseType: "arraybuffer" });
      const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, response.data);
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();
      fs.unlinkSync(tempFilePath);
      return docs.map((doc) => doc.pageContent).join("\n");
    } else {
      const loader = new PDFLoader(input);
      const docs = await loader.load();
      return docs.map((doc) => doc.pageContent).join("\n");
    }
  } else if (extension === "docx" || extension === "doc") {
    if (isRemote) {
      const response = await axios.get(input, { responseType: "arraybuffer" });
      const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.docx`);
      fs.writeFileSync(tempFilePath, response.data);
      const loader = new DocxLoader(tempFilePath);
      const docs = await loader.load();
      fs.unlinkSync(tempFilePath);
      return docs.map((doc) => doc.pageContent).join("\n");
    } else {
      const loader = new DocxLoader(input);
      const docs = await loader.load();
      return docs.map((doc) => doc.pageContent).join("\n");
    }
  } else {
    if (isRemote) {
      const loader = new PuppeteerWebBaseLoader(input, {
        launchOptions: { headless: true },
        gotoOptions: { waitUntil: "domcontentloaded" },
        evaluate: async (page, browser) => {
          const result = await page.evaluate(() => document.body.innerText);
          await browser.close();
          return result;
        },
      });
      const content = await loader.scrape();
      return content || "";
    } else {
      throw new Error(`Unsupported file type for local file: ${input}`);
    }
  }
};


// const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
//   const res = await db.createCollection(ASTRA_DB_COLLECTION, {
//     vector: {
//       dimension: 768,
//       metric: similarityMetric,
//     },
//   });
//   console.log(res);
// };

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);
  for (const url of f1Data) {
    try {
      const content = await loadDocumentFromUrl(url);
      const chunks = await splitter.splitText(content);
      for (const chunk of chunks) {
        const vector = await getEmbedding(chunk);
        const res = await collection.insertOne({
          $vector: vector,
          text: chunk,
        });
      }
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
    }
  }
};

// createCollection().then(() => {
//   loadSampleData();
// });

loadSampleData();