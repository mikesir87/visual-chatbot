import { useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import TextareaAutoresize from "react-textarea-autosize";
import { useBackend } from "../../BackendProvider";

export const MessageInput = ({ 
  showReset = true, 
  onMessageSubmission = () => {},
  onCancel = () => {} 
}) => {
  const { addMessage, resetMessages, loading } = useBackend();
  const [input, setInput] = useState("");
  const submitButtonRef = useRef();

  return (
    <Form onSubmit={(e) => {
      e.preventDefault();
      if (input) {
        addMessage(input);
        setInput("");
        onMessageSubmission();
      }
    }}>
      <InputGroup>
        <Form.Control 
          as={TextareaAutoresize}
          maxRows={3}
          minRows={1}
          value={input} 
          autoFocus
          placeholder="Type your user message content..."
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => {
            if (!e.shiftKey && e.key === 'Enter') {
              e.preventDefault();
              submitButtonRef.current.click();
            }
          }}
        />
        <Button type="submit" disabled={!input || loading} value="Submit" ref={submitButtonRef}>
          { loading ? (
            <Spinner animation="border" size="sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          ) : "Add user message" }
        </Button>
        <Button variant="secondary" onClick={() => onCancel()}>
          Cancel
        </Button>
      </InputGroup>
    </Form>
  )
}