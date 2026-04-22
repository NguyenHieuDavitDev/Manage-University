package com.managestudents.chat;

import com.managestudents.chat.dto.ChatCreateSessionRequest;
import com.managestudents.chat.dto.ChatMessageRequest;
import com.managestudents.chat.dto.ChatMessageResponse;
import com.managestudents.chat.dto.ChatSendMessageResponse;
import com.managestudents.chat.dto.ChatSessionResponse;
import com.managestudents.security.JwtPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionResponse> createSession(@RequestBody(required = false) ChatCreateSessionRequest body) {
        String title = body == null ? null : body.getTitle();
        ChatSessionResponse response = chatService.createSession(currentUserId(), title);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionResponse>> listSessions() {
        return ResponseEntity.ok(chatService.listSessions(currentUserId()));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> listMessages(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(chatService.listMessages(currentUserId(), sessionId));
    }

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ChatSendMessageResponse> sendMessage(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ChatMessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(currentUserId(), sessionId, request.getMessage()));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId) {
        chatService.deleteSession(currentUserId(), sessionId);
        return ResponseEntity.noContent().build();
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new BadCredentialsException("Chưa đăng nhập hoặc phiên đã hết hạn");
        }
        return principal.userId();
    }
}
