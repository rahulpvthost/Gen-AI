import readline from "node:readline/promises";

import "dotenv/config";
import OpenAI from "openai";
import { tavily } from "@tavily/core";


const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });



export async function generate(userMessage){
const messages=[
        { role: "system",
          content: `You are a smart personal assistant who answers the asked questions.
                   You have access to following tools:
                   1. webSearch({query}:{query:string}) // Search the web for information.
                   Today's date is ${new Date().toDateString()}. Search results may be from earlier dates, so compare them with today's date before saying something is upcoming or rumored.`
        }, 
        //  { role: "user",
        //   content: 'when was iphone 16 launched?'
        // },
      
    ]   


     
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