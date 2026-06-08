# Regenerates placeholder hero/creep spritesheets in assets/
# Run from repo root: powershell -File scripts/generate-placeholder-sheets.ps1

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Add-Type -AssemblyName System.Drawing

function New-HeroSheet($path, $baseColor, $accentColor) {
    $fw = 128; $fh = 128; $count = 6
    $bmp = New-Object System.Drawing.Bitmap ($fw * $count), $fh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    for ($i = 0; $i -lt $count; $i++) {
        $ox = $i * $fw
        $body = [System.Drawing.Color]::FromArgb(255, $baseColor[0], $baseColor[1], $baseColor[2])
        $acc = [System.Drawing.Color]::FromArgb(255, $accentColor[0], $accentColor[1], $accentColor[2])
        $brush = New-Object System.Drawing.SolidBrush $body
        $g.FillEllipse($brush, $ox + 36, 24, 56, 56)
        $pen = New-Object System.Drawing.Pen $acc, 4
        $bob = [Math]::Sin($i * 0.8) * 6
        $g.DrawLine($pen, $ox + 64, 80 + $bob, $ox + 64, 110 + $bob)
        $g.DrawLine($pen, $ox + 40, 90 + $bob, $ox + 88, 90 + $bob)
        $brush2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 30, 30, 40))
        $g.FillEllipse($brush2, $ox + 48, 12, 32, 32)
    }
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

function New-CreepSheet($path, $baseColor, $accentColor) {
    $fw = 96; $fh = 96; $count = 4
    $bmp = New-Object System.Drawing.Bitmap ($fw * $count), $fh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    for ($i = 0; $i -lt $count; $i++) {
        $ox = $i * $fw
        $body = [System.Drawing.Color]::FromArgb(255, $baseColor[0], $baseColor[1], $baseColor[2])
        $acc = [System.Drawing.Color]::FromArgb(255, $accentColor[0], $accentColor[1], $accentColor[2])
        $brush = New-Object System.Drawing.SolidBrush $body
        $g.FillEllipse($brush, $ox + 20, 28, 56, 56)
        $pen = New-Object System.Drawing.Pen $acc, 3
        $g.DrawEllipse($pen, $ox + 24, 32, 48, 48)
    }
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

New-HeroSheet 'assets/heroes/warrior.png' @(140,60,30) @(255,140,0)
New-HeroSheet 'assets/heroes/mage.png' @(60,40,120) @(0,229,255)
New-HeroSheet 'assets/heroes/ranger.png' @(40,100,50) @(129,199,132)
New-HeroSheet 'assets/heroes/viking.png' @(80,90,110) @(180,230,255)
New-HeroSheet 'assets/heroes/hybrid.png' @(100,50,120) @(156,39,176)
New-CreepSheet 'assets/creeps/scout.png' @(255,68,170) @(255,102,204)
New-CreepSheet 'assets/creeps/warrior.png' @(255,136,0) @(255,170,68)
New-CreepSheet 'assets/creeps/ancient.png' @(255,204,68) @(255,238,136)
Write-Host 'Placeholder spritesheets generated in assets/'
