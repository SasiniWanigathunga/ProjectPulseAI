import { DataAPIClient } from "@datastax/astra-db-ts";
import Groq from "groq-sdk";
import axios from "axios";
import { OpenAIStream, StreamingTextResponse } from "ai";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, GROQ_API_KEY, HUGGINGFACE_API_KEY } = process.env;

const groq = new Groq({ apiKey: GROQ_API_KEY });

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const getEmbedding = async (text) => {
    try {
      const response = await axios.post('http://192.248.10.120:8000/embedding', { text });
      return response.data.embedding;
    } catch (error) {
      console.error('Error fetching embedding:', error);
      throw error;
    }
  };


export async function POST(req: Request) {
    try {
        const {messages} = await req.json();

        const latestMessage = messages[messages.length - 1].content;

        let docContext = ''

        const embedding = await getEmbedding(latestMessage);

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION);
            const res = await collection.find(null, {
                sort: {
                    $vector: embedding
                    },
                limit: 10
            })

            const documents = await res.toArray();
            const docsMap = documents?.map(doc => doc.text);

            docContext = JSON.stringify(docsMap);
            
        } catch (error) {
            console.log("Error quering db ...")
            docContext = ""
        }

        
        const template = {
            role : "system",
            content: `You are an AI Assistant who knows everything about Formula One.
            Use the below context to aygment what you know about Formula One racing.
            The context will provide you with the most recent page data from wikipedia,
            the official F1 website and others.

            if the conext does not incude the information you are looking for, please answer based on your
            existing knowledge an don't mention the source of your information or 
            what the context does or does not include.


            Format responses using markdown where applicable and don't return images.
            
        ----------------------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ----------------------
        QUESTION: ${latestMessage}
        ----------------------            
        `
        }


        const response = await groq.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [template, ...messages],
            temperature: 0.6,
            max_completion_tokens: 1024,
            top_p: 0.95,
            stream: true,
        });


        const stream = OpenAIStream(response);

        return new StreamingTextResponse(stream);


    } catch (error) {
        console.log("Error quering db ...")

    }
}