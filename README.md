#ChatBot

<img width="996" height="926" alt="image" src="https://github.com/user-attachments/assets/632bb1f1-d28d-4205-af04-32c052da2470" />

# Invoke Chatbot

A small chatbot with a dark chat UI and a Node.js backend. The backend sends your messages to an LLM hosted on [Groq](https://groq.com) and can search the web with [Tavily](https://tavily.com) when a question needs current information (weather, news, latest releases).

## Features

- Chat interface built with HTML and Tailwind CSS
- Press **Enter** to send, **Shift+Enter** for a new line
- Web search tool calling: the model decides when to search
- Markdown rendering for replies (bold, lists, code) with sanitization
- "Thinking..." indicator and error message if the server fails
- Ask button is disabled while a reply is loading
- Short-term memory of recent messages

## Tech stack

| Part | Tool |
|------|------|
| Frontend | HTML, Tailwind CSS (CDN), vanilla JavaScript, `marked`, `DOMPurify` |
| Backend | Node.js, Express |
| LLM | `openai/gpt-oss-20b` on Groq (via the `openai` npm package) |
| Web search | Tavily (`@tavily/core`) |

## Project structure

```
invoke/
├── frontend/
│   ├── index.html     # chat page
│   └── script.js      # UI logic, calls the backend
├── server.js          # Express server, POST /chat on port 3001
├── chatbot.js         # generate(): LLM call + tool-calling loop
├── .env               # API keys (do not commit)
└── package.json
```

## Setup

### 1. Prerequisites

- Node.js 18 or newer
- A free Groq API key: https://console.groq.com/keys
- A Tavily API key: https://app.tavily.com

### 2. Install dependencies

```bash
npm install
```

Main packages: `express`, `cors`, `dotenv`, `openai`, `@tavily/core`.

### 3. Add your keys

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_key_here
TAVILY_API_KEY=your_tavily_key_here
```

Add `.env` and `node_modules/` to `.gitignore` so your keys are never pushed to GitHub.

### 4. Run the backend

```bash
node server.js
```

You should see: `Example app listening on port: 3001`

### 5. Open the frontend

Open `frontend/index.html` with VS Code Live Server (usually `http://127.0.0.1:5500`). The backend must allow requests from that address, so enable CORS in `server.js`:

```js
import cors from "cors";
app.use(cors());
```

## How it works

1. You type a message and press Enter or click **Ask**.
2. `script.js` shows your message and sends `POST http://localhost:3001/chat` with `{ "message": "..." }`.
3. `chatbot.js` builds the prompt: system message, recent history, and your question.
4. The model either answers directly or calls the `webSearch` tool.
5. If it calls `webSearch`, Tavily returns results, which are sent back to the model. This repeats for at most 3 steps.
6. The final answer is returned as `{ "message": "..." }` and shown in the chat.

## API

### `POST /chat`

Request body:

```json
{ "message": "what is the weather in Mumbai today?" }
```

Response:

```json
{ "message": "Mumbai today is warm and partly cloudy..." }
```

## Known limits and troubleshooting

**`413 Request too large ... tokens per minute (TPM): Limit 8000`**
The Groq free tier allows about 8,000 tokens per minute for this model. Long search results and long history can exceed it. Wait about a minute, or reduce what is sent:

- Limit Tavily results (`maxResults: 3`) and shorten each result (`.slice(0, 500)`)
- Send only the last few messages of history
- Cap the tool-calling loop (`MAX_STEPS = 3`)

**The same search runs again and again**
The model may keep searching when results are unclear. The system prompt tells it to search at most once per question, and the loop cap is the safety net.

**Last message hidden behind the input bar**
Make sure `#chat-container` has `pb-44` (not `pd-44`) and that `script.js` uses `window.scrollTo(...)` to scroll to the bottom of the page.

**Search results show an old date**
Search results can be older than today. The system prompt includes today's date, and including the date in search queries helps.

**Nothing happens when pressing Enter**
Check that the textarea has `id="input"` and the button has `id="ask"`. A wrong id makes `querySelector` return `null`.

**CORS error in the browser console**
Enable `cors()` on the backend, and check that the fetch URL matches the backend port (3001).

**Memory resets**
Chat history is stored in server memory. It is shared by all browser tabs and cleared when the server restarts.

## Possible improvements

- Per-user sessions instead of one shared history
- Streaming replies word by word
- A "New chat" button
- Saving conversations to a database

## License

For learning and personal use.
