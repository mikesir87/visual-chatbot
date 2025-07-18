import { useEffect, useMemo, useRef, useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ReactMarkdown from 'react-markdown'

export const ChatMessageDisplay = ({ message, onSelect }) => {
  const ref = useRef();

  const isWrittenMessage = message.role === "user" || (message.role === "assistant" && !message.tool_calls);
  const isFromAI = message.role === "assistant";
  const isAiMessage = message.role !== "user" && message.role !== "tool" && message.role !== "system";

  const messageClasses = useMemo(() => {
    const classes = ["messageCard", "p-3", "rounded"];
    if (isWrittenMessage) {
      if (isFromAI)
        classes.push("bg-primary-subtle");
      else 
        classes.push("bg-primary", "text-white");
    } else {
      classes.push("bg-secondary-subtle");
    }
    return classes;
  }, [isWrittenMessage, isFromAI]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  return (
    <Row
      className={
        `message mb-3 ${isAiMessage ? "" : "justify-content-end "}`
      }
    >
      <Col
        ref={ref}
        sm={8}
        className={"text-wrap text-break " + messageClasses.join(" ")}
        onClick={onSelect}
      >

        { message.role === "system" && (
          <div>
            <strong>System prompt</strong>
          </div>
        )}

        { message.tool_calls && (
          <>
            <div>
              <strong>Tool execution request</strong>
            </div>
            <ul>
              { message.tool_calls.map((toolCall, index) => (
                <li key={index}>
                  {toolCall.function.name}
                  <ul>
                    <li>Call ID: { toolCall.id }</li>
                    <li>Arguments: { toolCall.function.arguments }</li>
                  </ul>
                </li>
              ))}
            </ul>
          </>
        )}

        { message.role === "tool" && (
          <div>
            <strong>Tool execution result</strong>
            &nbsp; <em><small>{ message.tool_call_id }</small></em>
          </div>
        )}

        { message.content && (
          <ReactMarkdown
            components={{
              p({ children, ...props }) {
                return <p style={{ whiteSpace: "pre-wrap"}}>{ children }</p>
              }
            }}
          >
            { 
              message.content.length > 500 && message.role === "tool" ? 
                `${message.content.substring(0, 500)}...` : 
                message.content
            }
          </ReactMarkdown>
        )}
        
      </Col>
    </Row>
  );
}