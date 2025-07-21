import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, User, Bot, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeArtifact } from './CodeArtifact';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  onShowArtifact?: (artifact: CodeArtifact) => void;
  className?: string;
}

// Custom components for ReactMarkdown
const MarkdownComponents = {
  // Code block component with syntax highlighting
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    if (!inline && language) {
      return (
        <div className="relative group">
          <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-t-md border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {language}
            </span>
            <CopyButton text={code} />
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    // Inline code
    return (
      <code
        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Custom pre component to prevent double wrapping
  pre({ children }: any) {
    return <>{children}</>;
  },

  // Enhanced blockquote
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r-md italic">
        {children}
      </blockquote>
    );
  },

  // Enhanced table components
  table({ children }: any) {
    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border rounded-md">
          {children}
        </table>
      </div>
    );
  },
  
  thead({ children }: any) {
    return <thead className="bg-muted">{children}</thead>;
  },
  
  th({ children }: any) {
    return (
      <th className="border border-border px-3 py-2 text-left font-medium">
        {children}
      </th>
    );
  },
  
  td({ children }: any) {
    return (
      <td className="border border-border px-3 py-2">
        {children}
      </td>
    );
  },

  // Enhanced list components
  ul({ children }: any) {
    return (
      <ul className="list-disc list-inside space-y-1 my-4 ml-4">
        {children}
      </ul>
    );
  },
  
  ol({ children }: any) {
    return (
      <ol className="list-decimal list-inside space-y-1 my-4 ml-4">
        {children}
      </ol>
    );
  },
  
  li({ children }: any) {
    return <li className="leading-relaxed">{children}</li>;
  },

  // Enhanced headings
  h1({ children }: any) {
    return (
      <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-border">
        {children}
      </h1>
    );
  },
  
  h2({ children }: any) {
    return (
      <h2 className="text-xl font-semibold mt-5 mb-3">
        {children}
      </h2>
    );
  },
  
  h3({ children }: any) {
    return (
      <h3 className="text-lg font-medium mt-4 mb-2">
        {children}
      </h3>
    );
  },

  // Enhanced paragraph spacing
  p({ children }: any) {
    return <p className="leading-relaxed mb-4 last:mb-0">{children}</p>;
  },

  // Enhanced links
  a({ href, children }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    );
  },

  // Horizontal rule
  hr() {
    return <hr className="my-6 border-border" />;
  },

  // Enhanced strong and emphasis
  strong({ children }: any) {
    return <strong className="font-semibold text-foreground">{children}</strong>;
  },
  
  em({ children }: any) {
    return <em className="italic text-muted-foreground">{children}</em>;
  }
};

// Copy button component
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
};

// Message copy button
const MessageCopyButton: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Message copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
};

// Streaming cursor component
const StreamingCursor: React.FC = () => {
  return (
    <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse rounded-sm" />
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  isStreaming = false,
  onShowArtifact,
  className,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  const isUser = role === 'user';

  // Extract potential artifacts from content
  const extractArtifacts = (text: string) => {
    // Simple regex to detect code blocks that could be artifacts
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g;
    const matches = Array.from(text.matchAll(codeBlockRegex));
    
    return matches.map((match, index) => ({
      id: `artifact-${Date.now()}-${index}`,
      language: match[1],
      content: match[2],
      title: `${match[1].toUpperCase()} Code`
    }));
  };

  const handleShowArtifact = (language: string, code: string) => {
    if (onShowArtifact) {
      const artifact: CodeArtifact = {
        id: `artifact-${Date.now()}`,
        language,
        content: code,
        title: `${language.toUpperCase()} Code`
      };
      onShowArtifact(artifact);
    }
  };

  // Custom code component that can show artifacts
  const CustomCode = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    if (!inline && language && code.length > 50) {
      return (
        <div className="relative group">
          <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-t-md border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {language}
            </span>
            <div className="flex items-center gap-1">
              {onShowArtifact && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleShowArtifact(language, code)}
                >
                  <Code2 className="h-3 w-3" />
                </Button>
              )}
              <CopyButton text={code} />
            </div>
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    return MarkdownComponents.code({ node, inline, className, children, ...props });
  };

  const components = {
    ...MarkdownComponents,
    code: CustomCode,
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "group relative px-4 py-6 hover:bg-muted/30 transition-colors",
        className
      )}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted border border-border"
            )}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : 'Assistant'}
            </span>
            {!isUser && (
              <MessageCopyButton content={content} />
            )}
          </div>

          <div className="prose prose-sm max-w-none dark:prose-invert">
            {isUser ? (
              // User messages - simple text rendering
              <div className="whitespace-pre-wrap break-words">
                {content}
              </div>
            ) : (
              // Assistant messages - full markdown rendering
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={components}
                >
                  {content}
                </ReactMarkdown>
                {isStreaming && <StreamingCursor />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};