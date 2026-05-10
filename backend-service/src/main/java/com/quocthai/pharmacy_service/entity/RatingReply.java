package com.quocthai.pharmacy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "rating_replies")
public class RatingReply {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rating_id", nullable = false)
    Rating rating;

    // Dược sĩ hoặc admin trả lời
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by", nullable = false)
    User repliedBy;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    @CreationTimestamp
    LocalDateTime createdAt;
}
