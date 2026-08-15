from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import date

class BillLineCreate(BaseModel):
    id: Optional[str] = None
    product_id: Optional[str] = Field(None, alias="productId")
    quantity: float = 0.0
    unit_price: float = Field(0.0, alias="unitPrice")
    discount: float = 0.0
    discount_amount: float = Field(0.0, alias="discountAmount")
    discount_rate: float = Field(0.0, alias="discountRate")
    discount_mode: str = Field("PERCENT", alias="discountMode")
    tax: float = 0.0
    tax_rate: float = Field(0.0, alias="taxRate")
    tax_value: float = Field(0.0, alias="taxValue")
    total: float = 0.0
    line_value: float = Field(0.0, alias="lineValue")
    description: Optional[str] = None
    type: str = "PRODUCT"
    serial_numbers: List[Any] = Field(default_factory=list, alias="serialNumbers")
    display_index: int = Field(0, alias="displayIndex")

class BillCreate(BaseModel):
    id: Optional[str] = None
    bill_number: Optional[str] = Field(None, alias="billNumber")
    company_id: str = Field(..., alias="companyId")
    date: date
    bill_date: Optional[date] = Field(None, alias="billDate")
    due_date: Optional[date] = Field(None, alias="dueDate")
    vendor_id: Optional[str] = Field(None, alias="vendorId")
    contact_id: Optional[str] = Field(None, alias="contactId")
    status: str = "DRAFT"
    created_by_id: Optional[str] = Field(None, alias="createdById")
    
    subtotal: float = 0.0
    tax_total: float = Field(0.0, alias="taxTotal")
    discount_total: float = Field(0.0, alias="discountTotal")
    total: float = 0.0
    
    reference: Optional[str] = None
    salesperson: Optional[str] = None
    customer_note: Optional[str] = Field(None, alias="customerNote")
    delivery_person: Optional[str] = Field(None, alias="deliveryPerson")
    
    items: List[BillLineCreate] = []
    messages: List[Any] = []
