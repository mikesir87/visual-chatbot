import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { useBackend } from "../../BackendProvider";
import { useCallback, useEffect, useState } from "react";
import { SettingOptions } from "./SettingOptionCard";

export const SystemPromptModal = ({ show, onClose }) => {
  const { config, updateConfiguration, resetMessages, addMessage, sendMessages, messages, personas, invokeTools } = useBackend();
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [replayMessages, setReplayMessages] = useState(false);
  const [savedMessages, setSavedMessages] = useState(messages);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!hasSaved)
      setSavedMessages(messages);
  }, [messages, hasSaved])

  const handleClose = useCallback(() => {
    onClose();
    setHasSaved(false);
  }, [onClose]);

  const onSubmit = async (e) => {
    e.preventDefault();
    await updateConfiguration({ systemPrompt, });
    setHasSaved(true);
    
    await resetMessages();
    
    onClose();
    if (replayMessages) {
      for (const message of savedMessages.filter(m => m.role === "user")) {
        await addMessage(message.content);
        await sendMessages();
        await invokeTools();
      }
    }

    setHasSaved(false);
  }

  return (
    <Modal size="xl" show={show} onHide={handleClose}>
      <Modal.Header>
        <Modal.Title>System Prompt Configuration</Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="persona-picker">
            <Form.Label>Quick persona chooser</Form.Label>
            <SettingOptions
              options={personas}
              labelFn={(p) => p.name }
              selectedOption={personas.find(p => p.prompt == systemPrompt) || personas.find(p => p.name === "Custom")}
              onSelect={(p) => setSystemPrompt(p.prompt)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="systemPrompt">
            <Form.Label>System Prompt</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={10}
              placeholder="What system prompt do you want? How do you want the LLM to operate? What rules should it follow?" 
              value={systemPrompt} 
              onChange={e => setSystemPrompt(e.target.value)} 
            />
          </Form.Group>

          <Form.Check
            type="switch"
            label="Replay user messages on new system prompt"
            id="replay-messages"
            checked={replayMessages}
            onChange={(e) => setReplayMessages(e.target.checked)}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </Modal.Footer>

      </Form>
    </Modal>
  );
}