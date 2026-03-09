# 🧪 Test Instructions - Simplified Quiz Flow

## 🚀 Quick Setup

### 1. Start the Backend API
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```
**API will run on:** http://localhost:8000

### 2. Start the Frontend
```bash
cd app
npm install
npm run dev
```
**Frontend will run on:** http://localhost:5173

## 🧪 Testing Steps

### 1. Test API Health
Visit: http://localhost:8000/health
✅ Should return: `{"status": "healthy", "gemini_configured": true, ...}`

### 2. Test Gemini API
Visit: http://localhost:8000/docs
✅ Try the `/quiz/test-gemini` endpoint

### 3. Test Frontend Quiz Flow
1. Open: http://localhost:5173
2. Login/Register (or use existing account)
3. Navigate to "Upload" section
4. Upload a PDF, Word, or PowerPoint file
5. Select question count (10/25/50) and difficulty
6. Click "Generate Quiz"
7. Take the quiz and see results

## 📄 Sample Files for Testing
- Small PDF document (1-2 pages)
- Word document with some text
- PowerPoint presentation with text content

## 🔍 Expected Behavior

### File Upload
- ✅ Drag & drop works
- ✅ File validation (type, size)
- ✅ Progress indicator during generation

### Quiz Generation
- ✅ Loading state with progress
- ✅ Success notification
- ✅ Quiz appears with questions

### Taking Quiz
- ✅ Progress bar updates
- ✅ Questions display correctly
- ✅ Answer selection works
- ✅ Immediate feedback

### Results
- ✅ Score calculation correct
- ✅ Performance badge shows
- ✅ Can generate new quiz

## 🐛 Common Issues & Solutions

### API Connection Error
**Problem:** Frontend can't reach backend
**Solution:** Update API URL in `app/src/lib/api.ts` line 4

### Gemini API Error
**Problem:** "Gemini API not configured"
**Solution:** Check `api/.env` has valid API key

### File Upload Error
**Problem:** "Unsupported file type"
**Solution:** Use PDF, DOCX, PPTX, or XLSX files under 10MB

### Quiz Generation Timeout
**Problem:** Request times out
**Solution:** Try smaller file or check internet connection

## 📊 Success Metrics

✅ **File uploads successfully**
✅ **Quiz generates in under 30 seconds**
✅ **Questions are relevant to content**
✅ **Score calculation works**
✅ **UI is responsive and smooth**

## 🎯 Ready for Production

Once all tests pass:
1. Update API URL in `app/src/lib/api.ts` to production URL
2. Deploy to Vercel
3. Test live deployment

Good luck! 🚀
