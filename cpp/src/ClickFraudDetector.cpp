/**
 * ClickFraudDetector.cpp
 * Anomaly-based click fraud detection using:
 *   - Z-score velocity analysis
 *   - IP repetition scoring
 *   - Geographic standard deviation
 *   - Bot coefficient of variation (CV) detection
 */

#include <cmath>
#include <numeric>
#include <algorithm>
#include <unordered_map>
#include "../include/ClickFraudDetector.h"

static double mean(const std::vector<double>& v) {
    if (v.empty()) return 0.0;
    return std::accumulate(v.begin(), v.end(), 0.0) / v.size();
}

static double stddev(const std::vector<double>& v) {
    if (v.size() < 2) return 0.0;
    double m = mean(v);
    double sq_sum = 0.0;
    for (double x : v) sq_sum += (x - m) * (x - m);
    return std::sqrt(sq_sum / (v.size() - 1));
}

FraudResult ClickFraudDetector::analyze(const std::vector<ClickEvent>& events) {
    FraudResult result;
    result.fraud_score = 0.0;
    result.is_fraud = false;

    if (events.empty()) return result;

    // --- 1. Velocity Z-score ---
    // clicks per minute buckets
    std::unordered_map<int, int> buckets;
    for (auto& e : events) {
        int bucket = e.timestamp_ms / 60000;
        buckets[bucket]++;
    }
    std::vector<double> rates;
    for (auto& [k, v] : buckets) rates.push_back((double)v);
    double rate_mean = mean(rates);
    double rate_sd   = stddev(rates);
    double max_rate  = *std::max_element(rates.begin(), rates.end());
    double velocity_z = (rate_sd > 0) ? (max_rate - rate_mean) / rate_sd : 0.0;

    // --- 2. IP repetition score ---
    std::unordered_map<std::string, int> ip_counts;
    for (auto& e : events) ip_counts[e.ip_address]++;
    int max_ip = 0;
    for (auto& [ip, cnt] : ip_counts) max_ip = std::max(max_ip, cnt);
    double ip_score = (double)max_ip / events.size();

    // --- 3. Geographic stddev (lat/lon spread) ---
    std::vector<double> lats, lons;
    for (auto& e : events) { lats.push_back(e.lat); lons.push_back(e.lon); }
    double geo_sd = (stddev(lats) + stddev(lons)) / 2.0;
    // Extremely tight geo = suspicious (bots in one location)
    double geo_score = (geo_sd < 0.01) ? 1.0 : std::max(0.0, 1.0 - geo_sd / 10.0);

    // --- 4. Bot CV detection (inter-click time regularity) ---
    std::vector<double> intervals;
    std::vector<long long> ts;
    for (auto& e : events) ts.push_back(e.timestamp_ms);
    std::sort(ts.begin(), ts.end());
    for (size_t i = 1; i < ts.size(); ++i)
        intervals.push_back((double)(ts[i] - ts[i-1]));
    double iv_mean = mean(intervals);
    double iv_sd   = stddev(intervals);
    // CV close to 0 = perfectly regular = bot
    double cv = (iv_mean > 0) ? iv_sd / iv_mean : 1.0;
    double bot_score = std::max(0.0, 1.0 - cv);

    // --- Composite fraud score (weighted) ---
    double score = 0.30 * std::min(velocity_z / 3.0, 1.0)
                 + 0.30 * ip_score
                 + 0.20 * geo_score
                 + 0.20 * bot_score;

    result.fraud_score   = std::min(score, 1.0);
    result.velocity_z    = velocity_z;
    result.ip_rep_score  = ip_score;
    result.geo_score     = geo_score;
    result.bot_cv_score  = bot_score;
    result.is_fraud      = result.fraud_score > 0.65;
    result.reason        = "";

    if (velocity_z > 2.5)  result.reason += "High click velocity; ";
    if (ip_score   > 0.5)  result.reason += "IP repetition detected; ";
    if (geo_score  > 0.8)  result.reason += "Geographic clustering; ";
    if (bot_score  > 0.7)  result.reason += "Regular inter-click timing (bot-like); ";
    if (result.reason.empty()) result.reason = "No anomalies detected";

    return result;
}
