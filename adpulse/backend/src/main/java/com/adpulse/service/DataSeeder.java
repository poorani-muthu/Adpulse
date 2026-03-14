package com.adpulse.service;

import com.adpulse.model.*;
import com.adpulse.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final CampaignRepository campaignRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(CampaignRepository campaignRepo, UserRepository userRepo,
                      PasswordEncoder encoder) {
        this.campaignRepo = campaignRepo;
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCampaigns();
    }

    private void seedUsers() {
        if (userRepo.count() > 0) return;
        userRepo.saveAll(List.of(
            AppUser.builder().username("admin").password(encoder.encode("admin123")).role("ADMIN").build(),
            AppUser.builder().username("viewer").password(encoder.encode("viewer123")).role("VIEWER").build()
        ));
    }

    private void seedCampaigns() {
        if (campaignRepo.count() > 0) return;
        campaignRepo.saveAll(List.of(
            Campaign.builder().name("Brand Awareness Q1").adType("DISPLAY").status("ACTIVE")
                .budget(15000).spent(11200).impressions(2400000).clicks(14400).conversions(288).revenue(43200).build(),
            Campaign.builder().name("Google Search - Shoes").adType("SEARCH").status("ACTIVE")
                .budget(8000).spent(7200).impressions(180000).clicks(12600).conversions(504).revenue(37800).build(),
            Campaign.builder().name("YouTube Pre-Roll").adType("VIDEO").status("ACTIVE")
                .budget(12000).spent(9800).impressions(950000).clicks(5700).conversions(114).revenue(8550).build(),
            Campaign.builder().name("Shopping - Electronics").adType("SHOPPING").status("ACTIVE")
                .budget(20000).spent(18500).impressions(620000).clicks(37200).conversions(744).revenue(111600).build(),
            Campaign.builder().name("Retargeting - Cart").adType("DISPLAY").status("ACTIVE")
                .budget(5000).spent(4100).impressions(310000).clicks(9300).conversions(465).revenue(34875).build(),
            Campaign.builder().name("Summer Sale Blast").adType("SEARCH").status("ACTIVE")
                .budget(10000).spent(9500).impressions(400000).clicks(20000).conversions(200).revenue(14000).build(),
            Campaign.builder().name("Holiday Video Push").adType("VIDEO").status("PAUSED")
                .budget(18000).spent(6000).impressions(700000).clicks(3500).conversions(35).revenue(2450).build(),
            Campaign.builder().name("Competitor Keywords").adType("SEARCH").status("ACTIVE")
                .budget(6000).spent(5800).impressions(95000).clicks(8550).conversions(342).revenue(25650).build(),
            Campaign.builder().name("Display Prospecting").adType("DISPLAY").status("ACTIVE")
                .budget(9000).spent(8200).impressions(1800000).clicks(9000).conversions(90).revenue(5400).build(),
            Campaign.builder().name("Black Friday Shopping").adType("SHOPPING").status("ENDED")
                .budget(25000).spent(24800).impressions(1100000).clicks(66000).conversions(1980).revenue(297000).build()
        ));
    }
}
