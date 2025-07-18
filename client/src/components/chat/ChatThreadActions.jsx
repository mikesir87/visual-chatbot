import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { MessageInput } from "./MessageInput";
import { useBackend } from "../../BackendProvider";
import { useState } from "react";

export function ChatThreadActions() {
  const { messages, resetMessages, sendMessages, invokeTools, loading } = useBackend();
  const [addingMessage, setAddingMessage] = useState(false);

  const lastMessage = messages[messages.length - 1] || {};

  return (
    <Row>
      { addingMessage && (
        <Col sm={{ offset: 4, span: 8}} className="text-center mb-3">
          <MessageInput 
            showReset={false} 
            onMessageSubmission={() => setAddingMessage(false)}
            onCancel={() => setAddingMessage(false)}
          />
        </Col>  
      )}
      <Col sm={12} className="text-center mb-3 mt-3">
        { (lastMessage.role === undefined || lastMessage.role === "user" || lastMessage.role === "tool") && (
            <Button
                variant="outline-primary"
                onClick={sendMessages}
                disabled={loading}
                className="ms-2 me-2"
            >
                {loading ? <Spinner size="sm" /> : <>Send messages to model &rarr;</>}
            </Button>
        )}

        { lastMessage.role === "assistant" && lastMessage.tool_calls && (
            <Button
                variant="outline-primary"
                onClick={invokeTools}
                disabled={loading}
                className="ms-2 me-2"
            >
                {loading ? <Spinner size="sm" /> : <>&rarr; Invoke tool</>}
            </Button>
        )}

        { (lastMessage.role === "system" || (lastMessage.role === "assistant" && !lastMessage.tool_calls)) && !addingMessage && (
            <Button
                variant="outline-primary"
                onClick={() => setAddingMessage(true)}
                disabled={loading}
                className="ms-2 me-2"
            >
                Add user message
            </Button>
        )}

      </Col>
      { messages.length > 1 && (
        <Col sm={12} className="text-center mb-3 mt-3">
            <Button
                variant="outline-danger"
                onClick={() => resetMessages()}
                disabled={loading}
                className="ms-2 me-2"
            >
                Reset messages
            </Button>
        </Col>
      )}
    </Row>
  );;
}