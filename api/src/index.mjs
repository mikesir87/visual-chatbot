import express from 'express';
import fs from 'fs';
import http from 'http';
import { Server as SocketIo } from 'socket.io';
import dotenv from 'dotenv';
import { Configuration } from './config.mjs';
import { MessageStore } from './messageStore.mjs';
import { ToolStore } from './toolStore.mjs';
import { Tool } from './tool.mjs';
import { LlmClient } from './llmClient.mjs';
import { McpServer } from './mcpServer.mjs';
import { McpServerStore } from './mcpServerStore.mjs';
import { BackendOptions } from './backendOptions.mjs';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new SocketIo(server);
dotenv.config();

const config = new Configuration();

const messageStore = new MessageStore();
const toolStore = new ToolStore();
const mcpServerStore = new McpServerStore(toolStore);
const llmClient = new LlmClient(
  config, 
  messageStore, 
  toolStore
);

app.use(express.json());
app.use(express.static('public'));

app.get("/api", (req, res) => {
  res.json({ status: 'ok' });
});

app.get("/api/config", (req, res) => {
  BackendOptions.getConfigurations()
    .then(config => res.json(config));
});

app.post("/api/config", (req, res) => {
  if (!req.body.systemPrompt || !req.body.model || !req.body.endpoint) {
    res.status(400).json({ status: 'error', message: 'Missing required fields' });
    return;
  }

  if (req.body.apiKey)
    config.setApiKey(req.body.apiKey);

  config.setModel(req.body.model);
  config.setEndpoint(req.body.endpoint);  
  config.setSystemPrompt(req.body.systemPrompt);

  console.log("Config updated", config.toJSON());
  
  res.json(config.toJSON());
});

app.get("/api/personas", async (req, res) => {
  try {
    const promptFiles = fs.readdirSync('./src/personas');

    const personas = promptFiles.map(file => 
      fs.readFileSync(path.join('./src/personas', file), 'utf-8')
    ).map(content => content.split("\n"))
    .map(([name, ...body]) => ({ name, prompt: body.join("\n") }));

    res.json(personas);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  let message = req.body.message;

  // Simulate RAG by injecting additional context into the message
  // Adding a time delay to simulate the lookup time
  if (message.indexOf("Sherlock Holmes") > -1 && message.indexOf("Additional context") === -1) {
    (await new Promise(acc => setTimeout(acc, 1500)));
    message = [
      "Additional context:",
      fs.readFileSync("./src/resources/sherlock-summary.txt", "utf-8"),
      "***************************",
      `User prompt: ${message}`
    ].join("\n");
  }

  messageStore.addMessage({
    role: "user",
    content: message,
  });
 
  res.json({ status: 'ok' });
 });

app.post("/api/messages/send", async (req, res) => {
  try {
    const response = await llmClient.sendMessage();
    res.json({ status: 'ok', message: response });
  } catch (e) {
    console.error("Error sending message", e);
    res.status(500).json({ status: 'error', message: "Unable to send message. " + e.message });
    return;
  }
});

app.post("/api/messages/invoke-tools", async (req, res) => {
  try {
    const newMessages = await llmClient.invokeTools();
    res.json({ status: 'ok', messages: newMessages });
  } catch (e) {
    console.error("Error sending message", e);
    res.status(500).json({ status: 'error', message: "Unable to send message. " + e.message });
    return;
  }
});

app.delete("/api/messages", (req, res) => {
  if (req.body.message) {
    messageStore.deleteMessage(req.body.message);
  } else {
    messageStore.clearMessages();
  }
  res.json({ status: 'ok' });
});

app.post("/api/mcp-servers", async (req, res) => {
  if (!req.body.name || !req.body.command || !req.body.args) {
    res.status(400).json({ status: 'error', message: 'Missing required fields' });
    return;
  }

  try {
    const server = new McpServer(req.body.name, req.body.command, req.body.args);
    await server.bootstrap();
    mcpServerStore.addMcpServer(server);
    res.json({ status: 'ok' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', message: "Unable to start MCP server. Validate the startup command. " + e.message });
    return;
  }
});

app.delete("/api/mcp-servers", async (req, res) => {
  if (!req.body.name) {
    res.status(400).json({ status: 'error', message: 'Missing required fields' });
    return;
  }

  await mcpServerStore.removeMcpServerByName(req.body.name);
  res.json({ status: 'ok' });
});


app.post("/api/ai-tool-creation", async (req, res) => {
  const tool = new Tool(
    "tool-creator",
    "Use this tool to create a new tool when you need additional information",
    {
      type: "object",
      properties: {
        name: { 
          type: "string",
          description: "The name of the new tool to create. If this name already exists, the previous tool will be overwritten.",
        },
        description: { 
          type: "string",
          description: "A description of the new tool to create",
        },
        code: { 
          type: "string",
          description: "A JavaScript function body that will be executed when the tool is invoked. The code will be wrapped in an async function header that will provide the specified parameters as arguments. The code's return will be the output of the tool, so must provide a return.",
        },
        parameters: { 
          type: "object" ,
          description: "An object containing the parameters that the function will accept (per the tools API specification)",
        }
      },
      required: ["name", "description", "code", "parameters"],
    },
    "local",
    async (args) => {
      addLocalTool(args.name, args.description, args.code, args.parameters);
      return "Tool created";
    }
  );

  toolStore.addTool(tool);
  res.json({ status: 'ok' });
});

app.delete("/api/ai-tool-creation", (req, res) => {
  toolStore.removeToolByName("tool-creator");
  res.json({ status: 'ok' });
});

app.post("/api/tools", async (req, res) => {
  if (!req.body.name || !req.body.description || !req.body.code || !req.body.parameters) {
    res.status(400).json({ status: 'error', message: 'Missing required fields' });
    return;
  }

  addLocalTool(req.body.name, req.body.description, req.body.code, req.body.parameters);

  res.json({ status: 'ok' });
});

app.post("/api/tools/:toolName/enable", (req, res) => {
  toolStore.setToolEnabled(req.params.toolName, req.body.enabled);
  res.json({ status: 'ok' });
});

app.delete("/api/tools/:toolName", async (req, res) => {
  toolStore.removeToolByName(req.params.toolName);
  res.json({ status: 'ok' });
});

function addLocalTool(name, description, code, parameters) {
  const requestedParameters = Object.keys(parameters?.properties || {});
  const f = new Function( `return async function( ${requestedParameters.join(", ")} ) {
    ${code}
  }`);

  const onExecute = async function(incomingArgs) {
    try {
      return await f.call(null).apply(null, requestedParameters.map(p => incomingArgs[p]));
    } catch (e) {
      return JSON.stringify({
        success: false,
        errorMessage: e.message,
      });
    }
  };

  const tool = new Tool(
    name,
    description,
    parameters,
    "local",
    onExecute,
  );

  toolStore.addTool(tool);
}

function addSystemPrompt() {
  messageStore.addMessage(
    { role: "system", content: config.systemPrompt }
  );
}

function setupEventListeners() {
  messageStore.onNewMessage(message => io.emit('newMessage', message));
  messageStore.onMessageDeleted(message => io.emit('messageDeleted', message));
  messageStore.onMessagesCleared(() => io.emit('messages', []));
  messageStore.onMessagesCleared(() => addSystemPrompt());
  toolStore.onToolAdded(tool => io.emit('toolAdded', tool.toJSON()));
  toolStore.onToolUpdated(tool => io.emit('toolUpdated', tool.toJSON()));
  toolStore.onRemovedTool(tool => io.emit('toolRemoved', tool.toJSON()));
  mcpServerStore.onMcpServerAdded(server => io.emit('mcpServerAdded', server.toJSON()));
  mcpServerStore.onMcpServerUpdated(server => io.emit('mcpServerUpdated', server.toJSON()));
  mcpServerStore.onMcpServerRemoved(server => io.emit('mcpServerRemoved', server.toJSON()));
  
  io.on('connection', (client) => {
    client.emit('config', config.toJSON());
    client.emit('messages', messageStore.getMessages());
    client.emit('tools', toolStore.getToolsJSON());
    client.emit('mcpServers', mcpServerStore.getMcpServersJSON());
  });
}

server.listen(3000, () => {
  console.log('Server running on port 3000')
  setupEventListeners();
  addSystemPrompt();
});

["SIGINT", "SIGTERM"].forEach(signal => {
  process.on(signal, async () => {
    await mcpServerStore.shutdown();
    server.close();
    process.exit();
  });
});