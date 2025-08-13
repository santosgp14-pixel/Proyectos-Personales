#!/usr/bin/env python3
import requests
import json

BASE_URL = "https://8a7764bc-ab0e-4ccf-b313-a8ccff47a620.preview.emergentagent.com/api"

# Register a user first
user_data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!"
}

response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
print("Register response:", response.status_code, response.text)

if response.status_code == 200:
    data = response.json()
    token = data["access_token"]
    
    # Test moods endpoint
    print("\nTesting moods endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/moods/my-moods", headers=headers)
    print("Moods response:", response.status_code, response.text)
    
    # Test activities endpoint
    print("\nTesting activities endpoint...")
    response = requests.get(f"{BASE_URL}/activities/my-activities", headers=headers)
    print("Activities response:", response.status_code, response.text)