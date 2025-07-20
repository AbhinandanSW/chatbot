import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { CodeArtifact, type CodeArtifact as CodeArtifactType } from './CodeArtifact';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StreamResponse {
  type: 'delta' | 'completion';
  content: string;
  thread_id: string;
  session_id: string;
  has_artifact: boolean;
  error_message: string | null;
}

interface ChatInterfaceProps {
  chatId?: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onMessageComplete?: (message: Message) => void;
  className?: string;
  currentArtifact?: CodeArtifactType | null;
  onShowArtifact?: (artifact: CodeArtifactType) => void;
  onCloseArtifact?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatId,
  messages,
  onSendMessage,
  onMessageComplete,
  className,
  currentArtifact,
  onShowArtifact,
  onCloseArtifact,
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const streamApiResponse = async (userMessage: string) => {
    setIsStreaming(true);
    setStreamingMessage('');
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://0.0.0.0:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: userMessage,
          thread_id: chatId || '1',
          session_id: 'session_1'
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done || signal.aborted) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr) as StreamResponse;
              
              if (data.error_message) {
                throw new Error(data.error_message);
              }
              
              if (data.type === 'delta' && data.content) {
                accumulatedContent += data.content;
                setStreamingMessage(accumulatedContent);
              } else if (data.type === 'completion') {
                // Stream completed
                const finalMessage: Message = {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: new Date(),
                };
                
                onMessageComplete?.(finalMessage);
                break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Streaming error:', error);
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (message: string) => {
    // Add user message immediately
    onSendMessage(message);
    
    // Start streaming response
    await streamApiResponse(message);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const allMessages = [...messages];
  if (isStreaming && streamingMessage) {
    allMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamingMessage,
      timestamp: new Date(),
    });
  }

  return (
    <div className={cn("flex h-full", className)}>
      {/* Main Chat Area */}
      <div className={cn(
        "flex flex-col transition-all duration-300",
        currentArtifact ? "w-1/2" : "w-full"
      )}>
        <ScrollArea ref={scrollRef} className="flex-1 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {allMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                    <span className="text-2xl font-bold text-primary-foreground">C</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                    <p className="text-muted-foreground">
                      Start a conversation by typing a message below.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {allMessages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isStreaming={message.id === 'streaming'}
                    onShowArtifact={onShowArtifact}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          placeholder="Send a message..."
        />
      </div>

      {/* Code Artifact Sidebar */}
      {currentArtifact && (
        <div className="w-1/2 h-full">
          <CodeArtifact
            artifact={currentArtifact}
            onClose={onCloseArtifact || (() => {})}
          />
        </div>
      )}
    </div>
  );
};