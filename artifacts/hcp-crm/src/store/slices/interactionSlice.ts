import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage } from "@workspace/api-client-react";

interface InteractionState {
  mode: "form" | "chat";
  draft: Record<string, any>;
  chatHistory: ChatMessage[];
}

const initialState: InteractionState = {
  mode: "form",
  draft: {},
  chatHistory: [],
};

const interactionSlice = createSlice({
  name: "interaction",
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<"form" | "chat">) {
      state.mode = action.payload;
    },
    updateDraft(state, action: PayloadAction<Record<string, any>>) {
      state.draft = { ...state.draft, ...action.payload };
    },
    clearDraft(state) {
      state.draft = {};
    },
    addChatMessage(state, action: PayloadAction<ChatMessage>) {
      state.chatHistory.push(action.payload);
    },
    clearChatHistory(state) {
      state.chatHistory = [];
    },
  },
});

export const { setMode, updateDraft, clearDraft, addChatMessage, clearChatHistory } = interactionSlice.actions;
export default interactionSlice.reducer;
