# API & Statement Data Conventions

## 1. Statement JSON Schema
Every statement document adheres to the normalized schema:

```json
{
  "id": "string",
  "version": 1,
  "bank": "Kotak Mahindra Bank | HDFC Bank",
  "account": {
    "bank": "Kotak Mahindra Bank | HDFC Bank",
    "holderName": "string",
    "title": "Mr | Ms | Dr",
    "customerId": "string",
    "address": "string",
    "city": "string",
    "pinCode": "string",
    "state": "string",
    "country": "India",
    "accountNumber": "string",
    "accountType": "Savings | Current",
    "branch": "string",
    "accountStatus": "Active | Regular",
    "nomination": "Yes | No | Not Registered",
    "currency": "INR",
    "micr": "string",
    "ifsc": "string",
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "openingBalance": "string (decimal e.g. 5713.62)"
  },
  "transactions": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "valueDate": "YYYY-MM-DD",
      "description": "string",
      "reference": "string",
      "amount": "string (decimal)",
      "type": "debit | credit"
    }
  ]
}
```

## 2. Normalization Rule
Legacy or raw imported statements must always pass through `normalizeStatement(raw)` in `app/lib/model.js` before being handed to the application state or `compute()`.
