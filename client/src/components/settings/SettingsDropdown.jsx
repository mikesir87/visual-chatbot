import { useEffect, useState } from 'react';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { SystemPromptModal } from './SystemPromptModal';
import { LlmConfigurationModal } from './LlmConfigurationModal';
import { AiToolGenerationModal } from './AiToolGenerationModal';
import { useBackend } from '../../BackendProvider';

export const SettingsDropdown = () => {
  const { config } = useBackend();

  const [showLlmConfigModal, setShowLlmConfigModal] = useState(false);
  const [showSystemPromptModal, setSystemPromptModal] = useState(false);
  const [showAiToolGenerationModal, setShowAiToolGenerationModal] = useState(false);

  useEffect(() => {
    setShowLlmConfigModal(!config.configured);
  }, [config, setShowLlmConfigModal]);

  return (
    <>
      <NavDropdown title="Settings" id="settings-dropdown" align="end">
        <NavDropdown.Item onClick={() => setShowLlmConfigModal(true)} href="#">LLM backend</NavDropdown.Item>
        <NavDropdown.Item onClick={() => setSystemPromptModal(true)} href="#">System prompt</NavDropdown.Item>
        <NavDropdown.Item onClick={() => setShowAiToolGenerationModal(true)} href="#">AI tool generation</NavDropdown.Item>
      </NavDropdown>

      <LlmConfigurationModal 
        show={showLlmConfigModal} 
        onClose={() => setShowLlmConfigModal(false)} 
      />
      
      <SystemPromptModal 
        show={showSystemPromptModal} 
        onClose={() => setSystemPromptModal(false)} 
      />

      <AiToolGenerationModal
        show={showAiToolGenerationModal}
        onClose={() => setShowAiToolGenerationModal(false)}
      />
    </>
  );
}