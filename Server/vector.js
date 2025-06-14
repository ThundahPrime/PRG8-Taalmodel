import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AzureOpenAIEmbeddings, AzureChatOpenAI } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({ temperature: 0.9 });
const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore;

export async function initializeVectorStore() {
    const loader = new TextLoader("./public/example.txt");
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await splitter.splitDocuments(docs);
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectorStore.save("vectordatabase");
    console.log("✅ Vector store initialized and saved.");
}

export async function loadVectorStore() {
    vectorStore = await FaissStore.load("vectordatabase", embeddings);
    console.log("✅ Vector store loaded from disk.");
}

export async function askFromVectorStore(userQuestion) {
    if (!vectorStore) throw new Error("Vector store not loaded");

    const relevantDocs = await vectorStore.similaritySearch(userQuestion, 3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    const response = await model.invoke([
        ["system", "You're the user's romantic partner. Use the following context to answer the question sweetly and affectionately. Only use information from the context."],
        ["user", `Context: ${context}\n\nQuestion: ${userQuestion}`]
    ]);

    return response.content;
}
