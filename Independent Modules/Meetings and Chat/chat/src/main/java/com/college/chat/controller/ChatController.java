package com.college.chat.controller;

import com.college.chat.dto.ChatMessageRequest;
import com.college.chat.model.ChatMessage;
import com.college.chat.model.ChatRoom;
import com.college.chat.model.MessageType;
import com.college.chat.model.User;
import com.college.chat.repository.ChatMessageRepository;
import com.college.chat.repository.ChatRoomRepository;
import com.college.chat.repository.UserRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          ChatMessageRepository chatMessageRepository,
                          ChatRoomRepository chatRoomRepository,
                          UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/chat.sendMessage/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId, @Payload ChatMessageRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ChatMessage chatMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(request.getContent())
                .timestamp(new Date())
                .type(MessageType.valueOf(request.getType()))
                .build();
        
        chatMessageRepository.save(chatMessage);
        
        // We broadcast the Full Entity back to clients so they can render username/avatar
        messagingTemplate.convertAndSend("/topic/room/" + roomId, chatMessage);
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessageRequest request) {
        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));
        
        ChatMessage chatMessage = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent())
                .timestamp(new Date())
                .type(MessageType.valueOf(request.getType()))
                .build();
        
        // Ensure we save it
        chatMessageRepository.save(chatMessage);
        
        messagingTemplate.convertAndSend(
                "/topic/private/" + recipient.getId(),
                chatMessage
        );
        
        messagingTemplate.convertAndSend(
                "/topic/private/" + sender.getId(),
                chatMessage
        );
    }
    
    @MessageMapping("/chat.addUser")
    public void addUser(@Payload User user) {
        // Typically handled by Auth, but here we can just update status
        Optional<User> existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            User u = existingUser.get();
            u.setStatus("ONLINE");
            userRepository.save(u);
        } else {
             user.setStatus("ONLINE");
             userRepository.save(user);
        }
        // Broadcast user joined...
    }
}
