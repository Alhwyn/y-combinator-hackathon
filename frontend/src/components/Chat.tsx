import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, RotateCcw, Bot, User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import config from "../../config";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  initialPrompt: string;
  onRetry: () => void;
  agentId?: string;
  testId?: string;
}

export const Chat = ({ initialPrompt, onRetry, agentId, testId }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'user',
      content: initialPrompt,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'assistant',
      content: "I'll analyze your repository and run comprehensive tests. The AI agent is now starting up and will begin autonomous testing shortly.",
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  // Expose addMessage via window for external updates from WebSocket
  useEffect(() => {
    (window as any).addChatMessage = addMessage;
    return () => {
      delete (window as any).addChatMessage;
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageContent = newMessage;
    setNewMessage('');
    setIsLoading(true);
    
    try {
      // Send message to AI agent API
      const response = await fetch(`${config.api.aiAgent.nextAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId || 'default',
          testId: testId,
          userInstruction: messageContent,
          currentState: {
            messages: messages.map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message to agent');
      }

      const data = await response.json();
      
      // Add agent's response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I understand. I'll incorporate that into my testing approach.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Fallback response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I understand. Let me continue with the testing based on your feedback.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Retry Button */}
      <Button onClick={onRetry} className="w-full gap-2" variant="outline">
        <RotateCcw className="w-4 h-4" />
        Retry Testing
      </Button>

      {/* Chat Messages */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Chat with Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6 max-h-80 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'system'
                      ? 'bg-muted/50 text-foreground/70 italic'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted text-foreground rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask the agent to test more things..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 min-h-[60px] resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className={`px-3 transition-colors ${
                newMessage.trim() && !isLoading
                  ? 'bg-white hover:bg-gray-100 text-black'
                  : 'bg-secondary hover:bg-accent disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className={`w-4 h-4 ${
                  newMessage.trim() ? 'text-black' : 'text-muted-foreground'
                }`} />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
