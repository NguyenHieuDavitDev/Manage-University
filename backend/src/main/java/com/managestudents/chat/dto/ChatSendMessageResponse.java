package com.managestudents.chat.dto;

public class ChatSendMessageResponse {

    private ChatMessageResponse userMessage;
    private ChatMessageResponse assistantMessage;

    public ChatMessageResponse getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(ChatMessageResponse userMessage) {
        this.userMessage = userMessage;
    }

    public ChatMessageResponse getAssistantMessage() {
        return assistantMessage;
    }

    public void setAssistantMessage(ChatMessageResponse assistantMessage) {
        this.assistantMessage = assistantMessage;
    }
}
