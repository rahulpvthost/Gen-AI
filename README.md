#ChatBot

<img width="997" height="922" alt="image" src="https://github.com/user-attachments/assets/865f6c96-504f-4323-a967-1089b9c8186b" />

# Invoke Chatbot

A small chatbot with a dark chat UI and a Node.js backend. The backend sends your messages to an LLM hosted on [Groq](https://groq.com) and can search the web with [Tavily](https://tavily.com) when a question needs current information (weather, news, latest releases).

## Features

- Chat interface built with HTML and Tailwind CSS
- Press **Enter** to send, **Shift+Enter** for a new line
- Web search tool calling: the model decides when to search
- Markdown rendering for replies (bold, lists, code) with sanitization
- "Thinking..." indicator and error message if the server fails
- Ask button is disabled while a reply is loading
- Conversation memory per browser session (`threadId` + `node-cache`, kept for 24 hours)

## Tech stack

| Part | Tool |
|------|------|
| Frontend | HTML, Tailwind CSS (CDN), vanilla JavaScript, `marked`, `DOMPurify` |
| Backend | Node.js, Express |
| LLM | `openai/gpt-oss-20b` on Groq (via the `openai` npm package) |
| Web search | Tavily (`@tavily/core`) |
| Memory | `node-cache` (in-memory, per `threadId`) |

## Project structure

```
Gen Ai/
└── invoke/                # project root (run commands from here)
    ├── frontend/
    │   ├── index.html     # chat page
    │   └── script.js      # UI logic, calls the backend
    ├── node_modules/
    ├── .env               # API keys (do not commit)
    ├── .gitignore
    ├── app.js             # terminal version of the chatbot (readline)
    ├── chatbot.js         # generate(): LLM call + tool-calling loop
    ├── server.js          # Express server, POST /chat on port 3001
    ├── package.json
    ├── package-lock.json
    └── README.md
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

Main packages: `express`, `cors`, `dotenv`, `openai`, `@tavily/core`, `node-cache`.

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

### Optional: terminal version

`app.js` is a command-line version of the chatbot. Run it with:

```bash
node app.js
```

### 5. Open the frontend

Open `frontend/index.html` with VS Code Live Server (usually `http://127.0.0.1:5500`). The backend must allow requests from that address, so enable CORS in `server.js`:

```js
import cors from "cors";
app.use(cors());
```

## How it works

1. You type a message and press Enter or click **Ask**.
2. `script.js` shows your message and sends `POST http://localhost:3001/chat` with `{ "message": "...", "threadId": "..." }`. The `threadId` is created once when the page loads.
3. `chatbot.js` loads the saved conversation for that `threadId` from the cache (or starts a new one), then adds your question.
4. The model either answers directly or calls the `webSearch` tool.
5. If it calls `webSearch`, Tavily returns results, which are sent back to the model. This repeats for at most 3 steps.
6. The conversation is saved back to the cache under the same `threadId`.
7. The final answer is returned as `{ "message": "..." }` and shown in the chat.

## API

### `POST /chat`

Request body (both fields are required, otherwise the server returns `400`):

```json
{ "message": "what is the weather in Mumbai today?", "threadId": "lx3k9abc123" }
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

**The bot forgets earlier messages**
Memory is stored per `threadId` in server memory (`node-cache`), so it is lost when:

- the page reloads (a new `threadId` is created). VS Code Live Server reloads the page every time you save a file in the project.
- the server restarts (for example `nodemon` or `node --watch` after a file change).

To keep the same thread across page reloads, store the id in `localStorage`. To keep memory across server restarts, save conversations to a file or database instead of `node-cache`. To check, log `threadId` and `cache.has(threadId)` at the start of `generate()`: the second message should show the same id and `cached: true`.

**`400 All fields are required!`**
The request is missing `message` or `threadId`. Check the request payload in the browser DevTools Network tab.

## Possible improvements

- Saving threads to a database so memory survives restarts
- Streaming replies word by word
- A "New chat" button
- Saving conversations to a database

## License

For learning and personal use.

