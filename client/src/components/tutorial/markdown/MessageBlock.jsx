import { useBackend } from "../../../BackendProvider";
import { SyntaxHighlighterDisplay } from "./SyntaxHighlighterDisplay";
import Button from "react-bootstrap/Button";

export function MessageBlock({ children, language = "plaintext" }) {
  const { addMessage } = useBackend();

  return (
    <div className="message-block mb-3">
      <pre>
        <SyntaxHighlighterDisplay
          language={language}
          code={children}
        />
      </pre>
      <Button
        size="sm"
        variant="primary"
        onClick={() => addMessage(String(children).replace(/\n$/, ''))}
      >
        Add user message
      </Button>
    </div>
  );
}