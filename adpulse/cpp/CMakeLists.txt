cmake_minimum_required(VERSION 3.14)
project(AdPulseCPP VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
FetchContent_MakeAvailable(googletest)

include_directories(include)

add_library(engines STATIC
  src/ABTestEngine.cpp
  src/KeywordMatchEngine.cpp
  src/ClickFraudDetector.cpp
)

add_executable(run_tests tests/engine_tests.cpp)
target_link_libraries(run_tests engines GTest::gtest_main)

include(GoogleTest)
gtest_discover_tests(run_tests)
