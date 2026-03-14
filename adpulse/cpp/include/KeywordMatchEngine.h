#pragma once
#include <string>

enum class MatchType { EXACT, PHRASE, BROAD };

struct MatchResult {
    bool matched;
    MatchType match_type;
    std::string keyword;
    std::string query;
    double relevance_score; // 0.0 - 1.0
};

class KeywordMatchEngine {
public:
    static MatchResult match(const std::string& keyword,
                             const std::string& query,
                             MatchType type);
    static double computeRelevance(const std::string& keyword,
                                   const std::string& query);
};
