import readline from "node:readline/promises";
import NodeCache from 'node-cache';
import "dotenv/config";
import OpenAI from "openai";
import { tavily } from "@tavily/core";


const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });


const cache = new NodeCache({stdTTL:60*60*24});//24 hours

export async function generate(userMessage,threadId){
const baseMessages=[
        { role: "system",
          content: `You are a smart personal assistant who answers the asked questions.
You have access to the following tools:
1. webSearch({query}:{query:string}) // Search the web for information.

Today's date is ${new Date().toDateString()}. Search results may be from earlier dates, so compare them with today's date before saying something is upcoming or rumored.

Rules:
- Search only for current or recent information (weather, news, prices, scores, latest releases).
- Do NOT search for stable facts, definitions or general knowledge.
- Search at most once per question, then answer directly.
- Use plain text. Do not use markdown tables.

Examples:

User: what is the full form of LOL?
Assistant: LOL stands for "Laugh Out Loud".

User: what is the weather in Delhi today?
Assistant: [call webSearch with query "Delhi weather today"], then give temperature and conditions in two lines.

User: when was iPhone 12 launched?
Assistant: It was announced on October 13, 2020 and released on October 23, 2020.`
        }, 














        //  { role: "user",
        //   content: 'when was iphone 16 launched?'
        // },
      
    ]   
    
     const messages = cache.get(threadId)??baseMessages;

     
      messages.push({
        role:'user',
        content:userMessage,
      });
   
  while(true){

const response = await client.chat.completions.create({
    temperature: 0,
    model: "openai/gpt-oss-20b",
    messages: messages,
    "tools": [
    {
      "type": "function",
      "function": {
        "name": "webSearch",
        "description": "Search the web for information",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search query"
            }
          },
          "required": ['query'],
        }
      }
    }
  ],
  tool_choice:'auto',
});

messages.push(response.choices[0].message)

const toolCalls = response.choices[0].message.tool_calls;

if(!toolCalls || toolCalls.length === 0){
    // here we end the chatbot response
    cache.set(threadId,messages);
    return response.choices[0].message.content;
    
}else{

for(const tool of toolCalls){
    const functionName = tool.function.name;
    const functionParams = tool.function.arguments;

    if(functionName === 'webSearch'){
        let toolResult;
        try{
            toolResult = await webSearch(JSON.parse(functionParams));
        }catch(err){
            toolResult = `Tool error: ${err.message}`;
        }
        messages.push({
            tool_call_id: tool.id,
            role: 'tool',
            name:functionName,
            content:toolResult,
        })
    }
}
}
}


}

async function webSearch({query}){
    //Here we will do tavily api call
    console.log('Calling web search...');
    const res= await tvly.search( query );
    const finalResult = res.results.map((result) => result.content).join('\n\n');
    return finalResult;
}