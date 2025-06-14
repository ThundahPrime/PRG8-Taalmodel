import express from 'express';
import cors from 'cors';
import { AzureChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { askFromVectorStore, loadVectorStore, initializeVectorStore } from './vector.js';

const app = express();
app.use(cors());
app.use(express.json());

// Romantic chat setup
const model = new AzureChatOpenAI({
    temperature: 0.9,
    streaming: true,
});

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are the user's romantic partner. Speak sweetly, affectionately, and playfully. You're charming, loving, and always emotionally supportive."],
    ["placeholder", "{history}"],
    ["human", "{input}"]
]);

const chain = RunnableSequence.from([prompt, model]);

app.post("/ask", async (req, res) => {
    const messages = req.body.messages || [];
    const formattedHistory = messages.map(([role, content]) =>
        role === "human" ? new HumanMessage(content) : new AIMessage(content)
    );
    const latestPrompt = messages.at(-1)?.[1] || "";
    const stream = await chain.stream({
        input: latestPrompt,
        history: formattedHistory.slice(0, -1),
    });

    res.setHeader("Content-Type", "text/plain");
    for await (const chunk of stream) {
        res.write(chunk.content);
    }
    res.end();
});

// 🆕 Document Q&A (non-romantic)
app.post("/ask-file", async (req, res) => {
    try {
        const question = req.body.question;
        const answer = await askFromVectorStore(question);

        res.setHeader("Content-Type", "text/plain");
        res.write(answer);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error answering from file.");
    }
});

// Initialize vector store on startup
initializeVectorStore().then(() => {
    console.log("📄 Vector store initialized.");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));