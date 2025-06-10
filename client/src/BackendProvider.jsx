import { createContext, useEffect, useState, useCallback, useContext, useMemo } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const BackendContext = createContext();

async function makeRequest(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) {
    toast.error("Request error: " + body.message);
    throw new Error(response.statusText);
  }
  return body;
}

export const BackendContextProvider = ({ children }) => {
  const [config, setConfig] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState([]);
  const [personas, setPersonas] = useState([]);

  const getBackendOptions = useCallback(() => {
    return makeRequest("/api/config");
  });

  const updateConfiguration = useCallback(async (newConfig) => {
    const mergedConfig = { ...config, ...newConfig };

    const updatedConfig = await makeRequest("/api/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mergedConfig),
    });

    setConfig(updatedConfig);
  }, [setConfig, config]);

  const isAiToolGenerationEnabled = useMemo(() => {
    return tools.some((tool) => tool.name === "tool-creator")
  }, [tools]);

  useEffect(() => {
    makeRequest("/api/personas")
      .then(setPersonas);
  }, [setPersonas]);

  useEffect(() => {
    const socket = io();
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("newMessage", (newMessage) => {
      console.log("newMessage", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on("config", (config) => {
      console.log("config", config);
      setConfig(config);
    });

    socket.on("messages", (messages) => {
      console.log("messages", messages);
      setMessages(messages);
    });

    socket.on("messageDeleted", (message) => {
      console.log("messageDeleted", message);
      setMessages((prevMessages) => prevMessages.filter((m) => m.content !== message.content));
    });

    socket.on("mcpServers", (mcpServers) => {
      console.log("mcpServers", mcpServers);
      setMcpServers(mcpServers);
    });

    socket.on("tools", (tools) => {
      console.log("tools", tools);
      setTools(tools);
    });

    socket.on("toolAdded", (tool) => {
      console.log("toolAdded", tool);
      setTools((prevTools) => [...prevTools, tool]);
    });

    socket.on("toolUpdated", (tool) => {
      console.log("toolUpdated", tool);
      setTools((prevTools) => [...prevTools.filter((t) => t.name !== tool.name), tool]);
    });

    socket.on("toolRemoved", (tool) => {
      console.log("toolRemoved", tool);
      setTools((prevTools) => prevTools.filter((t) => t.name !== tool.name));
    });

    socket.on("mcpServerAdded", (mcpServer) => {
      console.log("mcpServerAdded", mcpServer);
      setMcpServers((prevMcpServers) => [...prevMcpServers, mcpServer]);
    });

    socket.on("mcpServerUpdated", (mcpServer) => {
      console.log("mcpServerUpdated", mcpServer);
      setMcpServers((prevMcpServers) => [
        ...prevMcpServers.filter((m) => m.name !== mcpServer.name),
        mcpServer,
      ]);
    })

    socket.on("mcpServerRemoved", (mcpServer) => {
      console.log("mcpServerRemoved", mcpServer);
      setMcpServers((prevMcpServers) => prevMcpServers.filter((m) => m.name !== mcpServer.name));
    });

    return () => socket.disconnect();
  }, [setConnected, setMessages, setTools]);

  const sendMessage = useCallback(async (message) => {
    setLoading(true);
    try {
      await makeRequest("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const resetMessages = useCallback(async () => {
    await makeRequest("/api/messages", {
      method: "DELETE",
    });
  }, []);

  const deleteMessage = useCallback(async (message) => {
    await makeRequest("/api/messages", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
  });

  const toggleAiToolGeneration = useCallback(async () => {
    await makeRequest("/api/ai-tool-creation", {
      method: isAiToolGenerationEnabled ? "DELETE" : "POST",
    });
  }, [isAiToolGenerationEnabled]);

  const addTool = useCallback(async (tool) => {
    await makeRequest("/api/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tool),
    });
  }, []);

  const removeTool = useCallback(async (tool) => {
    await makeRequest(`/api/tools/${tool.name}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, []);

  const setToolEnabled = useCallback(async (tool, enabled) => {
    await makeRequest(`/api/tools/${tool.name}/enable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled }),
    });
  }, []);

  const disableAllTools = useCallback(async () => {
    tools.forEach(async (tool) => {
      await setToolEnabled(tool, false);
    });
  }, [tools, setToolEnabled]);

  const enableAllTools = useCallback(async () => {
    tools.forEach(async (tool) => {
      await setToolEnabled(tool, true);
    });
  }, [tools, setToolEnabled]);

  const addMcpServer = useCallback(async (mcpServer) => {
    await makeRequest("/api/mcp-servers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mcpServer),
    });
  }, []);

  const removeMcpServer = useCallback(async (mcpServer) => {
    await makeRequest("/api/mcp-servers", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: mcpServer.name }),
    });
  }, []);

  const restartMcpServer = useCallback(async (mcpServer) => {
    await removeMcpServer(mcpServer);
    await addMcpServer(mcpServer);
  }, [removeMcpServer, addMcpServer]);

  return (
    <BackendContext.Provider value={{ 
      config,
      getBackendOptions,
      updateConfiguration,

      connected,
      loading,

      messages,
      sendMessage,
      deleteMessage,
      resetMessages,

      tools,
      addTool,
      removeTool,
      setToolEnabled,
      disableAllTools,
      enableAllTools,

      mcpServers,
      addMcpServer,
      removeMcpServer,
      restartMcpServer,

      personas,
      
      isAiToolGenerationEnabled,
      toggleAiToolGeneration,
     }}>
      { config ? children : "Loading..." }
    </BackendContext.Provider>
  );
};

export const useBackend = () => useContext(BackendContext);