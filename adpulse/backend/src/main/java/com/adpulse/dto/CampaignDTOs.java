package com.adpulse.dto;

import jakarta.validation.constraints.*;

public class CampaignDTOs {

    public record CampaignRequest(
        @NotBlank String name,
        @NotBlank String adType,
        @NotBlank String status,
        @Positive double budget,
        @PositiveOrZero double spent,
        @PositiveOrZero long impressions,
        @PositiveOrZero long clicks,
        @PositiveOrZero int conversions,
        @PositiveOrZero double revenue
    ) {}

    public record CampaignResponse(
        Long id,
        String name,
        String adType,
        String status,
        double budget,
        double spent,
        long impressions,
        long clicks,
        int conversions,
        double revenue,
        double ctr,
        double roas,
        double cpa,
        String createdAt,
        String updatedAt
    ) {}

    public record DashboardStats(
        double totalSpend,
        long totalImpressions,
        long totalClicks,
        long totalConversions,
        double totalRevenue,
        double overallRoas,
        double overallCtr,
        int activeCampaigns,
        int anomalies
    ) {}
}
