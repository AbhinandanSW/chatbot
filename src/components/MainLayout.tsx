import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ChatInterface } from './ChatInterface';
import type { CodeArtifact } from './CodeArtifact';

const { VITE_APP_API_URL } = import.meta.env;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatItem {
  id: string;
  thread_id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

export const MainLayout: React.FC = () => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [currentArtifact, setCurrentArtifact] = useState<CodeArtifact | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const currentChat = chats?.find(chat => chat.thread_id === currentChatId);

  const handleNewChat = () => {
    const newThreadId = crypto.randomUUID();
    const newChat: ChatItem = {
      id: Date.now().toString(),
      thread_id: newThreadId,
      title: 'New conversation',
      updatedAt: new Date().toISOString(),
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newThreadId);
    setCurrentChatMessages([]); // Clear messages for new chat
  };

  const handleSelectChat = (threadId: string) => {
    console.log('Selecting chat:', threadId);
    setCurrentChatId(threadId);
  };

  const handleDeleteChat = (threadId: string) => {
    setChats(prev => prev.filter(chat => chat.thread_id !== threadId));
    if (currentChatId === threadId) {
      const remainingChats = chats?.filter(chat => chat.thread_id !== threadId);
      if (remainingChats && remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].thread_id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameChat = (threadId: string, newTitle: string) => {
    setChats(prev => prev.map(chat =>
      chat.thread_id === threadId ? { ...chat, title: newTitle } : chat
    ));
  };

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Add message to current chat messages immediately
    setCurrentChatMessages(prev => [...prev, userMessage]);

    // Update chats state
    setChats(prev => prev.map((chat: ChatItem) =>
      chat.thread_id === currentChatId
        ? {
          ...chat,
          messages: [...chat.messages, userMessage],
          title: chat?.messages?.length === 0 ? 
            (message?.slice(0, 50) + (message.length > 50 ? '...' : '')) : 
            chat?.title,
          updatedAt: new Date().toISOString(),
        }
        : chat
    ));
  };

  const handleMessageComplete = (assistantMessage: Message) => {
    // Add assistant message to current chat messages
    setCurrentChatMessages(prev => [...prev, assistantMessage]);

    // Update chats state
    setChats(prev => prev.map(chat =>
      chat.thread_id === currentChatId
        ? {
          ...chat,
          messages: [...chat.messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        }
        : chat
    ));
  };

  const handleStreamingUpdate = (content: string) => {
    // Update the streaming message in currentChatMessages
    // This will be handled in ChatInterface component
  };

  const handleFetchChats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${VITE_APP_API_URL}/chat/threads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data?.threads && Array.isArray(data.threads)) {
        setChats(data.threads);
        
        // If no current chat selected and we have chats, select the first one
        if (!currentChatId && data.threads.length > 0) {
          setCurrentChatId(data.threads[0].thread_id);
        }
      }
      
      // If no chats exist, create a new one
      if (!data?.threads || data.threads.length === 0) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      handleNewChat(); // Fallback to creating a new chat
    }
  };

  const handleFetchChatMessages = async (thread_id: string) => {
    if (!thread_id) return;
    
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${VITE_APP_API_URL}/chat/history/${thread_id}?limit=10000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data?.messages && Array.isArray(data.messages)) {
        // Convert message format if needed and ensure proper timestamp format
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }));
        
        setCurrentChatMessages(formattedMessages);
      } else {
        setCurrentChatMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      setCurrentChatMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleFetchChats();
  }, []);

  // Load messages when current chat changes
  useEffect(() => {
    if (currentChatId) {
      handleFetchChatMessages(currentChatId);
    }
  }, [currentChatId]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          currentChatId={currentChatId}
          chats={chats}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />

        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4">
            <div className="text-sm font-medium text-center flex-1">
              {currentChat?.title || 'New conversation'}
            </div>
            <div className="w-10" />
          </header>

          <div className="flex-1 overflow-hidden">
            <ChatInterface
              chatId={currentChatId}
              messages={currentChatMessages}
              onSendMessage={handleSendMessage}
              onMessageComplete={handleMessageComplete}
              onStreamingUpdate={handleStreamingUpdate}
              currentArtifact={currentArtifact}
              onShowArtifact={setCurrentArtifact}
              onCloseArtifact={() => setCurrentArtifact(null)}
              isLoadingMessages={isLoadingMessages}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};