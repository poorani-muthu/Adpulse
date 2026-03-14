package com.adpulse;

import com.adpulse.dto.AuthDTOs.*;
import com.adpulse.dto.CampaignDTOs.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdPulseApplicationTests {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    static String adminToken;
    static String viewerToken;

    @Test @Order(1)
    void adminLoginSucceeds() throws Exception {
        String body = mapper.writeValueAsString(new LoginRequest("admin", "admin123"));
        MvcResult result = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andReturn();
        adminToken = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    @Test @Order(2)
    void viewerLoginSucceeds() throws Exception {
        String body = mapper.writeValueAsString(new LoginRequest("viewer", "viewer123"));
        MvcResult result = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andReturn();
        viewerToken = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    @Test @Order(3)
    void invalidLoginReturns401() throws Exception {
        String body = mapper.writeValueAsString(new LoginRequest("admin", "wrongpassword"));
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isUnauthorized());
    }

    @Test @Order(4)
    void getCampaignsRequiresAuth() throws Exception {
        mvc.perform(get("/api/campaigns")).andExpect(status().isForbidden());
    }

    @Test @Order(5)
    void getCampaignsWithToken() throws Exception {
        mvc.perform(get("/api/campaigns")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test @Order(6)
    void createCampaignAsAdmin() throws Exception {
        CampaignRequest req = new CampaignRequest(
            "Test Campaign", "SEARCH", "ACTIVE",
            5000, 1000, 50000, 2500, 100, 7500
        );
        mvc.perform(post("/api/campaigns")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Campaign"));
    }

    @Test @Order(7)
    void createCampaignAsViewerForbidden() throws Exception {
        CampaignRequest req = new CampaignRequest(
            "Viewer Campaign", "DISPLAY", "ACTIVE",
            1000, 0, 0, 0, 0, 0
        );
        mvc.perform(post("/api/campaigns")
                .header("Authorization", "Bearer " + viewerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @Test @Order(8)
    void getDashboardStats() throws Exception {
        mvc.perform(get("/api/campaigns/dashboard")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalSpend").exists())
            .andExpect(jsonPath("$.activeCampaigns").exists());
    }
}
