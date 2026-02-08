import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../services/chatService';

interface UseChatHistoryReturn {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Custom Hook สำหรับจัดการประวัติการสนทนา
 * รองรับการบันทึกใน localStorage
 */
export function useChatHistory(storageKey: string = 'chat_history'): UseChatHistoryReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // โหลดประวัติจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [storageKey]);

  // บันทึกประวัติลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages, storageKey]);

  // เพิ่มข้อความใหม่
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): Message => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // อัพเดทข้อความล่าสุด (สำหรับ streaming)
  const updateLastMessage = useCallback((content: string) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = {
        ...updated[lastIndex],
        content: content,
      };
      
      return updated;
    });
  }, []);

  // ลบข้อความทั้งหมด
  const clearMessages = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, [storageKey]);

  return {
    messages,
    addMessage,
    updateLastMessage,
    clearMessages,
    isLoading,
    setIsLoading,
  };
}