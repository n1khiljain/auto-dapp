'use client';

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Code2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeChanges?: {
    oldCode?: string;
    newCode?: string;
    applied?: boolean;
  };
}

interface ChatbotProps {
  contractAddress: string;
  contractABI: any[];
  currentCode?: string;
}

export function Chatbot({ contractAddress, contractABI, currentCode }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI coding assistant. I can help you modify the frontend code for your deployed contract at ${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}. What would you like to change?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    };
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 100);
  }, [messages, loading]);

  // Check if message is requesting code modification
  const isCodeModificationRequest = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const codeKeywords = [
      'change', 'modify', 'update', 'edit', 'add', 'remove', 'delete',
      'make it', 'change the', 'update the', 'edit the', 'fix', 'improve',
      'style', 'color', 'background', 'button', 'layout', 'design', 'ui', 'css',
      'component', 'function', 'feature'
    ];
    return codeKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      // Check if this is a code modification request
      if (isCodeModificationRequest(userInput)) {
        // Code modification request
        const response = await fetch(`${apiUrl}/modify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userInput,
            contractAddress,
            contractABI,
            currentCode: currentCode || "",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}: Failed to modify code`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to modify code");
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.explanation || "I've modified the code as requested.",
          timestamp: new Date(),
          codeChanges: {
            oldCode: data.oldCode,
            newCode: data.newCode,
            applied: false,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // General chat request
        const response = await fetch(`${apiUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userInput,
            contractAddress,
            contractABI,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}: Failed to get response`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to get response");
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: String(data.response || "I'm here to help!"),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      setError(err.message);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.codeChanges?.newCode) return;

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/apply-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: message.codeChanges.newCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to apply code");
      }

      // Update message to show it's applied
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, codeChanges: { ...m.codeChanges, applied: true } }
            : m
        )
      );

      // Reload page after a short delay to show the changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full h-[calc(100vh-2rem)] flex flex-col bg-slate-800 border-slate-700 overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-white flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          AI Code Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 gap-2 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 min-h-0" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.codeChanges && (
                    <div className="mt-3 space-y-2">
                      <Badge variant="outline" className="text-xs">
                        Code Changes Available
                      </Badge>
                      
                      {message.codeChanges.newCode && (
                        <div className="mt-2">
                          <div className="bg-slate-900 rounded p-2 max-h-64 overflow-auto">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                              {message.codeChanges.newCode.length > 500
                                ? message.codeChanges.newCode.substring(0, 500) + "..."
                                : message.codeChanges.newCode}
                            </pre>
                          </div>
                          
                          {!message.codeChanges.applied && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyChanges(message.id)}
                              disabled={loading}
                              className="mt-2 w-full"
                              variant="default"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Apply Changes
                                </>
                              )}
                            </Button>
                          )}
                          
                          {message.codeChanges.applied && (
                            <div className="mt-2 flex items-center gap-2 text-green-400 text-xs">
                              <CheckCircle2 className="h-4 w-4" />
                              Changes applied! Reloading...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                  <span className="text-sm text-slate-300">Modifying code...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {error && (
          <Alert variant="destructive" className="mx-4 flex-shrink-0">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="px-4 pb-4 pt-2 border-t border-slate-700 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the changes you want to make..."
              className="flex-1 bg-slate-700 border-slate-600 text-white resize-none"
              rows={2}
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="self-end"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

