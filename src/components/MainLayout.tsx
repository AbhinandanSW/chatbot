import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ChatInterface } from './ChatInterface';
// import { Button } from '@/components/ui/button';
// import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  thread_id:string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

export const MainLayout: React.FC = () => {
  const [chats, setChats] = useState<ChatItem[]>();
  const [currentChatId, setCurrentChatId] = useState<string>(crypto.randomUUID() || '1');
  const [currentArtifact, setCurrentArtifact] = useState<CodeArtifact | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);

  const currentChat = chats?.find(chat => chat.id === currentChatId);

  const handleNewChat = () => {
    const newChat: ChatItem = {
      id: Date.now().toString(),
      thread_id:crypto.randomUUID(),
      title: 'New conversation',
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    console.log(chatId)
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
  };

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? {
          ...chat,
          messages: [...chat.messages, userMessage],
          title: chat.messages.length === 0 ? message.slice(0, 50) + (message.length > 50 ? '...' : '') : chat.title,
          updatedAt: new Date().toISOString(),
        }
        : chat
    ));
  };

  const handleMessageComplete = (assistantMessage: Message) => {
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? {
          ...chat,
          messages: [...chat.messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        }
        : chat
    ));
  };

  const handle_fetch_chats = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response: any = await fetch(`${VITE_APP_API_URL}/chat/threads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json()

    setChats(data?.threads)
    handleNewChat()
  }
  const handle_fetch_chat_meesages = async (thread_id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response: any = await fetch(`${VITE_APP_API_URL}/chat/history/${thread_id}?limit=10000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json()

    setCurrentChatMessages(data?.messages)
  }
  useEffect(() => {
    handle_fetch_chats()
  }, [])
  useEffect(() => {
    handle_fetch_chat_meesages(currentChatId)
  }, [currentChatId])
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
            {/* <SidebarTrigger className="flex-shrink-0" /> */}
            <div className="text-sm font-medium text-center flex-1">
              {currentChat?.title || 'New conversation'}
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>

          <div className="flex-1 overflow-hidden">
            <ChatInterface
              chatId={currentChatId}
              messages={currentChatMessages || currentChat?.messages || []}
              onSendMessage={handleSendMessage}
              onMessageComplete={handleMessageComplete}
              currentArtifact={currentArtifact}
              onShowArtifact={setCurrentArtifact}
              onCloseArtifact={() => setCurrentArtifact(null)}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};