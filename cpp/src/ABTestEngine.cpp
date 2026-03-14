/**
 * ABTestEngine.cpp
 * Statistical significance calculator for A/B testing ad campaigns
 * Uses Welch's t-test with Lanczos gamma approximation for p-value computation
 */

#include <cmath>
#include <stdexcept>
#include <string>
#include "../include/ABTestEngine.h"

// Lanczos approximation coefficients (g=7, n=9)
static const double LANCZOS_G = 7.0;
static const double LANCZOS_COEF[] = {
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
};

double ABTestEngine::lgamma_lanczos(double z) {
    if (z < 0.5) {
        return std::log(M_PI / std::sin(M_PI * z)) - lgamma_lanczos(1.0 - z);
    }
    z -= 1.0;
    double x = LANCZOS_COEF[0];
    for (int i = 1; i < 9; ++i) {
        x += LANCZOS_COEF[i] / (z + i);
    }
    double t = z + LANCZOS_G + 0.5;
    return 0.5 * std::log(2 * M_PI) + (z + 0.5) * std::log(t) - t + std::log(x);
}

// Regularized incomplete beta function via Lentz's continued fraction
double ABTestEngine::betacf(double a, double b, double x) {
    const int MAX_ITER = 200;
    const double EPS = 3.0e-7;
    const double FPMIN = 1.0e-30;

    double qab = a + b;
    double qap = a + 1.0;
    double qam = a - 1.0;
    double c = 1.0;
    double d = 1.0 - qab * x / qap;
    if (std::abs(d) < FPMIN) d = FPMIN;
    d = 1.0 / d;
    double h = d;

    for (int m = 1; m <= MAX_ITER; ++m) {
        int m2 = 2 * m;
        double aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1.0 + aa * d;
        if (std::abs(d) < FPMIN) d = FPMIN;
        c = 1.0 + aa / c;
        if (std::abs(c) < FPMIN) c = FPMIN;
        d = 1.0 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1.0 + aa * d;
        if (std::abs(d) < FPMIN) d = FPMIN;
        c = 1.0 + aa / c;
        if (std::abs(c) < FPMIN) c = FPMIN;
        d = 1.0 / d;
        double del = d * c;
        h *= del;
        if (std::abs(del - 1.0) < EPS) break;
    }
    return h;
}

double ABTestEngine::ibeta(double a, double b, double x) {
    if (x < 0.0 || x > 1.0) throw std::invalid_argument("x must be in [0,1]");
    if (x == 0.0 || x == 1.0) return x;
    double lbeta = lgamma_lanczos(a) + lgamma_lanczos(b) - lgamma_lanczos(a + b);
    double front = std::exp(std::log(x) * a + std::log(1.0 - x) * b - lbeta) / a;
    if (x < (a + 1.0) / (a + b + 2.0)) {
        return front * betacf(a, b, x);
    } else {
        return 1.0 - front * betacf(b, a, 1.0 - x);
    }
}

ABTestResult ABTestEngine::run(const ABTestInput& input) {
    if (input.n_a == 0 || input.n_b == 0)
        throw std::invalid_argument("Sample sizes must be > 0");

    double rate_a = (double)input.conv_a / input.n_a;
    double rate_b = (double)input.conv_b / input.n_b;

    // Pooled variance for each group
    double var_a = rate_a * (1.0 - rate_a) / input.n_a;
    double var_b = rate_b * (1.0 - rate_b) / input.n_b;

    double se = std::sqrt(var_a + var_b);
    if (se == 0.0) {
        ABTestResult r;
        r.t_stat = 0; r.p_value = 1.0; r.significant = false;
        r.lift = 0; r.ci_lower = 0; r.ci_upper = 0;
        return r;
    }

    // Welch's t-statistic
    double t = (rate_b - rate_a) / se;

    // Welch-Satterthwaite degrees of freedom
    double df = (var_a + var_b) * (var_a + var_b) /
                ((var_a * var_a) / (input.n_a - 1) + (var_b * var_b) / (input.n_b - 1));

    // Two-tailed p-value using incomplete beta
    double x = df / (df + t * t);
    double p_value = ibeta(df / 2.0, 0.5, x);

    // 95% confidence interval for lift
    double z95 = 1.96;
    double lift = (rate_a > 0) ? (rate_b - rate_a) / rate_a * 100.0 : 0.0;

    ABTestResult result;
    result.t_stat = t;
    result.p_value = p_value;
    result.significant = p_value < 0.05;
    result.lift = lift;
    result.ci_lower = (rate_b - rate_a) - z95 * se;
    result.ci_upper = (rate_b - rate_a) + z95 * se;
    result.winner = (result.significant) ? (rate_b > rate_a ? "B" : "A") : "No winner";
    return result;
}
