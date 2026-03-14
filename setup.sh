#!/bin/bash
# AdPulse — One-command project setup
# Usage: bash setup.sh
set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ___       _ ____        _          "
echo " / _ \   __| |  _ \ _   _| |___  ___ "
echo "| | | | / _\` | |_) | | | | / __|/ _ \\"
echo "| |_| || (_| |  __/| |_| | \__ \  __/"
echo " \___/  \__,_|_|    \__,_|_|___/\___|"
echo -e "${NC}"
echo -e "${GREEN}AdPulse — Full Stack Google Ads Analytics Platform${NC}"
echo ""

# Check prerequisites
command -v node  >/dev/null 2>&1 || { echo "❌ Node.js required. Install from https://nodejs.org"; exit 1; }
command -v java  >/dev/null 2>&1 || { echo "❌ Java 17+ required. Install from https://adoptium.net"; exit 1; }
command -v mvn   >/dev/null 2>&1 || { echo "❌ Maven required. Install from https://maven.apache.org"; exit 1; }
command -v cmake >/dev/null 2>&1 || echo -e "${YELLOW}⚠  cmake not found — C++ tests will be skipped${NC}"

echo -e "${CYAN}[1/4] Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..

echo -e "${CYAN}[2/4] Building backend...${NC}"
cd backend && mvn package -DskipTests -q && cd ..

echo -e "${CYAN}[3/4] Running backend tests...${NC}"
cd backend && mvn test -q 2>&1 | tail -5 && cd ..

echo -e "${CYAN}[4/4] Running frontend tests...${NC}"
cd frontend && npm test 2>&1 | tail -10 && cd ..

# C++ tests (optional)
if command -v cmake >/dev/null 2>&1 && command -v g++ >/dev/null 2>&1; then
  echo -e "${CYAN}[+] Building C++ engines and running Google Tests...${NC}"
  cd cpp && cmake -B build -DCMAKE_BUILD_TYPE=Release -q && cmake --build build -q && ./build/run_tests && cd ..
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "  Start frontend: cd frontend && npm run dev"
echo "  Start backend:  cd backend && java -jar target/adpulse-backend-1.0.0.jar"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8080"
echo "  H2 Console: http://localhost:8080/h2-console"
echo ""
echo "  Demo login: admin / admin123 (full access)"
echo "              viewer / viewer123 (read-only)"
