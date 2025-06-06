import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useBackend } from "../../BackendProvider";
import { McpServerDisplay } from "./McpServerDisplay";
import { AddMcpServerDialog } from "./AddMcpServerDialog";
import { useCallback, useState } from "react";

export const McpCollectionDisplay = () => {
  const { mcpServers, addMcpServer } = useBackend();
  const [addingWeatherServer, setAddingWeatherServer] = useState(false);
  const [addingSqliteServer, setAddingSqliteServer] = useState(false);
  const [addingDockerDesktopMcpGatewayExtension, setAddingDockerDesktopMcpGatewayExtension] = useState(false);
  const [addingDockerDesktopMcpGateway, setAddingDockerDesktopMcpGateway] = useState(false);
  const [showAddMcpServerDialog, setShowAddMcpServerDialog] = useState(false);

  const addWeatherServer = useCallback(() => {
    const mcpServer = {
      name: "weather",
      command: "node",
      args: ["../sample-mcp-server/src/index.js"],
    };

    setAddingWeatherServer(true)
    addMcpServer(mcpServer)
      .finally(() => setAddingWeatherServer(false));
  }, [addMcpServer]);

  const addSqliteDemoServer = useCallback(() => {
    const mcpServer = {
      name: "database",
      command: "docker",
      args: ["run", "--rm", "-i", "mikesir87/mcp-sqlite-demo"],
    };

    setAddingSqliteServer(true);
    addMcpServer(mcpServer)
      .finally(() => setAddingSqliteServer(false));
  }, [addMcpServer]);

  const addDockerDesktopMcpGatewayExtension = useCallback(() => {
    const mcpServer = {
      name: "dd-gateway-ext",
      command: "docker",
      args: ["run", "--rm", "-i", "alpine/socat", "STDIO", "TCP:host.docker.internal:8811"],
    };

    setAddingDockerDesktopMcpGatewayExtension(true);
    addMcpServer(mcpServer)
      .finally(() => setAddingDockerDesktopMcpGatewayExtension(false));
  }, [addMcpServer]);

  const addDockerDesktopMcpGateway = useCallback(() => {
    const mcpServer = {
      name: "dd-gateway",
      command: "docker",
      args: ["mcp", "gateway", "run"],
    };

    setAddingDockerDesktopMcpGateway(true);
    addMcpServer(mcpServer)
      .finally(() => setAddingDockerDesktopMcpGateway(false));
  }, [addMcpServer]);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <p>MCP (which stands for Model Context Protocol) provides the ability to package and run several tools in external processes.</p>

            <p>MCP defines the protocol on how to communicate with these servers, including how to list tools, execute a tool, and more.</p>

            <p>Below are the MCP servers currently available for the LLM to use in this chat session.</p>
          </Col>
        </Row>

        <hr />

        { mcpServers.length === 0 && (
          <Row>
            <Col>
              <p>No MCP servers have been added yet. Click the button below to add one.</p>
            </Col>
          </Row>
        )}

        {mcpServers.map((mcpServer) => (
          <McpServerDisplay 
            key={mcpServer.id} 
            mcpServer={mcpServer}
          />
        ))}

        <Row>
          <Col>
            { !mcpServers.some(mcp => mcp.name === "weather") && (
              <div className="mb-3">
                <Button variant="secondary" onClick={addWeatherServer} disabled={addingWeatherServer}>
                  { addingWeatherServer ? (
                    <Spinner animation="border" size="sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  ) : (
                    "+ Add weather server (local)"
                  )}
                </Button>  
              </div>
            )}
            { !mcpServers.some(mcp => mcp.name === "database") && (
              <div className="mb-3">
                <Button variant="secondary" onClick={addSqliteDemoServer} disabled={addingSqliteServer}>
                  { addingSqliteServer ? (
                    <Spinner animation="border" size="sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  ) : (
                    "+ Add sqlite server (Docker)"
                  )}
                </Button>  
              </div>
            )}

            { !mcpServers.some(mcp => mcp.name === "dd-gateway-ext") && (
              <div className="mb-3">
                <Button variant="secondary" onClick={addDockerDesktopMcpGatewayExtension} disabled={addingDockerDesktopMcpGatewayExtension}>
                  { addingDockerDesktopMcpGatewayExtension ? (
                    <Spinner animation="border" size="sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  ) : (
                    "+ Add Docker MCP Gateway (extension)"
                  )}
                </Button>  
              </div>
            )}

            { !mcpServers.some(mcp => mcp.name === "dd-gateway") && (
              <div className="mb-3">
                <Button variant="secondary" onClick={addDockerDesktopMcpGateway} disabled={addingDockerDesktopMcpGateway}>
                  { addingDockerDesktopMcpGateway ? (
                    <Spinner animation="border" size="sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  ) : (
                    "+ Add Docker MCP Gateway (native)"
                  )}
                </Button>  
              </div>
            )}

            <div>
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowAddMcpServerDialog(true)}
              >+ Add custom MCP server</Button>
            </div>
          </Col>
        </Row>
      </Container>

      <AddMcpServerDialog
        show={showAddMcpServerDialog}
        onClose={() => setShowAddMcpServerDialog(false)}
      />
    </>
  );
}