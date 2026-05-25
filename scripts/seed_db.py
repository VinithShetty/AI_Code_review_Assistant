#!/usr/bin/env python3
"""
AI Code Review Assistant - Database Seed Script
Run with: python3 scripts/seed_db.py

This script seeds the database via the Next.js API endpoint.
"""

import requests
import sys
import json

API_BASE = "http://localhost:3000/api"

def seed_database():
    """Seed the database with demo data via the API."""
    print("🌱 Seeding database with demo data...")
    
    try:
        response = requests.post(f"{API_BASE}/seed", timeout=30)
        response.raise_for_status()
        data = response.json()
        
        print("✅ Database seeded successfully!")
        print(f"  - Users: {data['data']['users']}")
        print(f"  - Repositories: {data['data']['repositories']}")
        print(f"  - Pull Requests: {data['data']['pullRequests']}")
        print(f"  - Reviews: {data['data']['reviews']}")
        print(f"  - Comments: {data['data']['comments']}")
        print(f"  - Security Scans: {data['data']['securityScans']}")
        print(f"  - Analytics Events: {data['data']['analyticsEvents']}")
        
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Is the dev server running?")
        print("   Run 'npm run dev' first.")
        return False
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP error: {e}")
        print(f"   Response: {e.response.text}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_security_scanner():
    """Test the security scanner with sample code."""
    print("\n🔍 Testing security scanner...")
    
    sample_code = '''
import os
import pickle
import yaml

API_KEY = "sk-live-abc123xyz789def456"
AWS_KEY = "AKIAIOSFODNN7EXAMPLE"

def load_user(user_input):
    query = f"SELECT * FROM users WHERE id = {user_input}"
    data = pickle.loads(user_input)
    os.system(f"echo {user_input}")
    return query

def render_page(html):
    # XSS vulnerability
    element.innerHTML = html
'''
    
    try:
        response = requests.post(
            f"{API_BASE}/security/scan",
            json={
                repoId: "test",
                code: sample_code,
                language: "python"
            },
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"  Found {data.get('totalFindings', 0)} security issues")
            for finding in data.get('findings', [])[:5]:
                print(f"  - [{finding.get('severity', 'unknown').upper()}] {finding.get('type', finding.get('category', 'Unknown'))}")
        else:
            print(f"  Status: {response.status_code}")
    except Exception as e:
        print(f"  Could not test scanner: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("AI Code Review Assistant - Database Setup")
    print("=" * 50)
    
    if seed_database():
        print("\n✅ Setup complete! Visit http://localhost:3000")
    else:
        print("\n❌ Setup failed.")
        sys.exit(1)
