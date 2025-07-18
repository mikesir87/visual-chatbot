import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ToolCollectionDisplay } from './tools/ToolCollectionDisplay';
import { ChatThreadDisplay } from './chat/ChatThreadDisplay';
import { MessageDisplay } from './chat/MessageDisplay';
import { MessageInput } from './chat/MessageInput';
import { McpCollectionDisplay } from './mcp/McpCollectionDisplay';
import { useBackend } from '../BackendProvider';

export function MessageSidebar() {
  const { tools, mcpServers } = useBackend();

  return (
    <Tabs
      defaultActiveKey="messages"
      id="message-sidebar"
      className="mb-3"
    >
      <Tab eventKey="messages" title="Messages">
        <div>
          <Container fluid className="border-bottom mb-3">
            <Row className="bg-secondary-subtle">
              <Col sm={2} className="fw-bold p-3">Message Role</Col>
              <Col className="fw-bold p-3">Message Content</Col>
            </Row>
          </Container>

          <ChatThreadDisplay 
            MessageComponent={MessageDisplay}
          />
        </div>
      </Tab>
      <Tab eventKey="tools" title={`Tools (${tools.length})`}>
        <ToolCollectionDisplay />
      </Tab>
      <Tab eventKey="mcp" title={`MCP servers (${mcpServers.length})`}>
        <McpCollectionDisplay />
      </Tab>
    </Tabs>
  );
}