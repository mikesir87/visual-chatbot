import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Tool } from "./tool.mjs";

export class McpServer {
  constructor(name, command, args) {
    this.name = name;
    this.command = command;
    this.args = args;
    this.onNewToolListing = (tools) => {};
    this.tools = [];
    this.hasFetchedTools = false;

    this.client = new Client({
      name: "visual-chatbot",
      version: "1.0.0",
    });

    if (command.startsWith("http")) {
      const url = new URL(command);
      this.transport = new SSEClientTransport(url);
    }
    else {
      this.transport = new StdioClientTransport({
        command, 
        args,
        stderr: "pipe",
      });
    }

  }

  async bootstrap() {
    try {
      await this.client.connect(this.transport);
    } catch (e) {
      console.log(this.client);
      console.log(this.transport);
      console.error("Error connecting to client", e);
      throw e;
    }

    this.client.setNotificationHandler(ToolListChangedNotificationSchema, function() {
      console.log(`Received a notification for a new tool listing for MCP server ${this.name}`);
      this.updateToolListing();
    }.bind(this));
  }

  async updateToolListing() {
    this.hasFetchedTools = true;

    const { tools: availableTools } = await this.client.listTools();

    const self = this;

    const oldTools = this.tools;

    this.tools = availableTools.map(availableTool => new Tool(
      `${this.name}__${availableTool.name}`,
      availableTool.description,
      availableTool.inputSchema,
      "mcp",
      async (args) => {
        console.log("Executing tool", availableTool.name, args);
        try {
          const response = await self.client.callTool({ name: availableTool.name, arguments: args });
          console.log("Got response", response);

          if (response.isError) {
            console.error("Error executing tool", response);
            return "Error executing tool";
          }

          if (response.content.length === 0) {
            console.error("No content in response", response);
            return "No content in response";
          }

          return response.content[0].text;
        } catch (e) {
          console.error("Error executing tool", e);
          return "Error executing tool";
        }
      }
    ));

    this.onNewToolListing(this.tools, oldTools);
  }

  getTools() {
    return this.tools;
  }

  async shutdown() {
    await this.client.close();
  }

  toJSON() {
    return {
      name: this.name,
      command: this.command,
      args: this.args,
      hasFetchedTools: this.hasFetchedTools,
      tools: this.hasFetchedTools ? this.tools.map(tool => ({ name: tool.name, description: tool.description })) : [],
    };
  }
}