import os

filepath = 'src/store/modules/useSalesStore.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_add = r"""        // Fetch fully calculated data
        const _invRes = await apiFetch(`/api/docs/single?table=docs_invoices&id=${newInvoice.id}`); const fetchReq = _invRes.ok ? (await _invRes.json()).data : null;"""
new_add = r"""        // Fetch fully calculated data
        const _invRes = await apiFetch(`/api/docs/single?table=docs_invoices&id=${newInvoice.id}`); const fetchReq = _invRes.ok ? (await _invRes.json()).data : null;
        if (fetchReq) {
            const _linesRes = await apiFetch(`/api/docs?table=docs_invoice_lines&limit=1000`);
            if (_linesRes.ok) {
                const _linesData = (await _linesRes.json()).data || [];
                const _myLines = _linesData.filter((l: any) => l.invoice_id === newInvoice.id || l.invoiceid === newInvoice.id);
                const mapLineItem = (l: any) => ({
                    ...l,
                    productId: l.product_id || l.productId,
                    unitPrice: l.unit_price || l.unitPrice,
                    lineValue: l.line_value !== undefined ? l.line_value : l.lineValue,
                    discountMode: l.discount_mode || l.discountMode,
                    discountRate: l.discount_rate || l.discountRate,
                    discountValue: l.discount_value || l.discountValue,
                    serialNumbers: l.serial_numbers || l.serialNumbers,
                    type: l.type
                });
                fetchReq.items = _myLines.map(mapLineItem).sort((a: any, b: any) => (a.display_index ?? 0) - (b.display_index ?? 0));
            }
        }"""
content = content.replace(old_add, new_add)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
