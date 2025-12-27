/**
 * Service pour l'assistant IA
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  feedback?: 'like' | 'dislike' | null;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  response_time_ms?: number;
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string;
  is_agent_mode: boolean;
  is_active: boolean;
  messages: AIMessage[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIConversationListItem {
  id: string;
  title: string;
  is_agent_mode: boolean;
  last_message?: {
    content: string;
    role: string;
    created_at: string;
  };
  updated_at: string;
}

export interface ToolCall {
  tool: string;
  params: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  agent_mode?: boolean;
  model?: string;
}

export interface ChatResponse {
  success: boolean;
  content: string;
  conversation_id: string;
  message_id: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
  response_time_ms: number;
  model: string;
}

export interface AIModelsResponse {
  models: string[];
  default: string;
  ollama_available: boolean;
}

export interface AITool {
  name: string;
  description: string;
  params: string[];
}

export interface AIToolsResponse {
  tools: AITool[];
}

/**
 * Service principal pour l'assistant IA
 */
export const aiService = {
  /**
   * Envoie un message au chat IA
   */
  async chat(
    orgSubdomain: string,
    request: ChatRequest
  ): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>(
      API_ENDPOINTS.AI.CHAT,
      request,
      {
        headers: {
          'X-Organization-Subdomain': orgSubdomain,
        },
      }
    );
  },

  /**
   * Liste les conversations
   */
  async getConversations(
    orgSubdomain: string
  ): Promise<AIConversationListItem[]> {
    const response = await apiClient.get<{ results: AIConversationListItem[] }>(
      API_ENDPOINTS.AI.CONVERSATIONS.LIST,
      {
        headers: {
          'X-Organization-Subdomain': orgSubdomain,
        },
      }
    );
    return response.results || [];
  },

  /**
   * Récupère une conversation avec ses messages
   */
  async getConversation(
    orgSubdomain: string,
    conversationId: string
  ): Promise<AIConversation> {
    return apiClient.get<AIConversation>(
      API_ENDPOINTS.AI.CONVERSATIONS.DETAIL(conversationId),
      {
        headers: {
          'X-Organization-Subdomain': orgSubdomain,
        },
      }
    );
  },

  /**
   * Supprime une conversation
   */
  async deleteConversation(
    orgSubdomain: string,
    conversationId: string
  ): Promise<void> {
    return apiClient.delete(
      API_ENDPOINTS.AI.CONVERSATIONS.DELETE(conversationId),
      {
        headers: {
          'X-Organization-Subdomain': orgSubdomain,
        },
      }
    );
  },

  /**
   * Efface les messages d'une conversation
   */
  async clearConversation(
    orgSubdomain: string,
    conversationId: string
  ): Promise<void> {
    return apiClient.delete(
      API_ENDPOINTS.AI.CONVERSATIONS.CLEAR(conversationId),
      {
        headers: {
          'X-Organization-Subdomain': orgSubdomain,
        },
      }
    );
  },

  /**
   * Ajoute un feedback à un message
   */
  async addFeedback(
    orgSubdomain: string,
    conversationId: string,
    messageId: string,
    feedback: 'like' | 'dislike' | null
  ): Promise<void> {
    return apiClient.post(
      API_ENDPOINTS.AI.CONVERSATIONS.FEEDBACK(conversationId),
      { message_id: messageId, feedback },
      {
        headers: {
          'X-Organization-Subdomain': orgSubdomain,
        },
      }
    );
  },

  /**
   * Liste les modèles IA disponibles
   */
  async getModels(): Promise<AIModelsResponse> {
    return apiClient.get<AIModelsResponse>(API_ENDPOINTS.AI.MODELS);
  },

  /**
   * Liste les outils disponibles pour l'agent
   */
  async getTools(): Promise<AIToolsResponse> {
    return apiClient.get<AIToolsResponse>(API_ENDPOINTS.AI.TOOLS);
  },
};

export default aiService;
