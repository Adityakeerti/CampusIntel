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

    private final com.college.chat.repository.GroupMemberRepository groupMemberRepository;

    public GroupService(ChatRoomRepository chatRoomRepository, UserRepository userRepository, com.college.chat.repository.GroupMemberRepository groupMemberRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    public ChatRoom createGroup(String name, String description, Long creatorId, List<Long> memberIds) {
        ChatRoom room = ChatRoom.builder()
                .name(name)
                .description(description)
                .createdBy(creatorId)
                .type(ChatRoom.GroupType.OFFICIAL) 
                .isActive(true)
                .build();
        
        ChatRoom savedRoom = chatRoomRepository.save(room);

        // Add creator as member
        User creator = userRepository.findById(creatorId).orElseThrow();
        groupMemberRepository.save(com.college.chat.model.GroupMember.builder()
                .chatRoom(savedRoom)
                .user(creator)
                .joinedAt(new java.util.Date())
                .role(com.college.chat.model.GroupMember.Role.LEADER)
                .build());

        // Add other members
        if (memberIds != null && !memberIds.isEmpty()) {
            List<User> members = userRepository.findAllById(memberIds);
            members.forEach(m -> {
                groupMemberRepository.save(com.college.chat.model.GroupMember.builder()
                    .chatRoom(savedRoom)
                    .user(m)
                    .joinedAt(new java.util.Date())
                    .role(com.college.chat.model.GroupMember.Role.MEMBER)
                    .build());
            });
        }
        
        return savedRoom;
    }

    public void addMember(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        
        if (groupMemberRepository.findByChatRoomIdAndUserId(roomId, userId).isEmpty()) {
            groupMemberRepository.save(com.college.chat.model.GroupMember.builder()
                .chatRoom(room)
                .user(user)
                .joinedAt(new java.util.Date())
                .role(com.college.chat.model.GroupMember.Role.MEMBER)
                .build());
        }
    }

    public void removeMember(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Prevent leaving Master Group
        if ("Default College".equalsIgnoreCase(room.getName()) || "Master Group".equalsIgnoreCase(room.getName())) {
            throw new RuntimeException("Cannot leave the Master Group.");
        }

        groupMemberRepository.findByChatRoomIdAndUserId(roomId, userId)
            .ifPresent(groupMemberRepository::delete);
    }

    public List<User> getMembers(Long roomId) {
        return groupMemberRepository.findByChatRoomId(roomId).stream()
                .map(com.college.chat.model.GroupMember::getUser)
                .toList();
    }
    
    public List<ChatRoom> getUserGroups(Long userId) {
        // Fetch groups from GroupMember table
        List<ChatRoom> joinedGroups = groupMemberRepository.findByUserId(userId).stream()
                .map(com.college.chat.model.GroupMember::getChatRoom)
                .collect(java.util.stream.Collectors.toList());
                
        // Ensure Master Group is always included (failsafe)
        boolean hasMaster = joinedGroups.stream().anyMatch(g -> "Default College".equals(g.getName()));
        if (!hasMaster) {
             chatRoomRepository.findByName("Default College").ifPresent(joinedGroups::add);
        }
        
        return joinedGroups;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
         if (chatRoomRepository.findByName("Default College").isEmpty()) {
             ChatRoom master = ChatRoom.builder()
                 .name("Default College")
                 .description("Official Campus Wide Group")
                 .type(ChatRoom.GroupType.OFFICIAL)
                 .isActive(true)
                 .createdBy(0L) 
                 .build();
             chatRoomRepository.save(master);
         }
    }
}
