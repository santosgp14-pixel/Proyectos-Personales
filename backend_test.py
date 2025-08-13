#!/usr/bin/env python3
"""
LoveActs V2.0 Backend API Testing Suite
Tests all backend endpoints with realistic romantic data
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://8a7764bc-ab0e-4ccf-b313-a8ccff47a620.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class LoveActsAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.user1_token = None
        self.user2_token = None
        self.user1_data = None
        self.user2_data = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, auth_token: str = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0
    
    def test_api_health(self):
        """Test if API is accessible"""
        success, data, status = self.make_request("GET", "/")
        if success and data.get("message") == "LoveActs V2.0 API":
            self.log_test("API Health Check", True, "API is accessible and responding")
            return True
        else:
            self.log_test("API Health Check", False, f"API not responding correctly", data)
            return False
    
    def test_user_registration(self):
        """Test user registration for both users"""
        import time
        timestamp = str(int(time.time()))
        
        # Register User 1 - Sofia with unique email
        user1_data = {
            "name": "Sofia Martinez",
            "email": f"sofia.martinez.{timestamp}@email.com",
            "password": "MiAmorEterno2024!"
        }
        
        success, data, status = self.make_request("POST", "/auth/register", user1_data)
        if success and data.get("access_token"):
            self.user1_token = data["access_token"]
            self.user1_data = data["user"]
            self.log_test("User Registration - Sofia", True, f"Sofia registered successfully with partner code: {self.user1_data.get('partner_code')}")
        else:
            self.log_test("User Registration - Sofia", False, "Failed to register Sofia", data)
            return False
        
        # Register User 2 - Carlos with unique email
        user2_data = {
            "name": "Carlos Rodriguez",
            "email": f"carlos.rodriguez.{timestamp}@email.com", 
            "password": "TeAmoParaSiempre2024!"
        }
        
        success, data, status = self.make_request("POST", "/auth/register", user2_data)
        if success and data.get("access_token"):
            self.user2_token = data["access_token"]
            self.user2_data = data["user"]
            self.log_test("User Registration - Carlos", True, f"Carlos registered successfully with partner code: {self.user2_data.get('partner_code')}")
            return True
        else:
            self.log_test("User Registration - Carlos", False, "Failed to register Carlos", data)
            return False
    
    def test_user_login(self):
        """Test user login"""
        # Use the same email that was registered
        if not hasattr(self, 'user1_data') or not self.user1_data:
            self.log_test("User Login", False, "No user data available for login test")
            return False
            
        login_data = {
            "email": self.user1_data["email"],
            "password": "MiAmorEterno2024!"
        }
        
        success, data, status = self.make_request("POST", "/auth/login", login_data)
        if success and data.get("access_token"):
            # Update token in case it changed
            self.user1_token = data["access_token"]
            self.log_test("User Login", True, "Sofia login successful")
            return True
        else:
            self.log_test("User Login", False, "Login failed", data)
            return False
    
    def test_auth_me(self):
        """Test getting current user info"""
        success, data, status = self.make_request("GET", "/auth/me", auth_token=self.user1_token)
        if success and data.get("name") == "Sofia Martinez":
            self.log_test("Auth Me Endpoint", True, "Successfully retrieved user info")
            return True
        else:
            self.log_test("Auth Me Endpoint", False, "Failed to get user info", data)
            return False
    
    def test_partner_linking(self):
        """Test partner linking system"""
        # Sofia links to Carlos using his partner code
        link_data = {
            "code": self.user2_data["partner_code"]
        }
        
        success, data, status = self.make_request("POST", "/couples/link-partner", link_data, self.user1_token)
        if success:
            self.log_test("Partner Linking", True, "Sofia successfully linked to Carlos")
        else:
            self.log_test("Partner Linking", False, "Failed to link partners", data)
            return False
        
        # Test getting partner info
        success, data, status = self.make_request("GET", "/couples/my-partner", auth_token=self.user1_token)
        if success and data.get("name") == "Carlos Rodriguez":
            self.log_test("Get Partner Info", True, "Successfully retrieved partner information")
            return True
        else:
            self.log_test("Get Partner Info", False, "Failed to get partner info", data)
            return False
    
    def test_mood_system(self):
        """Test mood creation and retrieval"""
        # Sofia creates a mood
        mood_data = {
            "mood_emoji": "🥰",
            "note": "¡Muy feliz hoy! Carlos me sorprendió con flores"
        }
        
        success, data, status = self.make_request("POST", "/moods/create", mood_data, self.user1_token)
        if success:
            self.log_test("Create Mood", True, "Sofia's mood created successfully")
        else:
            self.log_test("Create Mood", False, "Failed to create mood", data)
            return False
        
        # Carlos creates a mood
        mood_data2 = {
            "mood_emoji": "😊",
            "note": "Contento de ver a Sofia tan feliz"
        }
        
        success, data, status = self.make_request("POST", "/moods/create", mood_data2, self.user2_token)
        if success:
            self.log_test("Create Partner Mood", True, "Carlos's mood created successfully")
        else:
            self.log_test("Create Partner Mood", False, "Failed to create Carlos's mood", data)
        
        # Test getting own moods
        success, data, status = self.make_request("GET", "/moods/my-moods", auth_token=self.user1_token)
        if success and len(data) > 0:
            self.log_test("Get My Moods", True, f"Retrieved {len(data)} mood(s)")
        else:
            self.log_test("Get My Moods", False, "Failed to get moods", data)
        
        # Test getting partner mood
        success, data, status = self.make_request("GET", "/moods/partner-mood", auth_token=self.user1_token)
        if success and data.get("mood_emoji") == "😊":
            self.log_test("Get Partner Mood", True, "Successfully retrieved partner's mood")
            return True
        else:
            self.log_test("Get Partner Mood", False, "Failed to get partner mood", data)
            return False
    
    def test_activities_system(self):
        """Test complete activities CRUD system"""
        # Sofia creates an activity for Carlos
        activity_data = {
            "title": "Cena romántica en casa",
            "description": "Preparé tu comida favorita con velas y música suave",
            "category": "emocional",
            "receiver_id": self.user2_data["id"]
        }
        
        success, data, status = self.make_request("POST", "/activities/create", activity_data, self.user1_token)
        if success:
            activity_id = data.get("activity_id")
            self.log_test("Create Activity", True, f"Sofia created romantic dinner activity (ID: {activity_id})")
        else:
            self.log_test("Create Activity", False, "Failed to create activity", data)
            return False
        
        # Carlos creates an activity for Sofia
        activity_data2 = {
            "title": "Masaje relajante",
            "description": "Te daré un masaje después de tu día difícil en el trabajo",
            "category": "físico",
            "receiver_id": self.user1_data["id"]
        }
        
        success, data, status = self.make_request("POST", "/activities/create", activity_data2, self.user2_token)
        if success:
            activity_id2 = data.get("activity_id")
            self.log_test("Create Second Activity", True, f"Carlos created massage activity (ID: {activity_id2})")
        else:
            self.log_test("Create Second Activity", False, "Failed to create second activity", data)
        
        # Test getting my activities (activities I gave)
        success, data, status = self.make_request("GET", "/activities/my-activities", auth_token=self.user1_token)
        if success and len(data) > 0:
            self.log_test("Get My Activities", True, f"Sofia has {len(data)} activities given")
        else:
            self.log_test("Get My Activities", False, "Failed to get my activities", data)
        
        # Test getting partner activities (activities I received)
        success, data, status = self.make_request("GET", "/activities/partner-activities", auth_token=self.user1_token)
        if success and len(data) > 0:
            received_activity = data[0]
            self.log_test("Get Partner Activities", True, f"Sofia received {len(data)} activities")
            
            # Test rating the received activity
            rating_data = {
                "rating": 5,
                "comment": "¡Increíble! Me encantó el masaje, muy relajante"
            }
            
            success, rate_data, status = self.make_request("POST", f"/activities/{received_activity['id']}/rate", rating_data, self.user1_token)
            if success:
                self.log_test("Rate Activity", True, "Sofia rated Carlos's massage 5 stars")
            else:
                self.log_test("Rate Activity", False, "Failed to rate activity", rate_data)
        else:
            self.log_test("Get Partner Activities", False, "Failed to get partner activities", data)
        
        # Test pending ratings
        success, data, status = self.make_request("GET", "/activities/pending-ratings", auth_token=self.user2_token)
        if success:
            self.log_test("Get Pending Ratings", True, f"Carlos has {len(data)} pending ratings")
            
            # Carlos rates Sofia's dinner
            if len(data) > 0:
                pending_activity = data[0]
                rating_data = {
                    "rating": 5,
                    "comment": "¡La cena estuvo perfecta! Eres increíble cocinando"
                }
                
                success, rate_data, status = self.make_request("POST", f"/activities/{pending_activity['id']}/rate", rating_data, self.user2_token)
                if success:
                    self.log_test("Rate Pending Activity", True, "Carlos rated Sofia's dinner 5 stars")
                else:
                    self.log_test("Rate Pending Activity", False, "Failed to rate pending activity", rate_data)
        else:
            self.log_test("Get Pending Ratings", False, "Failed to get pending ratings", data)
        
        return True
    
    def test_special_memories(self):
        """Test special memories algorithm"""
        success, data, status = self.make_request("GET", "/activities/special-memories", auth_token=self.user1_token)
        if success:
            self.log_test("Special Memories", True, f"Retrieved {len(data)} special memories (5-star activities)")
            return True
        else:
            self.log_test("Special Memories", False, "Failed to get special memories", data)
            return False
    
    def test_achievements_system(self):
        """Test achievements and gamification"""
        # Check for new achievements
        success, data, status = self.make_request("GET", "/achievements/check-new", auth_token=self.user1_token)
        if success:
            self.log_test("Check New Achievements", True, "Achievement check completed")
        else:
            self.log_test("Check New Achievements", False, "Failed to check achievements", data)
        
        # Get my achievements
        success, data, status = self.make_request("GET", "/achievements/my-achievements", auth_token=self.user1_token)
        if success:
            achievement_count = len(data)
            self.log_test("Get My Achievements", True, f"Sofia has {achievement_count} achievements unlocked")
            
            # Print achievement details
            for ach in data:
                print(f"   🏆 {ach.get('title', 'Unknown')}: {ach.get('description', 'No description')}")
            
            return True
        else:
            self.log_test("Get My Achievements", False, "Failed to get achievements", data)
            return False
    
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, data, status = self.make_request("GET", "/dashboard/stats", auth_token=self.user1_token)
        if success:
            stats = data
            self.log_test("Dashboard Stats", True, 
                         f"Stats: {stats.get('total_activities_given', 0)} given, "
                         f"{stats.get('total_activities_received', 0)} received, "
                         f"{stats.get('achievements_count', 0)} achievements, "
                         f"{stats.get('pending_ratings', 0)} pending ratings")
            return True
        else:
            self.log_test("Dashboard Stats", False, "Failed to get dashboard stats", data)
            return False
    
    def test_error_cases(self):
        """Test various error scenarios"""
        # Test invalid login
        if hasattr(self, 'user1_data') and self.user1_data:
            invalid_login = {
                "email": self.user1_data["email"],
                "password": "wrongpassword"
            }
        else:
            invalid_login = {
                "email": "nonexistent@email.com",
                "password": "wrongpassword"
            }
        
        success, data, status = self.make_request("POST", "/auth/login", invalid_login)
        if not success and status == 401:
            self.log_test("Invalid Login Test", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid Login Test", False, "Should have rejected invalid login", data)
        
        # Test duplicate email registration
        if hasattr(self, 'user1_data') and self.user1_data:
            duplicate_user = {
                "name": "Another Sofia",
                "email": self.user1_data["email"],
                "password": "AnotherPassword123!"
            }
        else:
            duplicate_user = {
                "name": "Test User",
                "email": "test@example.com",
                "password": "AnotherPassword123!"
            }
        
        success, data, status = self.make_request("POST", "/auth/register", duplicate_user)
        if not success and status == 400:
            self.log_test("Duplicate Email Test", True, "Correctly rejected duplicate email")
        else:
            self.log_test("Duplicate Email Test", False, "Should have rejected duplicate email", data)
        
        # Test unauthorized access
        success, data, status = self.make_request("GET", "/auth/me")
        if not success and (status == 401 or status == 403):
            self.log_test("Unauthorized Access Test", True, "Correctly rejected unauthorized request")
        else:
            self.log_test("Unauthorized Access Test", False, "Should have rejected unauthorized access", data)
        
        return True
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting LoveActs V2.0 Backend API Tests")
        print("=" * 60)
        
        # Test sequence based on priority
        test_sequence = [
            ("API Health", self.test_api_health),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Auth Me", self.test_auth_me),
            ("Partner Linking", self.test_partner_linking),
            ("Mood System", self.test_mood_system),
            ("Activities System", self.test_activities_system),
            ("Special Memories", self.test_special_memories),
            ("Achievements System", self.test_achievements_system),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Error Cases", self.test_error_cases)
        ]
        
        passed = 0
        total = 0
        
        for test_name, test_func in test_sequence:
            print(f"\n📋 Testing {test_name}...")
            try:
                result = test_func()
                if result:
                    passed += 1
                total += 1
            except Exception as e:
                self.log_test(f"{test_name} - Exception", False, f"Test threw exception: {str(e)}")
                total += 1
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Count individual test results
        individual_passed = sum(1 for result in self.test_results if result["success"])
        individual_total = len(self.test_results)
        individual_rate = (individual_passed / individual_total * 100) if individual_total > 0 else 0
        
        print(f"Individual Tests: {individual_passed}/{individual_total} ({individual_rate:.1f}%)")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['message']}")
        
        return success_rate >= 80  # Consider 80%+ as overall success

if __name__ == "__main__":
    tester = LoveActsAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Backend API testing completed successfully!")
    else:
        print("\n⚠️  Backend API has critical issues that need attention.")