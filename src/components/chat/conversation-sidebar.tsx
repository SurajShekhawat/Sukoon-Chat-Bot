"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MessageSquareHeart,
  Search,
  AlertCircle,
} from "lucide-react";
import { ConversationWithLastMessage } from "@/lib/services/conversation";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: ConversationWithLastMessage[];
  currentConversationId?: string;
  onNewConversation?: () => void;
  onRefresh?: () => void;
  onCloseMobile?: () => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onRefresh,
  onCloseMobile,
}: ConversationSidebarProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
    setDeleteConfirmId(null);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim()) return;

    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setEditingId(null);
      if (onRefresh) onRefresh();
      router.refresh();
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  };

  const handlePromptDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(id);
    setEditingId(null);
  };

  const handleConfirmDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      setDeleteConfirmId(null);
      if (onRefresh) onRefresh();
      if (currentConversationId === id) {
        router.push("/chat");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleCreateNew = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      if (onNewConversation) {
        onNewConversation();
      } else {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Reflection" }),
        });
        const data = await res.json();
        if (data.conversation?.id) {
          if (onCloseMobile) onCloseMobile();
          router.push(`/chat/${data.conversation.id}`);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Failed to create conversation", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group conversations chronologically
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;

    const groups: { title: string; items: ConversationWithLastMessage[] }[] = [
      { title: "Today", items: [] },
      { title: "Yesterday", items: [] },
      { title: "Previous 7 Days", items: [] },
      { title: "Earlier Reflections", items: [] },
    ];

    filteredConversations.forEach((conv) => {
      const convDate = new Date(conv.updated_at || conv.created_at).getTime();
      if (convDate >= today) {
        groups[0].items.push(conv);
      } else if (convDate >= yesterday) {
        groups[1].items.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups[2].items.push(conv);
      } else {
        groups[3].items.push(conv);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredConversations]);

  return (
    <div className="flex flex-col h-full w-full bg-warm-50/60 dark:bg-slate-950/80 backdrop-blur-md">
      {/* Header & New Chat Button */}
      <div className="p-3.5 space-y-3 border-b border-warm-200/70 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sukoon-100 dark:bg-sukoon-950/80 flex items-center justify-center text-sukoon-700 dark:text-sukoon-400">
              <MessageSquareHeart className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Reflections
            </span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sukoon-600 via-teal-600 to-sukoon-700 hover:from-sukoon-500 hover:to-teal-500 text-white font-medium text-xs shadow-sm hover:shadow-md shadow-sukoon-900/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Starting..." : "New Reflection"}</span>
        </button>

        {/* Quick Search */}
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reflections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-warm-200/80 dark:border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sukoon-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 space-y-4">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-400 space-y-1.5">
            <MessageSquareHeart className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              {searchQuery ? "No matching reflections" : "No previous reflections"}
            </p>
            <p className="text-[11px]">
              {searchQuery ? "Try a different search term" : "Begin your first peaceful reflection above."}
            </p>
          </div>
        ) : (
          groupedConversations.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </div>

              {group.items.map((c) => {
                const isActive = c.id === currentConversationId;
                const isEditing = editingId === c.id;
                const isConfirmingDelete = deleteConfirmId === c.id;

                return (
                  <div
                    key={c.id}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-150",
                      isActive
                        ? "bg-white dark:bg-slate-900 text-sukoon-900 dark:text-sukoon-200 font-medium shadow-2xs border-l-2 border-sukoon-500 dark:border-sukoon-400"
                        : "hover:bg-white/80 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-l-2 border-transparent"
                    )}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(c.id, e)}
                        className="flex items-center gap-1.5 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 bg-white dark:bg-slate-900 border border-warm-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sukoon-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(c.id, e)}
                          className="p-1 rounded text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center justify-between w-full text-[11px] text-rose-600 dark:text-rose-400">
                        <span className="flex items-center gap-1 truncate font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Delete?</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleConfirmDelete(c.id, e)}
                            className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelDelete}
                            className="px-2 py-0.5 rounded border border-warm-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link
                          href={`/chat/${c.id}`}
                          onClick={() => onCloseMobile?.()}
                          className="flex items-center gap-2.5 flex-1 min-w-0 pr-2"
                        >
                          <MessageSquare
                            className={cn(
                              "w-3.5 h-3.5 shrink-0 transition-colors",
                              isActive
                                ? "text-sukoon-600 dark:text-sukoon-400"
                                : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                            )}
                          />
                          <span className="truncate">{c.title}</span>
                        </Link>

                        {/* Action buttons on hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                          <button
                            onClick={(e) => handleStartRename(c.id, c.title, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Rename"
                            aria-label={`Rename ${c.title}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handlePromptDelete(c.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                            title="Delete"
                            aria-label={`Delete ${c.title}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
