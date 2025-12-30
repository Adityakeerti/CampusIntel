package com.college.chat.service;

import com.college.chat.model.FriendRequest;
import com.college.chat.model.User;
import com.college.chat.repository.FriendRequestRepository;
import com.college.chat.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;

    public UserService(UserRepository userRepository, FriendRequestRepository friendRequestRepository) {
        this.userRepository = userRepository;
        this.friendRequestRepository = friendRequestRepository;
    }

    @PostConstruct
    public void init() {
        // Seed users as requested
        register(User.builder()
                .username("Aditya")
                .email("aditya@gmail.com")
                .password("aaa")
                .status("OFFLINE")
                .build());

        register(User.builder()
                .username("Megha")
                .email("megha@gmail.com")
                .password("mmm")
                .status("OFFLINE")
                .build());
    }

    public User register(User user) {
        Optional<User> existing = userRepository.findByUsername(user.getUsername());
        if (existing.isPresent()) {
            User existingUser = existing.get();
            // Update fields that might be missing from older runs
            existingUser.setEmail(user.getEmail());
            existingUser.setPassword(user.getPassword());
            return userRepository.save(existingUser);
        }
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid password");
        }
        
        user.setStatus("ONLINE");
        return userRepository.save(user);
    }

    public void disconnect(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus("OFFLINE");
            userRepository.save(user);
        });
    }

    public void sendFriendRequest(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();
        
        // Check if already friends or requested
        // Simplified for now
        FriendRequest request = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequest.RequestStatus.PENDING)
                .timestamp(new java.util.Date())
                .build();
        
        friendRequestRepository.save(request);
    }

    public void acceptFriendRequest(Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId).orElseThrow();
        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        friendRequestRepository.save(request);

        User sender = request.getSender();
        User receiver = request.getReceiver();

        sender.getFriends().add(receiver);
        receiver.getFriends().add(sender);

        userRepository.save(sender);
        userRepository.save(receiver);
    }

    public void removeFriend(Long userId, Long friendId) {
        User user = userRepository.findById(userId).orElseThrow();
        User friend = userRepository.findById(friendId).orElseThrow();

        user.getFriends().removeIf(f -> f.getId().equals(friendId));
        friend.getFriends().removeIf(f -> f.getId().equals(userId));

        userRepository.save(user);
        userRepository.save(friend);
        
        // Also remove any friend requests to keep state clean (optional but good)
        // For simplicity we just unlink the friendship relation
    }
    
    public List<User> getFriends(Long userId) {
         return userRepository.findById(userId).map(User::getFriends).orElse(new ArrayList<>());
    }
    
    public List<FriendRequest> getPendingRequests(Long userId) {
        return friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequest.RequestStatus.PENDING);
    }

    public List<FriendRequest> getSentRequests(Long userId) {
        return friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequest.RequestStatus.PENDING);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
