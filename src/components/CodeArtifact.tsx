import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, X, Code2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub Flavored Markdown support
import DOMPurify from 'dompurify'; // To sanitize HTML content for security

export interface CodeArtifact {
  id: string;
  language: string;
  content: string;
  title?: string;
}

interface CodeArtifactProps {
  artifact: CodeArtifact | null;
  onClose: () => void;
  className?: string;
}

export const CodeArtifact: React.FC<CodeArtifactProps> = ({
  artifact,
  onClose,
  className,
}) => {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const [streamContent, setStreamContent] = useState<CodeArtifact | null>(artifact);

  useEffect(() => {
    // Simulate stream data arriving every 2 seconds.
    const streamSimulator = setInterval(() => {
      // Simulate new content coming in. In your case, this would come from a WebSocket, SSE, or other stream.
      const newContent = {
        id: 'new-id',
        language: 'markdown',
        content: 'This is **Markdown** content that is streamed!',
        title: 'Streaming Content',
      };
      setStreamContent(newContent); // Update the content when new data arrives
    }, 2000);

    return () => clearInterval(streamSimulator); // Cleanup on component unmount
  }, []);

  if (!streamContent) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(streamContent.content);
      toast.success('Code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const isPreviewable =
    streamContent.language === 'html' ||
    streamContent.language === 'javascript' ||
    streamContent.language === 'css' ||
    streamContent.language === 'markdown';

  const getLanguageIcon = () => {
    switch (streamContent.language) {
      case 'html':
        return <FileText className="h-4 w-4" />;
      case 'javascript':
      case 'js':
        return <Code2 className="h-4 w-4" />;
      case 'markdown':
        return <FileText className="h-4 w-4" />;
      default:
        return <Code2 className="h-4 w-4" />;
    }
  };

  const renderPreview = () => {
    if (streamContent.language === 'html') {
      // Sanitize HTML content to avoid injection risks
      const cleanHTML = DOMPurify.sanitize(streamContent.content);
      return (
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: cleanHTML }}
        />
      );
    } else if (streamContent.language === 'markdown') {
      return (
        <div className="w-full h-full p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {streamContent.content}
          </ReactMarkdown>
        </div>
      );
    } else if (streamContent.language === 'javascript' || streamContent.language === 'css') {
      return (
        <div className="w-full h-full p-4">
          <pre className="text-sm font-mono">
            <code className="text-foreground">{streamContent.content}</code>
          </pre>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Preview not available for {streamContent.language}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-l border-border fixed top-0 right-0 w-[700px] z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {getLanguageIcon()}
          <div>
            <h3 className="font-medium text-sm">
              {streamContent.title || `${streamContent.language} code`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {streamContent.language.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isPreviewable && (
            <>
              <Button
                variant={view === 'code' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('code')}
              >
                <Code2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-h-[700px] overflow-y-auto">
        {view === 'code' ? (
          <ScrollArea className="h-full">
            <pre className="p-4 text-sm font-mono">
              <code
                className={cn(
                  'block whitespace-pre-wrap break-words',
                  'text-foreground'
                )}
              >
                {streamContent.content}
              </code>
            </pre>
          </ScrollArea>
        ) : (
          <div className="h-full">{renderPreview()}</div>
        )}
      </div>
    </div>
  );
};
