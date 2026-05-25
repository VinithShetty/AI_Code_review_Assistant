#!/bin/bash
# AI Code Review Assistant - Test Webhooks Script
# Usage: ./scripts/test_webhooks.sh

WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/api/webhooks/github}"
WEBHOOK_SECRET="${GITHUB_WEBHOOK_SECRET:-test-webhook-secret}"

echo "🧪 Testing GitHub Webhook Handler..."
echo "URL: $WEBHOOK_URL"
echo ""

# Function to compute HMAC-SHA256 signature
compute_signature() {
  echo -n "$1" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //'
}

# Test 1: Pull Request Opened Event
echo "📝 Test 1: Pull Request Opened Event"
PAYLOAD='{"action":"opened","number":42,"pull_request":{"number":42,"title":"Add new authentication middleware","body":"This PR adds a new authentication middleware for the API gateway.","user":{"login":"testuser","avatar_url":"https://github.com/images/error/testuser_happy.gif"},"base":{"ref":"main","sha":"abc123"},"head":{"ref":"feature/auth-middleware","sha":"def456"},"created_at":"2024-01-15T10:30:00Z","updated_at":"2024-01-15T10:30:00Z"},"repository":{"id":12345,"full_name":"test-org/test-repo","name":"test-repo","owner":{"login":"test-org"},"private":false}}'

SIGNATURE="sha256=$(compute_signature "$PAYLOAD")"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

# Test 2: Pull Request Synchronize Event
echo "📝 Test 2: Pull Request Synchronize Event"
PAYLOAD='{"action":"synchronize","number":42,"pull_request":{"number":42,"title":"Add new authentication middleware","user":{"login":"testuser"},"base":{"ref":"main"},"head":{"ref":"feature/auth-middleware"}},"repository":{"id":12345,"full_name":"test-org/test-repo","name":"test-repo"}}'

SIGNATURE="sha256=$(compute_signature "$PAYLOAD")"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

# Test 3: Invalid Signature
echo "📝 Test 3: Invalid Signature (should be rejected)"
PAYLOAD='{"action":"opened","number":99,"pull_request":{"number":99,"title":"Malicious PR","user":{"login":"attacker"}},"repository":{"id":99999,"full_name":"evil/repo"}}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: sha256=invalid_signature" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

echo "  Status: $HTTP_CODE (expected: 401 or 403)"
echo ""

# Test 4: Non-PR Event (should be acknowledged but not processed)
echo "📝 Test 4: Push Event (should be acknowledged)"
PAYLOAD='{"ref":"refs/heads/main","before":"abc123","after":"def456","repository":{"id":12345,"full_name":"test-org/test-repo"}}'

SIGNATURE="sha256=$(compute_signature "$PAYLOAD")"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "  Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

echo "✅ Webhook tests complete!"
