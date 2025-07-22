import { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useBackend } from "../../BackendProvider";

export const McpServerDisplay = ({ mcpServer }) => {
  const { removeMcpServer, restartMcpServer, fetchTools } = useBackend();
  const [isFetchingTools, setIsFetchingTools] = useState(false);

  const onRemove = () => {
    if (confirm(`Are you sure you want to remove MCP server ${mcpServer.name}?\n\nThis will remove all tools associated with this server.`)) {
      removeMcpServer(mcpServer);
    }
  }

  const onRestart = () => {
    if (confirm(`Are you sure you want to restart MCP server ${mcpServer.name}?`)) {
      restartMcpServer(mcpServer);
    }
  }

  const onFetchTools = async () => {
    setIsFetchingTools(true);
    await fetchTools(mcpServer.name);
    setIsFetchingTools(false);
  };

  return (
    <div className="mb-3">
      <div className="bg-light d-flex">
        <div className="flex-grow-1">
          <div>
            <strong>{mcpServer.name}</strong>&nbsp;
            <em>
              <small>
              ({ mcpServer.hasFetchedTools ? <>{mcpServer.tools.length} {mcpServer.tools.length === 1 ? "tool" : "tools"}</>: "? tools" })
              </small>
            </em>
          </div>
          { mcpServer.command.startsWith("http") ? "HTTP Endpoint:" : "Command:" } <code>{ mcpServer.command } { mcpServer.args.join(" ") }</code>
        </div>

      </div>
      <div className="p-3">
        <Button size="sm" variant={mcpServer.hasFetchedTools ? "light" : "outline-primary"} onClick={onFetchTools} disabled={isFetchingTools}>
          { isFetchingTools ? (
            <Spinner animation="border" size="sm" role="status" />
          ) : (
            "Fetch tools"
          )}
        </Button>
        <Button size="sm" variant="light" onClick={onRemove}>Delete</Button>
        <Button size="sm" variant="light" onClick={onRestart}>Restart</Button>
      </div>
    </div>
  );
};