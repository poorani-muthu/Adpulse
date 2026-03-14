#pragma once
#include <string>

struct ABTestInput {
    int n_a;      // visitors in control group
    int conv_a;   // conversions in control
    int n_b;      // visitors in variant group
    int conv_b;   // conversions in variant
};

struct ABTestResult {
    double t_stat;
    double p_value;
    bool significant;
    double lift;        // % improvement of B over A
    double ci_lower;    // 95% CI lower bound (absolute diff)
    double ci_upper;    // 95% CI upper bound
    std::string winner;
};

class ABTestEngine {
public:
    static ABTestResult run(const ABTestInput& input);
private:
    static double lgamma_lanczos(double z);
    static double betacf(double a, double b, double x);
    static double ibeta(double a, double b, double x);
};
