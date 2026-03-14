package com.adpulse.service;

import com.adpulse.dto.CampaignDTOs.*;
import com.adpulse.model.Campaign;
import com.adpulse.repository.CampaignRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CampaignService {

    private final CampaignRepository repo;

    public CampaignService(CampaignRepository repo) {
        this.repo = repo;
    }

    public List<CampaignResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public List<CampaignResponse> getByAdType(String adType) {
        return repo.findByAdType(adType.toUpperCase()).stream().map(this::toResponse).toList();
    }

    public List<CampaignResponse> search(String name) {
        return repo.findByNameContainingIgnoreCase(name).stream().map(this::toResponse).toList();
    }

    public CampaignResponse getById(Long id) {
        Campaign c = repo.findById(id).orElseThrow(() -> new RuntimeException("Campaign not found"));
        return toResponse(c);
    }

    public CampaignResponse create(CampaignRequest req) {
        Campaign c = Campaign.builder()
            .name(req.name())
            .adType(req.adType().toUpperCase())
            .status(req.status().toUpperCase())
            .budget(req.budget())
            .spent(req.spent())
            .impressions(req.impressions())
            .clicks(req.clicks())
            .conversions(req.conversions())
            .revenue(req.revenue())
            .build();
        return toResponse(repo.save(c));
    }

    public CampaignResponse update(Long id, CampaignRequest req) {
        Campaign c = repo.findById(id).orElseThrow(() -> new RuntimeException("Campaign not found"));
        c.setName(req.name());
        c.setAdType(req.adType().toUpperCase());
        c.setStatus(req.status().toUpperCase());
        c.setBudget(req.budget());
        c.setSpent(req.spent());
        c.setImpressions(req.impressions());
        c.setClicks(req.clicks());
        c.setConversions(req.conversions());
        c.setRevenue(req.revenue());
        return toResponse(repo.save(c));
    }

    public void delete(Long id) {
        repo.findById(id).orElseThrow(() -> new RuntimeException("Campaign not found"));
        repo.deleteById(id);
    }

    public DashboardStats getDashboardStats() {
        List<Campaign> all = repo.findAll();
        double totalSpend = all.stream().mapToDouble(Campaign::getSpent).sum();
        long totalImpressions = all.stream().mapToLong(Campaign::getImpressions).sum();
        long totalClicks = all.stream().mapToLong(Campaign::getClicks).sum();
        long totalConversions = all.stream().mapToInt(Campaign::getConversions).sum();
        double totalRevenue = all.stream().mapToDouble(Campaign::getRevenue).sum();
        int active = (int) all.stream().filter(c -> "ACTIVE".equals(c.getStatus())).count();
        // Anomaly = active campaign with ROAS < 2.0
        int anomalies = (int) all.stream()
            .filter(c -> "ACTIVE".equals(c.getStatus()) && c.getRoas() < 2.0 && c.getSpent() > 0)
            .count();

        return new DashboardStats(
            totalSpend, totalImpressions, totalClicks, totalConversions, totalRevenue,
            totalSpend > 0 ? totalRevenue / totalSpend : 0,
            totalImpressions > 0 ? (double) totalClicks / totalImpressions * 100 : 0,
            active, anomalies
        );
    }

    // Greedy budget optimizer — rank by ROAS, suggest reallocation
    public List<CampaignResponse> getOptimized() {
        return repo.findByStatus("ACTIVE").stream()
            .sorted((a, b) -> Double.compare(b.getRoas(), a.getRoas()))
            .map(this::toResponse)
            .toList();
    }

    private CampaignResponse toResponse(Campaign c) {
        return new CampaignResponse(
            c.getId(), c.getName(), c.getAdType(), c.getStatus(),
            c.getBudget(), c.getSpent(), c.getImpressions(), c.getClicks(),
            c.getConversions(), c.getRevenue(),
            c.getCtr(), c.getRoas(), c.getCpa(),
            c.getCreatedAt() != null ? c.getCreatedAt().toString() : null,
            c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null
        );
    }
}
