from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, results, leaderboard, words


@asynccontextmanager
async def lifespan(app):
    # Create all tables on startup
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created")
    except Exception as e:
        print(f"⚠ Could not connect to database: {e}")
        print("  Update backend/.env with your MySQL credentials")
    yield


app = FastAPI(
    title="Retro Type API",
    description="Backend for the Retro Type typing speed test app",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(results.router)
app.include_router(leaderboard.router)
app.include_router(words.router)


@app.get("/")
def root():
    return {"message": "Retro Type API is running", "docs": "/docs"}
