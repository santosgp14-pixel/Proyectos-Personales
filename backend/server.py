from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create indexes
async def setup_indexes():
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.couples.create_index([("code", ASCENDING)], unique=True)
    await db.activities.create_index([("giver_id", ASCENDING)])
    await db.activities.create_index([("receiver_id", ASCENDING)])
    await db.moods.create_index([("user_id", ASCENDING), ("date", ASCENDING)])

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="LoveActs V2.0 API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ActivityCategory(str, Enum):
    FISICO = "físico"
    EMOCIONAL = "emocional"
    PRACTICO = "práctico"
    GENERAL = "general"

class MoodEmoji(str, Enum):
    VERY_SAD = "😢"
    SAD = "😔"
    NEUTRAL = "😐"
    HAPPY = "😊"
    VERY_HAPPY = "🥰"

class AchievementType(str, Enum):
    FIRST_ACTIVITY = "first_activity"
    TEN_ACTIVITIES = "ten_activities"
    FIRST_FIVE_STARS = "first_five_stars"
    FIVE_FIVE_STARS = "five_five_stars"
    DAILY_MOOD_WEEK = "daily_mood_week"
    PARTNER_LINKED = "partner_linked"

# Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password_hash: str
    partner_code: Optional[str] = None
    partner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    partner_code: Optional[str] = None
    has_partner: bool = False
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CoupleCreate(BaseModel):
    code: str

class Couple(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    user1_id: str
    user2_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityCreate(BaseModel):
    title: str
    description: str
    category: ActivityCategory
    receiver_id: str

class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: ActivityCategory
    giver_id: str
    receiver_id: str
    rating: Optional[int] = None
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rated_at: Optional[datetime] = None

class ActivityRating(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class MoodCreate(BaseModel):
    mood_emoji: MoodEmoji
    note: Optional[str] = None

class Mood(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood_emoji: MoodEmoji
    note: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    achievement_type: AchievementType
    title: str
    description: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)

class DashboardStats(BaseModel):
    total_activities_given: int
    total_activities_received: int
    average_rating_given: float
    average_rating_received: float
    current_streak: int
    achievements_count: int
    pending_ratings: int

# Helper functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_partner_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                continue  # Skip MongoDB _id field
            result[key] = serialize_doc(value)
        return result
    return doc

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

async def check_achievements(user_id: str):
    """Check and unlock new achievements for user"""
    
    # Get user's current achievements
    current_achievements = await db.achievements.find({"user_id": user_id}).to_list(None)
    current_types = {ach["achievement_type"] for ach in current_achievements}
    
    # Check first activity
    if AchievementType.FIRST_ACTIVITY not in current_types:
        activity_count = await db.activities.count_documents({"giver_id": user_id})
        if activity_count >= 1:
            achievement = Achievement(
                user_id=user_id,
                achievement_type=AchievementType.FIRST_ACTIVITY,
                title="¡Primera Actividad!",
                description="Registraste tu primera actividad de amor"
            )
            await db.achievements.insert_one(achievement.dict())
    
    # Check ten activities
    if AchievementType.TEN_ACTIVITIES not in current_types:
        activity_count = await db.activities.count_documents({"giver_id": user_id})
        if activity_count >= 10:
            achievement = Achievement(
                user_id=user_id,
                achievement_type=AchievementType.TEN_ACTIVITIES,
                title="¡Amante Dedicado!",
                description="Has registrado 10 actividades de amor"
            )
            await db.achievements.insert_one(achievement.dict())
    
    # Check first five stars
    if AchievementType.FIRST_FIVE_STARS not in current_types:
        five_star_count = await db.activities.count_documents({"giver_id": user_id, "rating": 5})
        if five_star_count >= 1:
            achievement = Achievement(
                user_id=user_id,
                achievement_type=AchievementType.FIRST_FIVE_STARS,
                title="⭐ Primera Estrella Dorada",
                description="Recibiste tu primera calificación de 5 estrellas"
            )
            await db.achievements.insert_one(achievement.dict())
    
    # Check five five-stars
    if AchievementType.FIVE_FIVE_STARS not in current_types:
        five_star_count = await db.activities.count_documents({"giver_id": user_id, "rating": 5})
        if five_star_count >= 5:
            achievement = Achievement(
                user_id=user_id,
                achievement_type=AchievementType.FIVE_FIVE_STARS,
                title="⭐ Maestro del Amor",
                description="Has obtenido 5 calificaciones de 5 estrellas"
            )
            await db.achievements.insert_one(achievement.dict())

# Auth endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = hash_password(user_data.password)
    partner_code = generate_partner_code()
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=password_hash,
        partner_code=partner_code
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        partner_code=user.partner_code,
        has_partner=False,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        partner_code=user["partner_code"],
        has_partner=user.get("partner_id") is not None,
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        partner_code=current_user.partner_code,
        has_partner=current_user.partner_id is not None,
        created_at=current_user.created_at
    )

# Couples endpoints
@api_router.post("/couples/link-partner")
async def link_partner(couple_data: CoupleCreate, current_user: User = Depends(get_current_user)):
    if current_user.partner_id:
        raise HTTPException(status_code=400, detail="Already have a partner")
    
    # Find partner by code
    partner = await db.users.find_one({"partner_code": couple_data.code})
    if not partner:
        raise HTTPException(status_code=404, detail="Invalid partner code")
    
    if partner["id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot link to yourself")
    
    if partner.get("partner_id"):
        raise HTTPException(status_code=400, detail="Partner already linked to someone else")
    
    # Create couple relationship
    couple = Couple(
        code=couple_data.code,
        user1_id=current_user.id,
        user2_id=partner["id"]
    )
    await db.couples.insert_one(couple.dict())
    
    # Update both users
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"partner_id": partner["id"]}}
    )
    await db.users.update_one(
        {"id": partner["id"]},
        {"$set": {"partner_id": current_user.id}}
    )
    
    # Unlock partner linked achievement for both
    for user_id in [current_user.id, partner["id"]]:
        existing = await db.achievements.find_one({
            "user_id": user_id,
            "achievement_type": AchievementType.PARTNER_LINKED
        })
        if not existing:
            achievement = Achievement(
                user_id=user_id,
                achievement_type=AchievementType.PARTNER_LINKED,
                title="💕 Corazones Unidos",
                description="Te vinculaste con tu pareja"
            )
            await db.achievements.insert_one(achievement.dict())
    
    return {"message": "Partner linked successfully"}

@api_router.get("/couples/my-partner")
async def get_my_partner(current_user: User = Depends(get_current_user)):
    if not current_user.partner_id:
        raise HTTPException(status_code=404, detail="No partner linked")
    
    partner = await db.users.find_one({"id": current_user.partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Get partner's latest mood
    latest_mood = await db.moods.find_one(
        {"user_id": current_user.partner_id},
        sort=[("date", -1)]
    )
    
    return {
        "id": partner["id"],
        "name": partner["name"],
        "latest_mood": latest_mood["mood_emoji"] if latest_mood else None,
        "mood_note": latest_mood["note"] if latest_mood else None,
        "mood_date": latest_mood["date"] if latest_mood else None
    }

# Activities endpoints
@api_router.post("/activities/create")
async def create_activity(activity_data: ActivityCreate, current_user: User = Depends(get_current_user)):
    if not current_user.partner_id:
        raise HTTPException(status_code=400, detail="Need to link partner first")
    
    if activity_data.receiver_id != current_user.partner_id:
        raise HTTPException(status_code=400, detail="Can only create activities for your partner")
    
    activity = Activity(
        title=activity_data.title,
        description=activity_data.description,
        category=activity_data.category,
        giver_id=current_user.id,
        receiver_id=activity_data.receiver_id
    )
    
    await db.activities.insert_one(activity.dict())
    
    # Check for achievements
    await check_achievements(current_user.id)
    
    return {"message": "Activity created successfully", "activity_id": activity.id}

@api_router.get("/activities/my-activities")
async def get_my_activities(current_user: User = Depends(get_current_user)):
    activities = await db.activities.find({"giver_id": current_user.id}).sort("created_at", -1).to_list(None)
    return serialize_doc(activities)

@api_router.get("/activities/partner-activities")
async def get_partner_activities(current_user: User = Depends(get_current_user)):
    activities = await db.activities.find({"receiver_id": current_user.id}).sort("created_at", -1).to_list(None)
    return serialize_doc(activities)

@api_router.post("/activities/{activity_id}/rate")
async def rate_activity(activity_id: str, rating_data: ActivityRating, current_user: User = Depends(get_current_user)):
    activity = await db.activities.find_one({"id": activity_id})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if activity["receiver_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Can only rate activities received by you")
    
    if activity.get("rating"):
        raise HTTPException(status_code=400, detail="Activity already rated")
    
    await db.activities.update_one(
        {"id": activity_id},
        {
            "$set": {
                "rating": rating_data.rating,
                "comment": rating_data.comment,
                "rated_at": datetime.utcnow()
            }
        }
    )
    
    # Check achievements for the giver
    await check_achievements(activity["giver_id"])
    
    return {"message": "Activity rated successfully"}

@api_router.get("/activities/pending-ratings")
async def get_pending_ratings(current_user: User = Depends(get_current_user)):
    activities = await db.activities.find({
        "receiver_id": current_user.id,
        "rating": {"$exists": False}
    }).sort("created_at", -1).to_list(None)
    return activities

@api_router.get("/activities/special-memories")
async def get_special_memories(current_user: User = Depends(get_current_user)):
    # Get all 5-star activities (given or received)
    five_star_activities = await db.activities.find({
        "$or": [
            {"giver_id": current_user.id, "rating": 5},
            {"receiver_id": current_user.id, "rating": 5}
        ]
    }).to_list(None)
    
    # Randomize and return up to 10
    random.shuffle(five_star_activities)
    return five_star_activities[:10]

# Moods endpoints
@api_router.post("/moods/create")
async def create_mood(mood_data: MoodCreate, current_user: User = Depends(get_current_user)):
    # Check if mood already exists for today
    today = datetime.utcnow().date()
    existing_mood = await db.moods.find_one({
        "user_id": current_user.id,
        "date": {
            "$gte": datetime.combine(today, datetime.min.time()),
            "$lt": datetime.combine(today, datetime.max.time())
        }
    })
    
    if existing_mood:
        # Update existing mood
        await db.moods.update_one(
            {"id": existing_mood["id"]},
            {
                "$set": {
                    "mood_emoji": mood_data.mood_emoji,
                    "note": mood_data.note,
                    "date": datetime.utcnow()
                }
            }
        )
        return {"message": "Mood updated successfully"}
    else:
        # Create new mood
        mood = Mood(
            user_id=current_user.id,
            mood_emoji=mood_data.mood_emoji,
            note=mood_data.note
        )
        await db.moods.insert_one(mood.dict())
        return {"message": "Mood created successfully"}

@api_router.get("/moods/my-moods")
async def get_my_moods(current_user: User = Depends(get_current_user)):
    moods = await db.moods.find({"user_id": current_user.id}).sort("date", -1).to_list(30)
    return serialize_doc(moods)

@api_router.get("/moods/partner-mood")
async def get_partner_mood(current_user: User = Depends(get_current_user)):
    if not current_user.partner_id:
        raise HTTPException(status_code=404, detail="No partner linked")
    
    # Get today's mood
    today = datetime.utcnow().date()
    mood = await db.moods.find_one({
        "user_id": current_user.partner_id,
        "date": {
            "$gte": datetime.combine(today, datetime.min.time()),
            "$lt": datetime.combine(today, datetime.max.time())
        }
    })
    
    return serialize_doc(mood)

# Achievements endpoints
@api_router.get("/achievements/my-achievements")
async def get_my_achievements(current_user: User = Depends(get_current_user)):
    achievements = await db.achievements.find({"user_id": current_user.id}).sort("unlocked_at", -1).to_list(None)
    return achievements

@api_router.get("/achievements/check-new")
async def check_new_achievements(current_user: User = Depends(get_current_user)):
    await check_achievements(current_user.id)
    return {"message": "Achievements checked"}

# Dashboard endpoint
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Activities given
    total_given = await db.activities.count_documents({"giver_id": current_user.id})
    
    # Activities received
    total_received = await db.activities.count_documents({"receiver_id": current_user.id})
    
    # Average rating given (ratings for activities I gave)
    given_activities = await db.activities.find({
        "giver_id": current_user.id,
        "rating": {"$exists": True, "$ne": None}
    }).to_list(None)
    avg_rating_given = sum(act["rating"] for act in given_activities if act["rating"] is not None) / len(given_activities) if given_activities else 0
    
    # Average rating received (ratings I gave to received activities)
    received_activities = await db.activities.find({
        "receiver_id": current_user.id,
        "rating": {"$exists": True, "$ne": None}
    }).to_list(None)
    avg_rating_received = sum(act["rating"] for act in received_activities if act["rating"] is not None) / len(received_activities) if received_activities else 0
    
    # Pending ratings
    pending = await db.activities.count_documents({
        "receiver_id": current_user.id,
        "rating": {"$exists": False}
    })
    
    # Achievements count
    achievements = await db.achievements.count_documents({"user_id": current_user.id})
    
    # Current streak (simplified - consecutive days with activities)
    current_streak = 0  # TODO: Implement proper streak calculation
    
    return DashboardStats(
        total_activities_given=total_given,
        total_activities_received=total_received,
        average_rating_given=round(avg_rating_given, 1),
        average_rating_received=round(avg_rating_received, 1),
        current_streak=current_streak,
        achievements_count=achievements,
        pending_ratings=pending
    )

@api_router.get("/")
async def root():
    return {"message": "LoveActs V2.0 API", "version": "2.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await setup_indexes()
    logger.info("LoveActs V2.0 API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()