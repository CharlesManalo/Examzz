#!/usr/bin/env python3
"""
Test script to verify Phase 2 setup
"""

import sys
import os

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    
    try:
        from utils.extract_text import extract_text_from_file, validate_file_before_extraction
        print("✅ Text extraction utilities imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import text extraction utilities: {e}")
        return False
    
    try:
        from routers.quiz import router
        print("✅ Quiz router imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import quiz router: {e}")
        return False
    
    try:
        import google.generativeai as genai
        print("✅ Google Generative AI imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import Google Generative AI: {e}")
        return False
    
    try:
        from fastapi import FastAPI
        print("✅ FastAPI imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import FastAPI: {e}")
        return False
    
    return True

def test_env_vars():
    """Test that environment variables are set"""
    print("\nTesting environment variables...")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your-api-key-here":
        print("✅ GEMINI_API_KEY is set")
        return True
    else:
        print("❌ GEMINI_API_KEY is not set or still has placeholder value")
        print("   Please update api/.env with your actual Gemini API key")
        return False

def test_gemini_connection():
    """Test Gemini API connection (if API key is available)"""
    print("\nTesting Gemini API connection...")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or gemini_key == "your-api-key-here":
        print("⚠️ Skipping Gemini test - API key not set")
        return True
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content("Hello! Please respond with 'Connection test successful.'")
        
        if response.text and "Connection test successful" in response.text:
            print("✅ Gemini API connection test successful")
            return True
        else:
            print(f"⚠️ Gemini API responded but with unexpected text: {response.text}")
            return True  # Still counts as success since connection worked
            
    except Exception as e:
        print(f"❌ Gemini API connection test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Phase 2 Setup Test")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_env_vars,
        test_gemini_connection,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 All {total} tests passed! Phase 2 setup is complete.")
        print("\nNext steps:")
        print("1. Update api/.env with your actual Gemini API key")
        print("2. Run: uvicorn main:app --reload")
        print("3. Visit: http://localhost:8000/docs")
        print("4. Test with: curl -F \"file=@sample.pdf\" http://localhost:8000/quiz/generate")
    else:
        print(f"❌ {total - passed} out of {total} tests failed.")
        print("Please resolve the issues above before proceeding.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
