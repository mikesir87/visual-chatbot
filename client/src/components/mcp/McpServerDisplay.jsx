import Button from "react-bootstrap/Button";
import { useBackend } from "../../BackendProvider";

export const McpServerDisplay = ({ mcpServer }) => {
  const { removeMcpServer, restartMcpServer } = useBackend();

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

  return (
    <div className="bg-light mb-3 d-flex">
      <div className="flex-grow-1">
        <div><strong>{mcpServer.name}</strong> <em><small>({mcpServer.tools.length} {mcpServer.tools.length === 1 ? "tool" : "tools"}) </small></em></div>
        { mcpServer.command.startsWith("http") ? "HTTP Endpoint:" : "Command:" } <code>{ mcpServer.command } { mcpServer.args.join(" ") }</code>
      </div>
      <div className="p-3">
        <Button variant="light" onClick={onRemove}>🗑️</Button>
        <br />
        <Button variant="light" onClick={onRestart}>🔄</Button>
      </div>
    </div>
  );
};