/**
 * tests/engine_tests.cpp
 * Google Test suite for all three C++ engines
 * Run: cmake --build build && ./build/run_tests
 */

#include <gtest/gtest.h>
#include "../include/ABTestEngine.h"
#include "../include/KeywordMatchEngine.h"
#include "../include/ClickFraudDetector.h"

// ============================================================
// ABTestEngine Tests
// ============================================================

TEST(ABTestEngine, SignificantDifference) {
    ABTestInput in{10000, 500, 10000, 650};
    auto r = ABTestEngine::run(in);
    EXPECT_TRUE(r.significant);
    EXPECT_LT(r.p_value, 0.05);
    EXPECT_EQ(r.winner, "B");
}

TEST(ABTestEngine, NoSignificantDifference) {
    ABTestInput in{1000, 100, 1000, 102};
    auto r = ABTestEngine::run(in);
    EXPECT_FALSE(r.significant);
    EXPECT_EQ(r.winner, "No winner");
}

TEST(ABTestEngine, LiftIsPositive) {
    ABTestInput in{5000, 200, 5000, 300};
    auto r = ABTestEngine::run(in);
    EXPECT_GT(r.lift, 0.0);
}

TEST(ABTestEngine, CIContainsTrueDiff) {
    ABTestInput in{10000, 500, 10000, 600};
    auto r = ABTestEngine::run(in);
    double true_diff = 600.0/10000 - 500.0/10000;
    EXPECT_GE(true_diff, r.ci_lower);
    EXPECT_LE(true_diff, r.ci_upper);
}

TEST(ABTestEngine, ZeroSampleThrows) {
    ABTestInput in{0, 0, 1000, 50};
    EXPECT_THROW(ABTestEngine::run(in), std::invalid_argument);
}

// ============================================================
// KeywordMatchEngine Tests
// ============================================================

TEST(KeywordMatchEngine, ExactMatch) {
    auto r = KeywordMatchEngine::match("buy running shoes", "buy running shoes", MatchType::EXACT);
    EXPECT_TRUE(r.matched);
}

TEST(KeywordMatchEngine, ExactMatchFails) {
    auto r = KeywordMatchEngine::match("running shoes", "buy running shoes", MatchType::EXACT);
    EXPECT_FALSE(r.matched);
}

TEST(KeywordMatchEngine, PhraseMatchInQuery) {
    auto r = KeywordMatchEngine::match("running shoes", "best buy running shoes online", MatchType::PHRASE);
    EXPECT_TRUE(r.matched);
}

TEST(KeywordMatchEngine, BroadMatchWithStemming) {
    auto r = KeywordMatchEngine::match("running shoes", "I am shopping for shoes to run in", MatchType::BROAD);
    EXPECT_TRUE(r.matched);
}

TEST(KeywordMatchEngine, RelevanceScoreRange) {
    double score = KeywordMatchEngine::computeRelevance("cheap flights", "cheap international flights booking");
    EXPECT_GE(score, 0.0);
    EXPECT_LE(score, 1.0);
}

// ============================================================
// ClickFraudDetector Tests
// ============================================================

TEST(ClickFraudDetector, LegitTrafficNotFraud) {
    std::vector<ClickEvent> events;
    // 20 clicks spread over 20 minutes, varied IPs and locations
    for (int i = 0; i < 20; ++i) {
        events.push_back({(long long)i * 60000 + (i * 7919 % 30000),
                          "192.168." + std::to_string(i % 10) + "." + std::to_string(i),
                          37.0 + i * 0.5, -122.0 + i * 0.3});
    }
    auto r = ClickFraudDetector::analyze(events);
    EXPECT_FALSE(r.is_fraud);
}

TEST(ClickFraudDetector, BotTrafficDetected) {
    std::vector<ClickEvent> events;
    // 50 clicks from same IP, perfectly timed, same location
    for (int i = 0; i < 50; ++i) {
        events.push_back({(long long)i * 1000, "10.0.0.1", 37.422, -122.084});
    }
    auto r = ClickFraudDetector::analyze(events);
    EXPECT_TRUE(r.is_fraud);
    EXPECT_GT(r.fraud_score, 0.65);
}

TEST(ClickFraudDetector, FraudScoreRange) {
    std::vector<ClickEvent> events;
    for (int i = 0; i < 10; ++i)
        events.push_back({(long long)i * 500, "10.0.0.2", 40.7, -74.0});
    auto r = ClickFraudDetector::analyze(events);
    EXPECT_GE(r.fraud_score, 0.0);
    EXPECT_LE(r.fraud_score, 1.0);
}

TEST(ClickFraudDetector, EmptyEventsReturnsZero) {
    std::vector<ClickEvent> events;
    auto r = ClickFraudDetector::analyze(events);
    EXPECT_DOUBLE_EQ(r.fraud_score, 0.0);
    EXPECT_FALSE(r.is_fraud);
}

TEST(ClickFraudDetector, ReasonStringNotEmpty) {
    std::vector<ClickEvent> events;
    for (int i = 0; i < 5; ++i)
        events.push_back({(long long)i * 200, "1.2.3.4", 51.5, -0.1});
    auto r = ClickFraudDetector::analyze(events);
    EXPECT_FALSE(r.reason.empty());
}

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
