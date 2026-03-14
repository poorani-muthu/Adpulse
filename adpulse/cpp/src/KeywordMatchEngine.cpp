/**
 * KeywordMatchEngine.cpp
 * Google Ads-style keyword matching: Exact, Phrase, Broad match types
 * Includes Porter Stemmer and stop-word filtering
 */

#include <algorithm>
#include <sstream>
#include <set>
#include <vector>
#include <string>
#include "../include/KeywordMatchEngine.h"

// ---- Stop words ----
static const std::set<std::string> STOP_WORDS = {
    "a","an","the","and","or","but","in","on","at","to","for",
    "of","with","by","from","is","are","was","were","be","been"
};

// ---- Porter Stemmer (subset of rules) ----
static std::string porter_stem(std::string word) {
    // Step 1a
    if (word.size() > 4 && word.substr(word.size()-4) == "sses") word = word.substr(0, word.size()-2);
    else if (word.size() > 3 && word.substr(word.size()-3) == "ies") word = word.substr(0, word.size()-2);
    else if (word.size() > 2 && word.back() == 's' && word[word.size()-2] != 's') word.pop_back();
    // Step 1b
    if (word.size() > 3 && word.substr(word.size()-3) == "ing") word = word.substr(0, word.size()-3);
    else if (word.size() > 2 && word.substr(word.size()-2) == "ed") word = word.substr(0, word.size()-2);
    // Step 2
    if (word.size() > 5 && word.substr(word.size()-5) == "ation") word = word.substr(0, word.size()-3) + "e";
    return word;
}

static std::vector<std::string> tokenize(const std::string& text, bool stem = false) {
    std::istringstream ss(text);
    std::string token;
    std::vector<std::string> tokens;
    while (ss >> token) {
        std::transform(token.begin(), token.end(), token.begin(), ::tolower);
        // Remove punctuation
        token.erase(std::remove_if(token.begin(), token.end(), ::ispunct), token.end());
        if (token.empty() || STOP_WORDS.count(token)) continue;
        if (stem) token = porter_stem(token);
        tokens.push_back(token);
    }
    return tokens;
}

MatchResult KeywordMatchEngine::match(const std::string& keyword,
                                       const std::string& query,
                                       MatchType type) {
    MatchResult result;
    result.matched = false;
    result.match_type = type;
    result.keyword = keyword;
    result.query = query;

    switch (type) {
        case MatchType::EXACT: {
            // Exact: query must equal keyword (after normalization)
            auto kw = tokenize(keyword);
            auto q  = tokenize(query);
            result.matched = (kw == q);
            break;
        }
        case MatchType::PHRASE: {
            // Phrase: query must contain keyword tokens in order
            auto kw = tokenize(keyword);
            auto q  = tokenize(query);
            if (kw.size() > q.size()) { result.matched = false; break; }
            for (size_t i = 0; i <= q.size() - kw.size(); ++i) {
                bool ok = true;
                for (size_t j = 0; j < kw.size(); ++j) {
                    if (q[i+j] != kw[j]) { ok = false; break; }
                }
                if (ok) { result.matched = true; break; }
            }
            break;
        }
        case MatchType::BROAD: {
            // Broad: stemmed keyword tokens are subset of stemmed query tokens
            auto kw = tokenize(keyword, true);
            auto q  = tokenize(query, true);
            std::set<std::string> q_set(q.begin(), q.end());
            result.matched = true;
            for (auto& k : kw) {
                if (!q_set.count(k)) { result.matched = false; break; }
            }
            break;
        }
    }
    result.relevance_score = result.matched ? computeRelevance(keyword, query) : 0.0;
    return result;
}

double KeywordMatchEngine::computeRelevance(const std::string& keyword,
                                             const std::string& query) {
    auto kw = tokenize(keyword, true);
    auto q  = tokenize(query, true);
    if (q.empty()) return 0.0;
    std::set<std::string> kw_set(kw.begin(), kw.end());
    int hits = 0;
    for (auto& t : q) if (kw_set.count(t)) hits++;
    // Jaccard-like score
    std::set<std::string> q_set(q.begin(), q.end());
    std::set<std::string> union_set = kw_set;
    union_set.insert(q_set.begin(), q_set.end());
    return union_set.empty() ? 0.0 : (double)hits / union_set.size();
}
