const { VITE_APP_API_URL } = import.meta.env;

const API_BASE = VITE_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const chatApi = {
  async getThreads() {
    const response = await fetch(`${API_BASE}/chat/threads`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch threads');
    }
    
    return response.json();
  },

  async getThreadHistory(threadId: string, limit = 50) {
    const response = await fetch(`${API_BASE}/chat/history/${threadId}?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch thread history');
    }
    
    return response.json();
  },

  async deleteThread(threadId: string) {
    const response = await fetch(`${API_BASE}/chat/threads/${threadId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }
    
    return response.json();
  },

  async getChatStatus() {
    const response = await fetch(`${API_BASE}/chat/status`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get chat status');
    }
    
    return response.json();
  }
};