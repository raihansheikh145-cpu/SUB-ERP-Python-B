function mapDatabaseRowToFrontend(row) {
  if (!row) return row;
  const { company_id, ...rest } = row;
    const mappedNumber = rest.invoice_number || rest.bill_number || rest.payment_number ||                        rest.credit_note_number || rest.cn_number || rest.loan_number;
    if ((!rest.messages || rest.messages.length === 0) && rest.data && rest.data.messages) {
      rest.messages = rest.data.messages;
  }
  return {
    ...(rest.data || {}),
    ...rest,
    id: row.id,
    companyId: company_id || row.companyId,
    customerId: rest.customer_id || rest.customerId || null,
    vendorId: rest.vendor_id || rest.vendorId || null,
    costPrice: rest.cost_price !== undefined ? Number(rest.cost_price) : (rest.costPrice ? Number(rest.costPrice) : 0),
    price: rest.price !== undefined ? Number(rest.price) : (rest.price ? Number(rest.price) : 0),
    total: rest.total !== undefined ? Number(rest.total) : 0,
    subtotal: rest.subtotal !== undefined ? Number(rest.subtotal) : 0,
    number: mappedNumber || rest.number || null,
  };
}

const row = {
    "id": "a9e29104-e7dc-4a8a-96f9-d4a8e1b0a5cb",
    "data": {
      "messages": [
        {
          "id": "9c6ac991-bd53-4aa7-9588-b81871cfa28f",
          "body": "Invoice created",
          "date": "Jul 19, 2026, 11:10:33 AM",
          "type": "notification",
          "authorId": "user-1780547951100"
        }
      ]
    },
    "messages": []
};

console.log(JSON.stringify(mapDatabaseRowToFrontend(row), null, 2));
