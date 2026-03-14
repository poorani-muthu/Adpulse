package com.adpulse.controller;

import com.adpulse.dto.CampaignDTOs.*;
import com.adpulse.service.CampaignService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService service;

    public CampaignController(CampaignService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CampaignResponse>> getAll(
            @RequestParam(required = false) String adType,
            @RequestParam(required = false) String search) {
        if (adType != null) return ResponseEntity.ok(service.getByAdType(adType));
        if (search != null) return ResponseEntity.ok(service.search(search));
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampaignResponse> create(@RequestBody @Valid CampaignRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampaignResponse> update(@PathVariable Long id,
                                                    @RequestBody @Valid CampaignRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboard() {
        return ResponseEntity.ok(service.getDashboardStats());
    }

    @GetMapping("/optimized")
    public ResponseEntity<List<CampaignResponse>> getOptimized() {
        return ResponseEntity.ok(service.getOptimized());
    }
}
