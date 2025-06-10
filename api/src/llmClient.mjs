import { Agent, fetch } from "undici";
import { Configuration } from "./config.mjs";
import { MessageStore } from "./messageStore.mjs";
import { ToolStore } from "./toolStore.mjs";

export class LlmClient {
  
  /**
   * Construct a new LlmClient
   * @param {Configuration} config The configuration
   * @param {MessageStore} messageStore The store for messages
   * @param {ToolStore} toolStore The store for tools
   */
  constructor(config, messageStore, toolStore) {
    this.config = config;
    this.messageStore = messageStore;
    this.toolStore = toolStore;

    this.socketDispatcher = new Agent({
      connect: {
        socketPath: '/var/run/docker.sock'
      }
    })
  }
  
  async sendMessage(messageContent) {
    const message = {
      role: "user",
      content: messageContent,
    };

    this.messageStore.addMessage(message);

    let count = 0;
    while (count++ < 15) {
      const response = await this.#sendRequest();
      if (!response.tool_calls)
        break;

      for (const toolCall of response.tool_calls) {
        try {
          const tool = this.toolStore.getTools().find(t => t.name === toolCall.function.name);
          const result = await tool.execute(JSON.parse(toolCall.function.arguments));

          this.messageStore.addMessage({
            role: "tool",
            content: new String(result),
            tool_call_id: toolCall.id,
          });
        } catch (e) {
          console.error("Error executing tool", e);
          this.messageStore.addMessage({
            role: "system",
            content: "Error executing tool",
          });
        }
      }
    }
  }

  async #sendRequest() {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
    };

    const payload = {
      messages: this.messageStore.getMessages(),
      model: this.config.model,
      // temperature: 0.7,
      stream: false,
    };

    if (this.toolStore.getTools().length > 0) {
      payload.tools = this.toolStore.getToolConfiguration();
    }

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    };

    console.log("endpoint", this.config.endpoint);

    if (this.config.endpoint.indexOf("docker-socket") > -1) {
      requestOptions.dispatcher = this.socketDispatcher;
    }
    const response = await fetch(this.config.endpoint, requestOptions);

    if (response.status !== 200) {
      const body = await response.json();
      console.error("Request failed", response.status, body, response);
      throw new Error(`Request failed with status ${response.status} - ${body?.error?.message}`);
    }

    const body = await response.json();
    this.messageStore.addMessage( body.choices[0].message );
    return body.choices[0].message;
  }
  
}