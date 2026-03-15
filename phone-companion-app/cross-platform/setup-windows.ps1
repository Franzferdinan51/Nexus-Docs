# NexusDocs Camera Streamer - Windows Setup
# Run in PowerShell (as Administrator)

Write-Host "🔧 Setting up NexusDocs Camera Streamer for Windows..." -ForegroundColor Cyan

# Check Python installation
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing Python packages..." -ForegroundColor Cyan
pip install --upgrade pip
pip install opencv-python
pip install websockets
pip install numpy

# Create desktop shortcut
$shortcutPath = "$env:USERPROFILE\Desktop\NexusDocs Camera Streamer.lnk"
$targetPath = (Get-Command python).Source
$scriptPath = (Get-Item camera-streamer.py).FullName

$WScript = New-Object -ComObject WScript.Shell
$shortcut = $WScript.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = "$scriptPath --server ws://YOUR_SERVER_IP:8080 --device-id windows-cam"
$shortcut.Description = "NexusDocs Camera Streamer"
$shortcut.Save()

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Usage:" -ForegroundColor Yellow
Write-Host "   python camera-streamer.py --server ws://YOUR_SERVER_IP:8080 --device-id my-camera"
Write-Host "`n💡 Desktop shortcut created!" -ForegroundColor Yellow
