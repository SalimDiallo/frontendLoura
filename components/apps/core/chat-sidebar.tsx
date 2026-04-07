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
  HiOutlineBolt,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn,
  HiOutlineCheck,
  HiOutlineWrenchScrewdriver,
  HiOutlineShieldCheck,
  HiOutlineCommandLine,
} from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
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
import { aiService, ToolCall, ToolResult, ToolExecutingEvent, ConfirmationRequiredEvent } from "@/lib/services/ai";
import { useParams } from "next/navigation";
import { ChatDataDisplay } from "./chat-data-display";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "like" | "dislike" | null;
  toolResults?: ToolResult[];
  executingTools?: ToolExecutingEvent[];
  isStreaming?: boolean;
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
  orgSlug?: string;
}

// Suggestions rapides
const quickSuggestions = [
  { text: "Statistiques RH", icon: "chart" },
  { text: "Résumé des ventes du mois", icon: "sales" },
  { text: "Employés par département", icon: "team" },
  { text: "Clients avec créances", icon: "alert" },
];

// Fonction pour formater le temps relatif
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "maintenant";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}j`;
}

// Streaming cursor animation
function StreamingCursor() {
  return (
    <span className="inline-block w-[2px] h-[1.1em] bg-indigo-500 dark:bg-indigo-400 animate-[blink_1s_ease-in-out_infinite] align-text-bottom ml-0.5" />
  );
}

// Tool execution indicator
function ToolExecutionBadge({ toolName }: { toolName: string }) {
  const friendlyNames: Record<string, string> = {
    liste_employes: "Employés",
    statistiques_rh: "Stats RH",
    liste_departements: "Départements",
    conges_en_attente: "Congés",
    creer_employe: "Création employé",
    creer_demande_conge: "Demande congé",
    liste_produits: "Produits",
    statistiques_ventes: "Stats ventes",
    ventes_recentes: "Ventes",
    liste_clients: "Clients",
    clients_avec_dettes: "Créances",
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
      <HiOutlineCommandLine className="size-3 animate-pulse" />
      <span>{friendlyNames[toolName] || toolName}</span>
    </div>
  );
}

// Typing/thinking indicator
function ThinkingIndicator({ executingTools }: { executingTools?: ToolExecutingEvent[] }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {executingTools && executingTools.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <HiOutlineWrenchScrewdriver className="size-3.5 animate-spin" />
            <span>Exécution des outils</span>
          </div>
          {executingTools.map((tool, idx) => (
            <ToolExecutionBadge key={idx} toolName={tool.tool_name} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-[pulse_1.4s_ease-in-out_infinite]" />
            <span className="size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
            <span className="size-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Réflexion en cours...</span>
        </div>
      )}
    </div>
  );
}

// Tool confirmation card
function ToolConfirmationCard({
  event,
  onConfirm,
  onReject,
}: {
  event: ConfirmationRequiredEvent;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="mt-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
          <HiOutlineShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Confirmation requise
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {event.description}
          </p>
          {event.tool_args && Object.keys(event.tool_args).length > 0 && (
            <div className="mt-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-2 text-xs font-mono text-amber-800 dark:text-amber-200">
              {JSON.stringify(event.tool_args, null, 2)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm"
        >
          <HiOutlineCheck className="size-4 mr-1.5" />
          Confirmer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          className="flex-1 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
        >
          <HiOutlineXMark className="size-4 mr-1.5" />
          Annuler
        </Button>
      </div>
    </div>
  );
}

export function ChatSidebar({ open, onClose, className, orgSlug }: ChatSidebarProps) {
  const params = useParams();
  const slug = orgSlug || (params?.slug as string) || 'default';
  
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [executingTools, setExecutingTools] = useState<ToolExecutingEvent[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequiredEvent | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "current",
      title: "Nouvelle conversation",
      lastMessage: "Comment puis-je vous aider ?",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Bonjour ! Je suis votre assistant IA Loura. Comment puis-je vous aider aujourd'hui ?",
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
  }, [messages, isTyping, streamingContent]);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

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
    setExecutingTools([]);
    setPendingConfirmation(null);

    const aiMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      feedback: null,
      isStreaming: true,
    };
    updateMessages([...newMessages, placeholderMessage]);

    try {
      let accumulatedContent = "";
      let currentToolResults: ToolResult[] = [];
      let currentExecutingTools: ToolExecutingEvent[] = [];

      await aiService.chatStream(
        slug as string,
        {
          message: currentMessage,
          conversation_id: (activeConversationId !== "current" && !activeConversationId.startsWith("new-"))
            ? activeConversationId
            : undefined,
          agent_mode: true,
        },
        // onToken
        (token) => {
          accumulatedContent += token;
          setStreamingContent(accumulatedContent);
        },
        // onToolResults
        (toolCalls, toolResults) => {
          currentToolResults = toolResults;
          currentExecutingTools = [];
          setExecutingTools([]);
          updateMessages([
            ...newMessages,
            { ...placeholderMessage, content: accumulatedContent || "Analyse des données...", toolResults: toolResults, isStreaming: true },
          ]);
        },
        // onClear
        () => {
          accumulatedContent = "";
          setStreamingContent("");
        },
        // onError
        (error) => {
          updateMessages([
            ...newMessages,
            { ...placeholderMessage, content: `Erreur: ${error}`, isStreaming: false },
          ]);
        },
        // onDone
        (data) => {
          setStreamingContent("");
          setExecutingTools([]);
          setPendingConfirmation(null);
          updateMessages([
            ...newMessages,
            { ...placeholderMessage, content: accumulatedContent, toolResults: currentToolResults, isStreaming: false },
          ]);

          // Si le backend a créé une nouvelle conversation, mettre à jour l'ID local
          if (data.conversation_id && (activeConversationId === "current" || activeConversationId.startsWith("new-"))) {
            setActiveConversationId(data.conversation_id);
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === activeConversationId
                  ? { ...conv, id: data.conversation_id! }
                  : conv
              )
            );
          }
        },
        // onToolExecuting
        (event) => {
          currentExecutingTools = [...currentExecutingTools, event];
          setExecutingTools(currentExecutingTools);
        },
        // onConfirmationRequired
        (event) => {
          setPendingConfirmation(event);
          setExecutingTools([]);
        }
      );
    } catch (error) {
      const errorMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
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
        content: "Conversation effacée. Comment puis-je vous aider ?",
        timestamp: new Date(),
        feedback: null,
      },
    ]);
  };

  const startNewConversation = () => {
    const newConv: Conversation = {
      id: "new-" + Date.now().toString(), // Préfixe pour identifier les conversations temporaires
      title: "Nouvelle conversation",
      lastMessage: "Comment puis-je vous aider ?",
      timestamp: new Date(),
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Bonjour ! Je suis prêt à vous aider. Que souhaitez-vous faire ?",
          timestamp: new Date(),
          feedback: null,
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setShowHistory(false);
  };

  const handleConfirmTool = async () => {
    if (!pendingConfirmation) return;

    try {
      // Execute the tool
      const result = await aiService.executeTool(
        slug as string,
        pendingConfirmation.tool_name,
        pendingConfirmation.tool_args,
        (activeConversationId !== "current" && !activeConversationId.startsWith("new-"))
          ? activeConversationId
          : undefined
      );

      // Clear the pending confirmation
      setPendingConfirmation(null);

      // Update the current streaming message to show the tool was executed
      const executionMessage = result.success
        ? `✓ Action confirmée et exécutée avec succès.`
        : `✗ Erreur lors de l'exécution: ${result.error}`;

      // Update the streaming content
      const newContent = streamingContent + "\n\n" + executionMessage;
      setStreamingContent(newContent);

      // Allow the streaming to complete naturally or add a completion message
      setTimeout(() => {
        setIsTyping(false);
        updateMessages([
          ...messages.slice(0, -1),
          {
            ...messages[messages.length - 1],
            content: newContent,
            isStreaming: false,
          },
        ]);
      }, 500);
    } catch (error) {
      console.error("Error executing tool:", error);
      setPendingConfirmation(null);

      // Show error message
      const errorContent = streamingContent + "\n\n✗ Erreur lors de l'exécution de l'action.";
      setStreamingContent(errorContent);
      setIsTyping(false);

      updateMessages([
        ...messages.slice(0, -1),
        {
          ...messages[messages.length - 1],
          content: errorContent,
          isStreaming: false,
        },
      ]);
    }
  };

  const handleRejectTool = () => {
    setPendingConfirmation(null);
    setIsTyping(false);
    setStreamingContent("");

    // Add a message indicating the action was cancelled
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Action annulée. Comment puis-je vous aider autrement ?",
      timestamp: new Date(),
      feedback: null,
    };
    updateMessages([...messages, cancelMessage]);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed z-[100] flex flex-col transition-all duration-300 ease-out overflow-hidden",
          // Glass morphism background
          "bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl",
          "border-l border-gray-200/60 dark:border-gray-800/60",
          "shadow-2xl shadow-black/5 dark:shadow-black/20",
          isFullscreen
            ? "inset-0 w-full h-full top-0"
            : cn(
                "top-16 right-0 h-[calc(100vh-4rem)]",
                open ? "w-[420px]" : "w-0"
              ),
          className
        )}
      >
        {/* Header - Premium glassmorphism */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-900/80 dark:to-gray-950/80 backdrop-blur-sm px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <HiOutlineSparkles className="size-4 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-[1.5px] border-white dark:border-gray-950 shadow-sm" />
            </div>
            <div>
              <h2 className="font-semibold text-[13px] text-gray-900 dark:text-gray-100 tracking-tight">Loura AI</h2>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                Assistant intelligent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <HiOutlineClock className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Historique</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md"
                  onClick={startNewConversation}
                >
                  <HiOutlinePlusCircle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Nouvelle conversation</TooltipContent>
            </Tooltip>
            <div className="w-px h-4 bg-gray-200/60 dark:bg-gray-700/60 mx-0.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <HiOutlineArrowsPointingIn className="size-4" />
                  ) : (
                    <HiOutlineArrowsPointingOut className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{isFullscreen ? "Réduire" : "Plein écran"}</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md">
                  <HiOutlineEllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={clearChat}>
                  <HiOutlineTrash className="size-4 mr-2" />
                  Effacer la conversation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-gray-500 text-xs cursor-default" disabled>
                  Loura AI v2.0
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-7 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md ml-0.5"
            >
              <HiOutlineXMark className="size-4" />
            </Button>
          </div>
        </div>

        {/* Historique des conversations */}
        <div
          className={cn(
            "border-b border-gray-200/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/20 overflow-hidden transition-all duration-300",
            showHistory ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-3 max-h-56 overflow-y-auto">
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Historique
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
                    "w-full text-left p-2.5 rounded-lg text-sm transition-all",
                    conv.id === activeConversationId
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40"
                      : "hover:bg-gray-100/80 dark:hover:bg-gray-800/30 border border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-[13px] text-gray-900 dark:text-gray-100">{conv.title}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {conv.lastMessage.substring(0, 40)}...
                      </div>
                    </div>
                    {conv.id === activeConversationId && (
                      <HiOutlineCheck className="size-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Zone */}
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            className="flex-1 px-4 overflow-y-auto scroll-smooth"
            ref={scrollAreaRef}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(156,163,175,0.3) transparent",
            }}
          >
            <div className="py-5 space-y-5 pb-4">
              {/* Suggestions */}
              {messages.length <= 1 && (
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                    Suggestions rapides
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="group p-3 text-[12px] text-left rounded-xl transition-all border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900/50 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50 dark:hover:from-indigo-950/30 dark:hover:to-violet-950/30 hover:border-indigo-200 dark:hover:border-indigo-800/50 text-gray-700 dark:text-gray-300 hover:shadow-sm"
                      >
                        <span className="font-medium leading-snug block">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 group animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                    msg.role === "user" && "flex-row-reverse"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm mt-0.5",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20"
                        : "bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-50 text-white dark:text-gray-900 shadow-gray-500/10"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <HiOutlineSparkles className="size-3.5" />
                    ) : (
                      <HiOutlineChatBubbleLeftRight className="size-3.5" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className="flex-1 space-y-1.5 max-w-[calc(100%-2.5rem)]">
                    <div
                      className={cn(
                        "rounded-2xl text-[13.5px] leading-relaxed",
                        msg.role === "assistant"
                          ? "bg-gray-50/80 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 border border-gray-200/40 dark:border-gray-800/40 px-4 py-3"
                          : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-3 shadow-lg shadow-indigo-500/15"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        msg.isStreaming ? (
                          // During streaming, show raw text for better performance
                          <div className="whitespace-pre-wrap min-h-[20px]">
                            {streamingContent || " "}
                            <StreamingCursor />
                          </div>
                        ) : (
                          // After streaming, render markdown
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-p:my-1 prose-headings:my-2 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:text-xs prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                    
                    {/* Tool Results Display */}
                    {msg.role === "assistant" && msg.toolResults && msg.toolResults.length > 0 && (
                      <ChatDataDisplay
                        toolResults={msg.toolResults}
                        className="mt-2"
                      />
                    )}

                    {/* Tool Confirmation */}
                    {msg.role === "assistant" && msg.isStreaming && pendingConfirmation && (
                      <ToolConfirmationCard
                        event={pendingConfirmation}
                        onConfirm={handleConfirmTool}
                        onReject={handleRejectTool}
                      />
                    )}

                    {/* Actions bar */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-0.5",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {formatRelativeTime(msg.timestamp)}
                      </span>

                      {msg.role === "assistant" && !msg.isStreaming && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-lg shadow-sm p-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md"
                                  onClick={() => handleCopy(msg.content, msg.id)}
                                >
                                  {copiedId === msg.id ? (
                                    <HiOutlineCheck className="size-3 text-emerald-600" />
                                  ) : (
                                    <HiOutlineClipboardDocument className="size-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Copier</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "size-6 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md",
                                    msg.feedback === "like" && "text-emerald-600 dark:text-emerald-500"
                                  )}
                                  onClick={() => handleFeedback(msg.id, "like")}
                                >
                                  <HiOutlineHandThumbUp className="size-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Utile</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "size-6 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md",
                                    msg.feedback === "dislike" && "text-red-600 dark:text-red-500"
                                  )}
                                  onClick={() => handleFeedback(msg.id, "dislike")}
                                >
                                  <HiOutlineHandThumbDown className="size-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Pas utile</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking/Tool execution indicator - Only show when no streaming content yet */}
              {isTyping && !streamingContent && executingTools.length === 0 && (
                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 text-white mt-0.5">
                    <HiOutlineSparkles className="size-3.5 animate-pulse" />
                  </div>
                  <div className="bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/40 dark:border-gray-800/40 rounded-2xl">
                    <ThinkingIndicator />
                  </div>
                </div>
              )}

              {/* Tool execution indicator - separate from thinking */}
              {isTyping && executingTools.length > 0 && !streamingContent && (
                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 text-white mt-0.5">
                    <HiOutlineSparkles className="size-3.5 animate-pulse" />
                  </div>
                  <div className="bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/40 dark:border-gray-800/40 rounded-2xl">
                    <ThinkingIndicator executingTools={executingTools} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input zone - Premium design */}
          <div className="border-t border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-t from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50 p-4 shrink-0">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className={cn(
                "relative rounded-2xl border transition-all duration-200",
                message.trim()
                  ? "border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 shadow-lg shadow-indigo-500/5 ring-2 ring-indigo-500/10"
                  : "border-gray-200/60 dark:border-gray-800/60 bg-gray-50/80 dark:bg-gray-900/50 hover:border-gray-300 dark:hover:border-gray-700"
              )}>
                <textarea
                  ref={inputRef}
                  placeholder="Envoyez un message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  className={cn(
                    "w-full resize-none px-4 py-3 pr-14 text-[13.5px] leading-relaxed",
                    "bg-transparent",
                    "text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    "focus:outline-none",
                    "transition-colors",
                    "min-h-[48px] max-h-[140px]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "rounded-2xl"
                  )}
                  style={{ height: '48px' }}
                />

                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {message.length > 0 && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-600 mr-1 tabular-nums">
                      {message.length}
                    </span>
                  )}

                  <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || isTyping}
                    className={cn(
                      "size-8 rounded-xl transition-all duration-200",
                      message.trim() && !isTyping
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                    )}
                  >
                    {isTyping ? (
                      <HiOutlineArrowPath className="size-3.5 animate-spin" />
                    ) : (
                      <HiOutlinePaperAirplane className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] px-1">
                <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <HiOutlineShieldCheck className="size-3" />
                  <span>Données filtrées par votre accès</span>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  <kbd className="px-1 py-0.5 rounded bg-gray-100/80 dark:bg-gray-800/80 text-[9px] font-mono border border-gray-200/60 dark:border-gray-700/60">Enter</kbd>
                </div>
              </div>
            </form>
          </div>
        </div>
      </aside>

      {/* Blink animation for cursor */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </TooltipProvider>
  );
}
