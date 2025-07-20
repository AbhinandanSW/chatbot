import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, User, Code2, Copy } from "lucide-react";
import type { CodeArtifact } from "./CodeArtifact";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  className?: string;
  onShowArtifact?: (artifact: CodeArtifact) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  isStreaming = false,
  className,
  onShowArtifact,
}) => {
  const isUser = role === "user";

  // Parse code blocks from content
  const parseCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{
      type: "text" | "code";
      content: string;
      language?: string;
    }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index);
        if (textContent.trim()) {
          parts.push({ type: "text", content: textContent });
        }
      }

      // Add code block
      const language = match[1] || "text";
      const code = match[2].trim();
      parts.push({ type: "code", content: code, language });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const textContent = text.slice(lastIndex);
      if (textContent.trim()) {
        parts.push({ type: "text", content: textContent });
      }
    }

    return parts.length > 0 ? parts : [{ type: "text", content: text }];
  };

  const handleShowCode = (code: string, language: string) => {
    if (onShowArtifact) {
      const artifact: CodeArtifact = {
        id: Date.now().toString(),
        language,
        content: code,
        title: `${language} code`,
      };
      onShowArtifact(artifact);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const contentParts = parseCodeBlocks(content);

  return (
    <div
      className={cn(
        "group relative flex gap-4 px-4 py-6 transition-colors",
        isUser ? "bg-transparent" : "bg-muted/30",
        className
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "border",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-sm font-medium">{isUser ? "You" : "Agent"}</div>

        <div
          className={cn(
            "prose prose-sm max-w-none break-words",
            "prose-p:leading-relaxed prose-pre:p-0",
            "text-foreground",
            isStreaming && "message-stream"
          )}
        >
          {contentParts.map((part, index) => {
            if (part.type === "code") {
              return (
                <div key={index} className="my-4 relative group">
                  <div className="flex items-center justify-between bg-muted p-2 rounded-t-lg border">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {part.language}
                    </span>
                    {part.language.toLowerCase() === "bash" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(part.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleShowCode(part.content, part.language || "text")
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Code2 className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    )}
                  </div>
                  <pre className="bg-muted/50 p-4 rounded-b-lg border border-t-0 overflow-x-auto">
                    <code className="text-sm font-mono text-foreground whitespace-pre">
                      {part.language.toLowerCase() === "bash"
                        ? part.content
                        : "Click on open to see the artifact"}
                    </code>
                  </pre>
                </div>
              );
            } else {
              return (
                <div key={index}>
                  {part.content.split("\n").map((line, lineIndex) => (
                    <p
                      key={lineIndex}
                      className={cn(
                        "mb-2 last:mb-0",
                        line.trim() === "" && "mb-4"
                      )}
                    >
                      {line || "\u00A0"}
                    </p>
                  ))}
                </div>
              );
            }
          })}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>
      </div>
    </div>
  );
};
