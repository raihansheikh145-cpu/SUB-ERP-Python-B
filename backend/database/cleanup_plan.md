# `data` JSONB Cleanup — Implementation Plan

## সমস্যা

`docs_invoices`, `docs_bills`, `docs_payments`, `docs_journals` — এই ৪টি টেবিলের `data jsonb` column-এ **৫০-৬৫টি duplicate field** আছে যেগুলো individual columns-এও রয়েছে।

## Frontend কিভাবে কাজ করে

```js
// useSalesStore.ts pattern:
{ ...(row.data || {}), ...row }
//   ↑ data থেকে নেয়     ↑ column দিয়ে override করে
```

মানে: **individual columns সবসময় জেতে**। `data` থেকে শুধু এমন fields নেওয়া হয় যেগুলো আলাদা column-এ নেই।

## কোন fields গুরুত্বপূর্ণ (রাখতে হবে)

| Table | `data` তে রাখব | কারণ |
|-------|---------------|------|
| `docs_invoices` | `items`, `messages` | Items = invoice line details (frontend এখানে থেকে পড়ে edit-এর সময়), Messages = chat/history |
| `docs_bills` | `items` | Same as invoice |
| `docs_payments` | `appliedInvoices`, `appliedBills` | Array of applied records |
| `docs_journals` | `lines` | Journal line details |

## Cleanup SQL Strategy

```sql
-- শুধু নির্দিষ্ট keys রাখব, বাকি সব remove করব:
UPDATE docs_invoices
SET data = data - ARRAY[
  'id','status','total','subtotal','date','customerId',
  'companyId','invoiceNumber','reference', ... (65 keys)
];
```

## ⚠️ Risk Analysis

| Risk | Status |
|------|--------|
| Frontend ভাঙবে? | ✅ না — individual columns দিয়ে override হয় |
| `items` হারাবে? | ✅ না — explicitly রাখব |
| `messages` হারাবে? | ✅ না — explicitly রাখব |
| post_invoice ফাংশন? | ✅ OK — সে `data` থেকে `items` পড়ে, সেটা থাকবে |
| Rollback possible? | ✅ হ্যাঁ — data.sql backup আছে |

## Steps

1. ✅ Analyze JSON keys (done)
2. [ ] Migration SQL লিখুন
3. [ ] Database-এ apply করুন
4. [ ] Frontend test করুন
5. [ ] schema.sql ও data.sql regenerate করুন
