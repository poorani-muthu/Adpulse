package com.adpulse.repository;

import com.adpulse.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByAdType(String adType);
    List<Campaign> findByStatus(String status);
    List<Campaign> findByNameContainingIgnoreCase(String name);

    @Query("SELECT SUM(c.spent) FROM Campaign c WHERE c.status = 'ACTIVE'")
    Double totalActiveSpend();

    @Query("SELECT SUM(c.impressions) FROM Campaign c")
    Long totalImpressions();

    @Query("SELECT SUM(c.clicks) FROM Campaign c")
    Long totalClicks();

    @Query("SELECT SUM(c.conversions) FROM Campaign c")
    Long totalConversions();

    @Query("SELECT SUM(c.revenue) FROM Campaign c")
    Double totalRevenue();
}
