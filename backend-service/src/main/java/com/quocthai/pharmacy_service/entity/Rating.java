package com.quocthai.pharmacy_service.entity;

import com.quocthai.pharmacy_service.constants.RatingStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "ratings")
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(nullable = false)
    int star; // 1–5

    @Column(columnDefinition = "TEXT")
    String comment;

    @CreationTimestamp
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

    RatingStatus status;

    // Thiết kế sẵn để mở rộng: dược sĩ trả lời đánh giá
    @OneToMany(mappedBy = "rating", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<RatingReply> replies = new ArrayList<>();
}
