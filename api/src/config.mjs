import fs from "fs";

export class Configuration {
  
  /**
   * Create a new config object
   */
  constructor(apiKey, systemPrompt, model, endpoint) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = model || process.env.OPENAI_MODEL;
    this.endpoint = process.env.OPENAI_BASE_URL ?
      endpoint : `${process.env.OPENAI_BASE_URL}/chat/completions`;

    this.systemPrompt = fs.readFileSync("./src/personas/1-whimsical.txt", "utf-8")
      .split("\n").filter((l, i) => i > 0).join("\n");
    
    if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
      this.model = "gpt-4o";
      this.endpoint = "https://api.openai.com/v1/chat/completions";
    }
  }

  setSystemPrompt(systemPrompt) {
    this.systemPrompt = systemPrompt;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  getSystemPrompt() {
    return this.systemPrompt;
  }

  getApiKey() {
    return this.apiKey;
  }

  getModel() {
    return this.model;
  }

  getEndpoint() {
    return this.endpoint;
  }

  setModel(model) {
    this.model = model;
  }

  setEndpoint(endpoint) {
    this.endpoint = endpoint;
  }

  toJSON() {
    return {
      hasApiKey: this.apiKey !== undefined,
      systemPrompt: this.systemPrompt,
      model: this.model,
      endpoint: this.endpoint,
      configured: !!this.endpoint,
    };
  }

}