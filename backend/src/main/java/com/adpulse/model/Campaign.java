package com.adpulse.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    private String adType; // SEARCH, DISPLAY, SHOPPING, VIDEO

    @NotBlank
    private String status; // ACTIVE, PAUSED, ENDED

    @Positive
    private double budget;

    @PositiveOrZero
    private double spent;

    @PositiveOrZero
    private long impressions;

    @PositiveOrZero
    private long clicks;

    @PositiveOrZero
    private int conversions;

    @PositiveOrZero
    private double revenue;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Computed metrics (not persisted)
    @Transient
    public double getCtr() {
        return impressions == 0 ? 0 : (double) clicks / impressions * 100;
    }

    @Transient
    public double getRoas() {
        return spent == 0 ? 0 : revenue / spent;
    }

    @Transient
    public double getCpa() {
        return conversions == 0 ? 0 : spent / conversions;
    }
}
