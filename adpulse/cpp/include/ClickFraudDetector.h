#pragma once
#include <string>
#include <vector>

struct ClickEvent {
    long long timestamp_ms;
    std::string ip_address;
    double lat;
    double lon;
};

struct FraudResult {
    double fraud_score;   // 0.0 - 1.0
    bool is_fraud;
    double velocity_z;
    double ip_rep_score;
    double geo_score;
    double bot_cv_score;
    std::string reason;
};

class ClickFraudDetector {
public:
    static FraudResult analyze(const std::vector<ClickEvent>& events);
};
