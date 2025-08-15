# cURL Tests for ARC Mentor Webhooks

Use the following commands to manually test the webhook endpoints once your n8n (and optionally Make.com) instances are configured. Replace `${N8N_BASE_URL}` and `${MAKE_BASE_URL}` with your actual base URLs. Dates are given in ISO format and assume the Europe/Amsterdam timezone.

```bash
# Test calendar sync
curl -X POST ${N8N_BASE_URL}/calendar-sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo","dateFrom":"2025-08-16","dateTo":"2025-08-23"}'

# Test create events
curl -X POST ${N8N_BASE_URL}/create-events \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo","quests":[{"id":"q1","title":"Test","xp":10,"gold":5}]}'

# Test coach (Make scenario). If MAKE_BASE_URL is unset, use N8N_BASE_URL instead
curl -X POST ${MAKE_BASE_URL:-$N8N_BASE_URL}/coach \
  -H "Content-Type: application/json" \
  -d '{"stats":{"hp":100,"xp":0},"freeSlots":[{"start":"2025-08-16T18:00:00+02:00","end":"2025-08-16T19:00:00+02:00"}],"recentFails":[]}'
```

These commands should return JSON responses corresponding to each endpoint. The current date is 2025-08-15, so the test dates fall in the upcoming week.
