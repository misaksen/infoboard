#!/bin/bash

echo "=== Infoboard API Test Suite ==="
echo

BASE_URL="http://localhost:3000"
TOKEN=""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - $2"
  else
    echo -e "${RED}✗ FAIL${NC} - $2"
  fi
}

# Test 1: Health check
echo "Test 1: Health Check"
response=$(curl -s $BASE_URL/api/public/health)
echo "Response: $response"
test_result $? "Health endpoint responds"
echo

# Test 2: Login
echo "Test 2: Admin Login"
response=$(curl -s -X POST $BASE_URL/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "Response: $response"
TOKEN=$(echo $response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "******" ]; then
  test_result 0 "Login successful, token obtained"
else
  test_result 1 "Login failed or token not obtained"
  echo "Token: $TOKEN"
fi
echo

# Test 3: Get posts (admin)
echo "Test 3: Get Posts (Admin)"
response=$(curl -s $BASE_URL/api/admin/posts \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $response"
test_result $? "Get posts endpoint responds"
echo

# Test 4: Get active posts (public)
echo "Test 4: Get Active Posts (Public)"
response=$(curl -s $BASE_URL/api/public/posts/active)
echo "Response: $response"
test_result $? "Get active posts endpoint responds"
echo

# Test 5: Create post
echo "Test 5: Create Post"
START=$(date -u '+%Y-%m-%dT%H:%M:%S' -d '-5 minutes')
END=$(date -u '+%Y-%m-%dT%H:%M:%S' -d '+5 hours')
response=$(curl -s -X POST $BASE_URL/api/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Post $(date +%s)" \
  -F "content=This is a test post" \
  -F "startTime=$START" \
  -F "endTime=$END")
echo "Response: $response"
test_result $? "Create post endpoint responds"
POST_ID=$(echo $response | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Created post ID: $POST_ID"
echo

# Test 6: Get specific post
if [ -n "$POST_ID" ]; then
  echo "Test 6: Get Specific Post"
  response=$(curl -s $BASE_URL/api/admin/posts/$POST_ID \
    -H "Authorization: Bearer $TOKEN")
  echo "Response: $response"
  test_result $? "Get specific post endpoint responds"
  echo
fi

# Test 7: Frontend pages
echo "Test 7: Display Page"
response=$(curl -s $BASE_URL/ | head -c 100)
test_result $? "Display page loads"
echo

echo "Test 8: Admin Page"
response=$(curl -s $BASE_URL/admin | head -c 100)
test_result $? "Admin page loads"
echo

echo "=== Test Suite Complete ==="
