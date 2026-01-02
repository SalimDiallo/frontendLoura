"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineXMark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineTrash,
  HiOutlineEllipsisVertical,
  HiOutlinePlusCircle,
  HiOutlineClipboardDocument,
  HiOutlineHandThumbUp,
  HiOutlineHandThumbDown,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn,
} from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { aiService, ToolCall, ToolResult } from "@/lib/services/ai";
import { useParams } from "next/navigation";
import { ChatDataDisplay } from "./chat-data-display";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "like" | "dislike" | null;
  toolResults?: ToolResult[];
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  orgSlug?: string;  // Slug de l'organisation pour les appels API
}

// Suggestions rapides
const quickSuggestions = [
  "Comment créer une facture ?",
  "Résumé des ventes du mois",
  "Ajouter un nouveau client",
  "Générer un rapport RH",
];

// Fonction pour formater le temps relatif
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
}

// Animation typing dots
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="size-2 rounded-full bg-primary/60 animate-[pulse_1s_ease-in-out_infinite]" />
      <span className="size-2 rounded-full bg-primary/60 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
      <span className="size-2 rounded-full bg-primary/60 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
    </div>
  );
}

export function ChatSidebar({ open, onClose, className, orgSlug }: ChatSidebarProps) {
  // Récupérer le slug depuis les params si non fourni en prop
  const params = useParams();
  const slug = orgSlug || (params?.slug as string) || 'default';
  
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "current",
      title: "Nouvelle conversation",
      lastMessage: "Bonjour ! Comment puis-je vous aider ?",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Bonjour ! 👋 Je suis votre assistant IA Loura. Comment puis-je vous aider aujourd'hui ?",
          timestamp: new Date(),
          feedback: null,
        },
      ],
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState("current");

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Scroll to bottom
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const updateMessages = useCallback((newMessages: Message[]) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: newMessages,
              lastMessage: newMessages[newMessages.length - 1]?.content || "",
              timestamp: new Date(),
            }
          : conv
      )
    );
  }, [activeConversationId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
      feedback: null,
    };

    const newMessages = [...messages, userMessage];
    updateMessages(newMessages);
    const currentMessage = message;
    setMessage("");
    setIsTyping(true);
    setStreamingContent("");

    // Créer un message placeholder pour le streaming
    const aiMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      feedback: null,
    };
    updateMessages([...newMessages, placeholderMessage]);

    try {
      let accumulatedContent = "";
      let currentToolResults: ToolResult[] = [];

      await aiService.chatStream(
        slug as string,
        {
          message: currentMessage,
          conversation_id: activeConversationId !== "current" ? activeConversationId : undefined,
          agent_mode: agentMode,
        },
        // onToken
        (token) => {
          accumulatedContent += token;
          setStreamingContent(accumulatedContent);
          // Mettre à jour le message en temps réel
          updateMessages([
            ...newMessages,
            { ...placeholderMessage, content: accumulatedContent, toolResults: currentToolResults },
          ]);
        },
        // onToolResults
        (toolCalls, toolResults) => {
          console.log("Tools executed:", toolCalls, toolResults);
          currentToolResults = toolResults;
          // Mettre à jour immédiatement avec les résultats des outils
          updateMessages([
            ...newMessages,
            { ...placeholderMessage, content: accumulatedContent || "Traitement des données...", toolResults: toolResults },
          ]);
        },
        // onClear
        () => {
          accumulatedContent = "";
          setStreamingContent("");
        },
        // onError
        (error) => {
          console.error("Streaming error:", error);
          updateMessages([
            ...newMessages,
            { ...placeholderMessage, content: `⚠️ Erreur: ${error}` },
          ]);
        },
        // onDone
        () => {
          setStreamingContent("");
          // S'assurer que les toolResults sont conservés à la fin
          if (currentToolResults.length > 0) {
            updateMessages([
              ...newMessages,
              { ...placeholderMessage, content: accumulatedContent, toolResults: currentToolResults },
            ]);
          }
        }
      );
    } catch (error) {
      console.error("Erreur chat IA:", error);
      const errorMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "⚠️ Désolé, une erreur s'est produite. Vérifiez que Ollama est en cours d'exécution.",
        timestamp: new Date(),
        feedback: null,
      };
      updateMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setTimeout(() => handleSubmit(), 100);
  };

  const handleFeedback = (messageId: string, feedback: "like" | "dislike") => {
    updateMessages(
      messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
          : msg
      )
    );
  };

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    updateMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Conversation effacée ! 🧹 Comment puis-je vous aider ?",
        timestamp: new Date(),
        feedback: null,
      },
    ]);
  };

  const startNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Nouvelle conversation",
      lastMessage: "Bonjour ! Comment puis-je vous aider ?",
      timestamp: new Date(),
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Bonjour ! 👋 Je suis prêt à vous aider. Que souhaitez-vous faire ?",
          timestamp: new Date(),
          feedback: null,
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setShowHistory(false);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed z-50 border-l bg-gradient-to-b from-background via-background to-muted/20 flex flex-col transition-all duration-300 ease-in-out overflow-hidden backdrop-blur-sm shadow-xl",
          isFullscreen 
            ? "inset-0 w-full h-full top-0" 
            : cn(
                "top-16 right-0 h-[calc(100vh-4rem)]",
                open ? "w-96" : "w-0"
              ),
          className
        )}
      >
        {/* Header avec effet glassmorphism */}
        <div className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
              <HiOutlineSparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold text-sm">Assistant IA</span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En ligne
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-primary/10"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <HiOutlineArrowsPointingIn className="size-4" />
                  ) : (
                    <HiOutlineArrowsPointingOut className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Réduire" : "Plein écran"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-primary/10"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <HiOutlineClock className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Historique</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-primary/10"
                  onClick={startNewConversation}
                >
                  <HiOutlinePlusCircle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Nouvelle conversation</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <HiOutlineEllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={clearChat}>
                  <HiOutlineTrash className="size-4 mr-2" />
                  Effacer la conversation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  Version beta • Loura AI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <HiOutlineXMark className="size-4" />
            </Button>
          </div>
        </div>

        {/* Historique des conversations (slide panel) */}
        <div
          className={cn(
            "border-b bg-muted/30 overflow-hidden transition-all duration-300 ease-in-out",
            showHistory ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-3 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Conversations récentes
            </p>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setShowHistory(false);
                  }}
                  className={cn(
                    "w-full text-left p-2 rounded-lg text-sm transition-colors",
                    conv.id === activeConversationId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage.substring(0, 40)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone principale */}
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages */}
          <div
            className="flex-1 px-4 overflow-y-auto"
            ref={scrollAreaRef}
          >
            <div className="py-4 space-y-4 pb-4">
              {/* Suggestions si peu de messages */}
              {messages.length <= 1 && (
                <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 border border-primary/20 hover:scale-105 active:scale-95"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 group animate-in fade-in slide-in-from-bottom-4 duration-300",
                    msg.role === "user" && "flex-row-reverse"
                  )}
                  style={{ animationDelay: index === messages.length - 1 ? "100ms" : "0ms" }}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform hover:scale-110",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
                        : "bg-gradient-to-br from-muted to-muted-foreground/20"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <HiOutlineSparkles className="size-4" />
                    ) : (
                      <HiOutlineChatBubbleLeftRight className="size-4" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className="flex-1 space-y-1 max-w-[85%]">
                    <div
                      className={cn(
                        "rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm transition-all duration-200",
                        msg.role === "assistant"
                          ? "bg-muted/80 rounded-tl-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-p:my-1 prose-headings:my-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>

                    {/* Actions et timestamp */}
                    <div
                      className={cn(
                        "flex items-center gap-2 px-1",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(msg.timestamp)}
                      </span>

                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                onClick={() => handleCopy(msg.content, msg.id)}
                              >
                                {copiedId === msg.id ? (
                                  <span className="text-emerald-500 text-[10px] animate-in zoom-in duration-200">
                                    ✓
                                  </span>
                                ) : (
                                  <HiOutlineClipboardDocument className="size-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copier</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "size-6",
                                  msg.feedback === "like" && "text-emerald-500"
                                )}
                                onClick={() => handleFeedback(msg.id, "like")}
                              >
                                <HiOutlineHandThumbUp className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Utile</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "size-6",
                                  msg.feedback === "dislike" && "text-destructive"
                                )}
                                onClick={() => handleFeedback(msg.id, "dislike")}
                              >
                                <HiOutlineHandThumbDown className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pas utile</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
                    <HiOutlineSparkles className="size-4" />
                  </div>
                  <div className="bg-muted/80 rounded-2xl rounded-tl-sm shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input zone avec effet premium */}
          <div className="border-t bg-background/80 backdrop-blur-md p-4 shrink-0">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Agent Mode Toggle */}
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg transition-all duration-300",
                agentMode 
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30" 
                  : "bg-muted/30"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all duration-300",
                    agentMode 
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {agentMode ? (
                      <HiOutlineBolt className="size-4" />
                    ) : (
                      <HiOutlineCpuChip className="size-4" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="agent-mode" 
                      className={cn(
                        "text-xs font-medium cursor-pointer transition-colors",
                        agentMode ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                      )}
                    >
                      Mode Agent
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      {agentMode ? "Actions autonomes activées" : "Assistance classique"}
                    </span>
                  </div>
                </div>
                <Switch
                  id="agent-mode"
                  checked={agentMode}
                  onCheckedChange={setAgentMode}
                  className={cn(
                    "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-600"
                  )}
                />
              </div>

              {/* Input area */}
              <div className="relative">
                <textarea
                  ref={inputRef}
                  placeholder={agentMode ? "Décrivez l'action à exécuter..." : "Posez votre question... (Entrée pour envoyer)"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className={cn(
                    "w-full resize-none rounded-xl border px-4 py-3 pr-12 text-sm",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:ring-2 transition-all duration-200",
                    "min-h-[44px] max-h-[120px]",
                    agentMode 
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 focus:ring-amber-500/20 focus:border-amber-500/50" 
                      : "bg-muted/50 focus:ring-primary/20 focus:border-primary/50"
                  )}
                  style={{
                    height: message.split("\n").length > 1 ? "auto" : "44px",
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || isTyping}
                    className={cn(
                      "size-8 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90",
                      message.trim()
                        ? agentMode 
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
                          : "bg-primary shadow-lg shadow-primary/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isTyping ? (
                      <HiOutlineArrowPath className="size-4 animate-spin" />
                    ) : agentMode ? (
                      <HiOutlineBolt className="size-4" />
                    ) : (
                      <HiOutlinePaperAirplane className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer info */}
              <p className={cn(
                "text-[10px] text-center transition-colors",
                agentMode ? "text-amber-600/60 dark:text-amber-400/60" : "text-muted-foreground/60"
              )}>
                {agentMode 
                  ? "⚡ Mode Agent : L'IA exécutera des actions automatiquement"
                  : "Loura AI peut faire des erreurs. Vérifiez les informations importantes."
                }
              </p>
            </form>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
