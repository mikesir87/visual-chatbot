import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { useCallback, useState } from "react";
import { useBackend } from "../../BackendProvider";
import { ToolDisplay } from "./ToolDisplay";
import { AddToolModal } from "./AddToolModal";
import { ToolDetailsModal } from "./ToolDetailsModal";

export const ToolCollectionDisplay = () => {
  const { tools, addTool } = useBackend();
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [toolToDisplay, setToolToDisplay] = useState(null);

  const addTimeTool = useCallback(() => {
    addTool({
      name: "get-current-time",
      description: "Get the current time for a requested timezone",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description: "The requested timezone in IANA format"
          }
        },
        required: ["timezone"]
      },
      code: "return new Date().toLocaleString('en-US', { timeZone: timezone });",
    });
  }, [addTool]);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <p>Tools enable an LLM to <em>do</em> something, rather than only return information it was trained on.</p>

            <p>The LLM will look at the request, look at the available tools, and then use those tools to gather more information or complete the requested work.</p>

            <p>Below are the tools currently available for the LLM to use in this chat session.</p>
          </Col>
        </Row>

        <hr />

        { tools.length === 0 && <p><em>There are currently no tools available</em></p> }


        {tools.map((tool) => (
          <ToolDisplay key={tool.name} tool={tool} onClick={() => setToolToDisplay(tool)} />
        ))}

        {!tools.some((tool) => tool.name === "get-current-time") && (
          <Button 
            variant="secondary"
            onClick={() => addTimeTool()}
            className="me-3 mb-3"
          >
            + Add time tool
          </Button>
        )}

        <Button 
          variant="secondary"
          onClick={() => setShowAddToolModal(true)}
        >
          + Add custom tool
        </Button>
      </Container>

      <AddToolModal show={showAddToolModal} onClose={() => setShowAddToolModal(false)} />

      <ToolDetailsModal 
        show={toolToDisplay} 
        onClose={() => setToolToDisplay(null)} 
        tools={tools}
        selectedTool={toolToDisplay} 
      />
    </>
  );
}