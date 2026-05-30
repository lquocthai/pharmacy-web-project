package com.quocthai.pharmacy_service.controller;

import com.quocthai.pharmacy_service.entity.Conversation;
import com.quocthai.pharmacy_service.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository repo;

    @PostMapping("/{id}/claim")
    public String claim(@PathVariable String id,
                        @RequestParam String pharmacistId) {

        Conversation c = repo.findById(id).orElseThrow();

        if (c.getStatus() != Conversation.ConversationStatus.PENDING) {
            return "ALREADY_TAKEN";
        }

        c.setStatus(Conversation.ConversationStatus.IN_PROGRESS);
        c.setPharmacistId(pharmacistId);

        repo.save(c);

        return "OK";
    }
}
