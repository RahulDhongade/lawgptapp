Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Asus Tuf\.gemini\antigravity\brain\a828d0c7-2dec-4283-a235-061a10cb5952\.user_uploaded\media_1791061431020.jpg"
$baseImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutPath
    )
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $destImage = New-Object System.Drawing.Bitmap($Width, $Height)
    $destImage.SetResolution($Image.HorizontalResolution, $Image.VerticalResolution)

    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()

    $destImage.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
}

function Create-Splash {
    param(
        [System.Drawing.Image]$Image,
        [int]$CanvasWidth,
        [int]$CanvasHeight,
        [int]$LogoSize,
        [string]$OutPath
    )
    $destImage = New-Object System.Drawing.Bitmap($CanvasWidth, $CanvasHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.Clear([System.Drawing.Color]::Black)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $x = ($CanvasWidth - $LogoSize) / 2
    $y = ($CanvasHeight - $LogoSize) / 2
    $destRect = New-Object System.Drawing.Rectangle($x, $y, $LogoSize, $LogoSize)
    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()

    $destImage.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
}

# 1. Assets
Write-Host "Updating assets..."
Resize-Image -Image $baseImg -Width 1024 -Height 1024 -OutPath "assets\icon.png"
Resize-Image -Image $baseImg -Width 1024 -Height 1024 -OutPath "assets\adaptive-icon.png"
Resize-Image -Image $baseImg -Width 1024 -Height 1024 -OutPath "assets\logo.png"
Resize-Image -Image $baseImg -Width 192 -Height 192 -OutPath "assets\favicon.png"
Create-Splash -Image $baseImg -CanvasWidth 1080 -CanvasHeight 1920 -LogoSize 512 -OutPath "assets\splash.png"

# 2. Android Drawables
Write-Host "Updating drawable splash logos..."
Resize-Image -Image $baseImg -Width 288 -Height 288 -OutPath "android\app\src\main\res\drawable-mdpi\splashscreen_logo.png"
Resize-Image -Image $baseImg -Width 432 -Height 432 -OutPath "android\app\src\main\res\drawable-hdpi\splashscreen_logo.png"
Resize-Image -Image $baseImg -Width 576 -Height 576 -OutPath "android\app\src\main\res\drawable-xhdpi\splashscreen_logo.png"
Resize-Image -Image $baseImg -Width 864 -Height 864 -OutPath "android\app\src\main\res\drawable-xxhdpi\splashscreen_logo.png"
Resize-Image -Image $baseImg -Width 1152 -Height 1152 -OutPath "android\app\src\main\res\drawable-xxxhdpi\splashscreen_logo.png"

# 3. Android Mipmaps
$densities = @(
    @{ Folder = "mipmap-mdpi"; Size = 48; ForeSize = 108 },
    @{ Folder = "mipmap-hdpi"; Size = 72; ForeSize = 162 },
    @{ Folder = "mipmap-xhdpi"; Size = 96; ForeSize = 216 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144; ForeSize = 324 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192; ForeSize = 432 }
)

foreach ($d in $densities) {
    $dir = "android\app\src\main\res\$($d.Folder)"
    Write-Host "Processing $dir..."
    # Remove existing .webp
    Get-ChildItem -Path $dir -Filter "*.webp" | Remove-Item -Force
    # Create png versions
    Resize-Image -Image $baseImg -Width $d.Size -Height $d.Size -OutPath "$dir\ic_launcher.png"
    Resize-Image -Image $baseImg -Width $d.Size -Height $d.Size -OutPath "$dir\ic_launcher_round.png"
    Resize-Image -Image $baseImg -Width $d.ForeSize -Height $d.ForeSize -OutPath "$dir\ic_launcher_foreground.png"
}

$baseImg.Dispose()
Write-Host "All assets generated successfully!"
