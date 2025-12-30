package com.college.chat.service;

import com.college.chat.model.ChatRoom;
import com.college.chat.model.User;
import com.college.chat.repository.ChatRoomRepository;
import com.college.chat.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class GroupService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    public GroupService(ChatRoomRepository chatRoomRepository, UserRepository userRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.userRepository = userRepository;
    }

    public ChatRoom createGroup(String name, String description, Long creatorId, List<Long> memberIds) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ChatRoom room = ChatRoom.builder()
                .name(name)
                .description(description)
                .creator(creator)
                .type("GROUP")
                .build();
        
        room.getMembers().add(creator);
        
        if (memberIds != null && !memberIds.isEmpty()) {
            List<User> members = userRepository.findAllById(memberIds);
            room.getMembers().addAll(members);
        }
        
        return chatRoomRepository.save(room);
    }

    public void addMember(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!room.getMembers().contains(user)) {
            room.getMembers().add(user);
            chatRoomRepository.save(room);
        }
    }

    public void removeMember(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        room.getMembers().remove(user);
        chatRoomRepository.save(room);
    }

    public List<User> getMembers(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        return room.getMembers();
    }
    
    public List<ChatRoom> getUserGroups(Long userId) {
        return chatRoomRepository.findAll().stream()
                .filter(room -> room.getMembers().stream()
                        .anyMatch(member -> member.getId().equals(userId)))
                .toList();
    }
}
