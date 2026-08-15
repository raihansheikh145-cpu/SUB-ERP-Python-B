import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.db import prisma
import uvicorn
from app.api.routers import (
    auth, account, contact, inventory, bill, invoice, 
    journal, payment, loan, credit_note, document, settings, product, company, users, docs
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await prisma.connect()
    yield
    # Shutdown
    await prisma.disconnect()

app = FastAPI(lifespan=lifespan, title="ERP Backend API")

# Setup CORS
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "details": str(exc)},
    )

# Mount API routes
app.include_router(auth.router, prefix="/api/auth")
app.include_router(account.router, prefix="/api/accounts")
app.include_router(contact.router, prefix="/api/contacts")
app.include_router(inventory.router, prefix="/api/inventory")
app.include_router(bill.router, prefix="/api/bills")
app.include_router(invoice.router, prefix="/api/invoices")
app.include_router(journal.router, prefix="/api/journals")
app.include_router(payment.router, prefix="/api/payments")
app.include_router(loan.router, prefix="/api/loans")
app.include_router(credit_note.router, prefix="/api/credit-notes")
app.include_router(document.router, prefix="/api/documents")
app.include_router(settings.router, prefix="/api/settings")
app.include_router(users.router, prefix="/api/users")
from app.api.routers.product import router as product_router
app.include_router(product_router, prefix="/api/products")
app.include_router(company.router, prefix="/api/companies")
app.include_router(docs.router, prefix="/api/docs")
from app.api.routers.reports import router as reports_router
app.include_router(reports_router, prefix="/api/reports")

@app.get("/api/test-db")
async def health_check():
    return {"status": "ok"}

# Serve static files and fallback to index.html for SPA
# In production, distPath would be the compiled Vite frontend
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dist")

if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Prevent API routes from falling back to index.html
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"error": "API route not found"})
        
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "API is running. Frontend dist folder not found."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
