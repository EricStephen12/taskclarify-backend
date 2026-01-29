# WEEKEND LAUNCH SETUP SCRIPT
# Run this in PowerShell from taskclarify-mobile directory

Write-Host "🚀 TaskClarify Backend Setup - Weekend Launch Edition!" -ForegroundColor Green
Write-Host ""

# Step 1: Move files to backend directory
Write-Host "📦 Step 1: Moving backend files..." -ForegroundColor Cyan
if (Test-Path "../taskclarify-backend") {
    Write-Host "   Backend directory already exists" -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Path "../taskclarify-backend" | Out-Null
    Write-Host "   Created taskclarify-backend directory" -ForegroundColor Green
}

Copy-Item -Path "backend-files/*" -Destination "../taskclarify-backend/" -Recurse -Force
Write-Host "   ✅ Files copied!" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "📦 Step 2: Installing backend dependencies..." -ForegroundColor Cyan
Set-Location "../taskclarify-backend"
npm install
Write-Host "   ✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 3: Setup environment
Write-Host "🔧 Step 3: Setting up environment..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Write-Host "   .env.local already exists" -ForegroundColor Yellow
} else {
    Copy-Item ".env.example" ".env.local"
    Write-Host "   ✅ Created .env.local from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "   ⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials!" -ForegroundColor Yellow
    Write-Host "   Copy from: taskclarify-mobile/.env.local" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Update mobile app
Write-Host "📱 Step 4: Updating mobile app configuration..." -ForegroundColor Cyan
Set-Location "../taskclarify-mobile"

$envContent = Get-Content ".env.local" -Raw
if ($envContent -notmatch "EXPO_PUBLIC_API_URL") {
    Add-Content ".env.local" "`nEXPO_PUBLIC_API_URL=http://localhost:3001/api"
    Write-Host "   ✅ Added API URL to mobile .env.local" -ForegroundColor Green
} else {
    Write-Host "   API URL already configured" -ForegroundColor Yellow
}
Write-Host ""

# Done!
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Edit ../taskclarify-backend/.env.local with your Supabase credentials"
Write-Host "   2. Open a new terminal and run:"
Write-Host "      cd ../taskclarify-backend"
Write-Host "      npm run dev"
Write-Host "   3. Keep your mobile app running (npx expo start)"
Write-Host "   4. Test creating something in the app!"
Write-Host ""
Write-Host "🚀 You'll see 'demo mode' responses - that means it's working!" -ForegroundColor Green
Write-Host ""
