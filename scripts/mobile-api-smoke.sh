#!/bin/bash
#
# End-to-end smoke test for the mobile REST API.
#
#   npm run dev          # in one terminal
#   ./scripts/mobile-api-smoke.sh
#
# Creates throwaway accounts and deletes them again, so it is safe to re-run
# against a development database. Never point it at production.
set -uo pipefail
B="${API_BASE:-http://localhost:3000}/api/mobile/v1"
EMAIL="apitest-$RANDOM@example.com"
pass() { printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { printf "  \033[31m✗\033[0m %s — %s\n" "$1" "$2"; FAILED=1; }
chk() { # name expected_status actual_status body
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "expected $2 got $3: $(echo "$4" | head -c 200)"; fi
}

echo "== auth =="
R=$(curl -s -w "\n%{http_code}" -X POST $B/auth/sign-up -H 'content-type: application/json' -H 'x-device-name: QA iPhone' -d "{\"name\":\"API Test\",\"email\":\"$EMAIL\",\"password\":\"thirtydays2026\"}")
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | sed '$d')
chk "sign-up 201" 201 "$CODE" "$BODY"
TOKEN=$(echo "$BODY" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
[ -n "$TOKEN" ] && pass "token issued" || fail "token issued" "$BODY"

R=$(curl -s -w "\n%{http_code}" -X POST $B/auth/sign-up -H 'content-type: application/json' -d "{\"name\":\"Dup\",\"email\":\"$EMAIL\",\"password\":\"thirtydays2026\"}")
chk "duplicate email 409" 409 "$(echo "$R"|tail -1)" "$R"

R=$(curl -s -w "\n%{http_code}" -X POST $B/auth/sign-in -H 'content-type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"wrongpassword\"}")
chk "bad password 401" 401 "$(echo "$R"|tail -1)" "$R"

echo "== authorization =="
chk "no token 401" 401 "$(curl -s -o /dev/null -w '%{http_code}' $B/today)" ""
chk "bogus token 401" 401 "$(curl -s -o /dev/null -w '%{http_code}' $B/today -H 'authorization: Bearer nope')" ""

echo "== public content =="
chk "onboarding-options 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' $B/onboarding-options)" ""
chk "templates 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' $B/templates)" ""

echo "== state before challenge =="
R=$(curl -s $B/today -H "authorization: Bearer $TOKEN")
echo "$R" | grep -q '"challenge":null' && pass "today reports no challenge" || fail "today no challenge" "$R"

echo "== create challenge =="
TODAY=$(date +%Y-%m-%d)
R=$(curl -s -w "\n%{http_code}" -X POST $B/challenges -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"category\":\"fitness\",\"goal\":\"Become more physically active\",\"whyItMatters\":\"More energy\",\"successDefinition\":\"Walk 30 min 5x a week\",\"availableMinutes\":30,\"obstacles\":[\"motivation\",\"phone\"],\"preferredTime\":\"MORNING\",\"difficulty\":\"BALANCED\",\"startDate\":\"$TODAY\"}")
chk "create challenge 201" 201 "$(echo "$R"|tail -1)" "$R"

echo "== today =="
R=$(curl -s $B/today -H "authorization: Bearer $TOKEN")
python3 - "$R" <<'PY'
import sys, json
d = json.loads(sys.argv[1])
def p(ok, name, extra=""):
    print(f"  \033[32m✓\033[0m {name}" if ok else f"  \033[31m✗\033[0m {name} — {extra}")
p(d.get("dayNumber") == 1, "dayNumber is 1")
p(d["challenge"]["goal"] == "Become more physically active", "goal round-trips")
p(len(d["challenge"]["pillars"]) >= 1, "pillars present")
acts = d["day"]["actions"]
p(len(acts) >= 2, f"{len(acts)} actions", len(acts))
p(all("{m}" not in a["title"] for a in acts), "titles rendered (no {m})")
p(all(a["minimumTitle"] for a in acts if not a["optional"]), "minimum versions present")
p(d["day"]["date"].count("-") == 2 and len(d["day"]["date"]) == 10, "date is yyyy-MM-dd")
p(d["phaseLabel"] == "Consistency", "phase label")
print("ACTION_ID=" + acts[0]["id"])
print("DAY_ID=" + d["day"]["id"])
PY
ACTION_ID=$(python3 -c "import sys,json;d=json.loads(sys.argv[1]);print(d['day']['actions'][0]['id'])" "$R")
DAY_ID=$(python3 -c "import sys,json;d=json.loads(sys.argv[1]);print(d['day']['id'])" "$R")

echo "== mutations =="
chk "complete action 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH $B/actions/$ACTION_ID -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"completed":true}')" ""
R=$(curl -s $B/today -H "authorization: Bearer $TOKEN")
echo "$R" | python3 -c "
import sys,json; d=json.load(sys.stdin)
c=d['day']['completion']
print(f\"  \033[32m✓\033[0m completion persisted {c['completed']}/{c['required']} ({c['percent']}%)\" if c['completed']>=1 else f\"  \033[31m✗\033[0m completion {c}\")"

chk "minimum day 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT $B/days/$DAY_ID/minimum -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"isMinimumDay":true}')" ""
R=$(curl -s $B/today -H "authorization: Bearer $TOKEN")
echo "$R" | python3 -c "
import sys,json; d=json.load(sys.stdin)
day=d['day']
opt=[a for a in day['actions'] if a['optional']]
print(f\"  \033[32m✓\033[0m minimum day active, optional dropped ({len(day['actions'])} actions)\" if day['isMinimumDay'] and not opt else f\"  \033[31m✗\033[0m minimum day {day['isMinimumDay']}\")"
curl -s -o /dev/null -X PUT $B/days/$DAY_ID/minimum -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"isMinimumDay":false}'

chk "priorities 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT $B/days/$DAY_ID/priorities -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"priorities":[{"position":1,"text":"Walk after dinner","completed":false}]}')" ""
chk "reflection 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X PUT $B/days/$DAY_ID/reflection -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"dayFeeling":"GOOD","note":"Felt fine"}')" ""
chk "finish day 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/days/$DAY_ID/finish -H "authorization: Bearer $TOKEN")" ""

echo "== reads =="
chk "progress 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' $B/progress -H "authorization: Bearer $TOKEN")" ""
chk "reviews 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' $B/reviews -H "authorization: Bearer $TOKEN")" ""
chk "day by number 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$B/days?dayNumber=5" -H "authorization: Bearer $TOKEN")" ""
chk "day out of range 404" 404 "$(curl -s -o /dev/null -w '%{http_code}' "$B/days?dayNumber=99" -H "authorization: Bearer $TOKEN")" ""
chk "history 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' $B/challenges -H "authorization: Bearer $TOKEN")" ""
chk "me 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' $B/me -H "authorization: Bearer $TOKEN")" ""

echo "== cross-user isolation =="
E2="other-$RANDOM@example.com"
T2=$(curl -s -X POST $B/auth/sign-up -H 'content-type: application/json' -d "{\"name\":\"Other\",\"email\":\"$E2\",\"password\":\"thirtydays2026\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH $B/actions/$ACTION_ID -H "authorization: Bearer $T2" -H 'content-type: application/json' -d '{"completed":true}')
[ "$CODE" = "404" ] && pass "other user cannot touch action (404)" || fail "cross-user isolation" "got $CODE"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PUT $B/days/$DAY_ID/minimum -H "authorization: Bearer $T2" -H 'content-type: application/json' -d '{"isMinimumDay":true}')
[ "$CODE" = "404" ] && pass "other user cannot touch day (404)" || fail "cross-user day isolation" "got $CODE"

echo "== forgot password =="
chk "forgot-password 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/forgot-password -H 'content-type: application/json' -d "{\"email\":\"$EMAIL\"}")" ""
chk "forgot-password unknown email also 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/forgot-password -H 'content-type: application/json' -d '{"email":"nobody-here@example.com"}')" ""

echo "== account deletion =="
chk "delete wrong password 403" 403 "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE $B/account -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"password":"nope"}')" ""
chk "delete correct password 200" 200 "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE $B/account -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"password":"thirtydays2026"}')" ""
chk "token revoked after deletion 401" 401 "$(curl -s -o /dev/null -w '%{http_code}' $B/today -H "authorization: Bearer $TOKEN")" ""

echo "== sign-out =="
T3=$(curl -s -X POST $B/auth/sign-in -H 'content-type: application/json' -d "{\"email\":\"$E2\",\"password\":\"thirtydays2026\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s -o /dev/null -X POST $B/auth/sign-out -H "authorization: Bearer $T3"
chk "token dead after sign-out 401" 401 "$(curl -s -o /dev/null -w '%{http_code}' $B/me -H "authorization: Bearer $T3")" ""

curl -s -o /dev/null -X DELETE $B/account -H "authorization: Bearer $T2" -H 'content-type: application/json' -d '{"password":"thirtydays2026"}'
echo
[ -n "$FAILED" ] && echo "SOME CHECKS FAILED" || echo "ALL API CHECKS PASSED"
