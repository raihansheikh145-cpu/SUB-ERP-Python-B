from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import date

class InvoiceLineCreate(BaseModel):
    id: Optional[str] = None
    product_id: Optional[str] = Field(None, alias="productId")
    quantity: float = 0.0
    unit_price: float = Field(0.0, alias="unitPrice")
    discount: float = 0.0
    discount_amount: float = Field(0.0, alias="discountAmount") # Sometimes sent from frontend
    discount_rate: float = Field(0.0, alias="discountRate")
    discount_mode: str = Field("PERCENT", alias="discountMode")
    tax: float = 0.0
    tax_rate: float = Field(0.0, alias="taxRate")
    tax_value: float = Field(0.0, alias="taxValue")
    total: float = 0.0
    line_value: float = Field(0.0, alias="lineValue")
    description: Optional[str] = None
    type: str = "PRODUCT"
    uom: Optional[str] = None
    display_description: Optional[str] = Field(None, alias="displayDescription")
    serial_numbers: List[Any] = Field(default_factory=list, alias="serialNumbers")
    display_index: int = Field(0, alias="displayIndex")

class InvoiceCreate(BaseModel):
    id: Optional[str] = None
    invoice_number: Optional[str] = Field(None, alias="invoiceNumber")
    company_id: str = Field(..., alias="companyId")
    date: date
    invoice_date: Optional[date] = Field(None, alias="invoiceDate")
    due_date: Optional[date] = Field(None, alias="dueDate")
    customer_id: Optional[str] = Field(None, alias="customerId")
    contact_id: Optional[str] = Field(None, alias="contactId") # Fallback for customerId
    status: str = "DRAFT"
    created_by_id: Optional[str] = Field(None, alias="createdById")
    
    # These totals might be sent by frontend, but we will re-calculate in backend
    subtotal: float = 0.0
    tax_total: float = Field(0.0, alias="taxTotal")
    discount_total: float = Field(0.0, alias="discountTotal")
    total: float = 0.0
    
    reference: Optional[str] = None
    salesperson: Optional[str] = None
    customer_note: Optional[str] = Field(None, alias="customerNote")
    delivery_person: Optional[str] = Field(None, alias="deliveryPerson")
    
    items: List[InvoiceLineCreate] = []
    messages: List[Any] = []
