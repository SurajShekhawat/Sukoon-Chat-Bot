import React from "react";
import { Metadata } from "next";
import { AISettingsView } from "@/components/admin/ai-settings-view";

export const metadata: Metadata = {
  title: "Admin AI Model Settings | Sukoon AI",
  description: "Configure multi-model task routing across Gemini, OpenAI, and NVIDIA NIM hosted catalogs.",
};

export default function AdminAISettingsPage() {
  return <AISettingsView />;
}

