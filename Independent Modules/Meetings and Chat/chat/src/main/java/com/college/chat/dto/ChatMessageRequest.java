package com.college.chat.dto;

import lombok.Data;

@Data
public class ChatMessageRequest {
    private Long senderId;
    private Long recipientId;
    private String content;
    private String type; // CHAT, JOIN, LEAVE
}
