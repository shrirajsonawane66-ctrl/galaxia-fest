param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Top = "0",
  [string]$Height = "400"
)

Add-Type -AssemblyName System.Drawing
$pad = 6
$srcA = [System.Drawing.Image]::FromFile((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$srcB = [System.Drawing.Image]::FromFile((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
$w = $srcA.Width
$t = [int]$Top
$h = [math]::Min([int]$Height, [math]::Min($srcA.Height - $t, $srcB.Height - $t))

$bmp = New-Object System.Drawing.Bitmap ($w * 2 + $pad * 3), ($h + 40)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255, 232, 232, 232))
$g.DrawImage($srcA, (New-Object System.Drawing.Rectangle ($pad), 34, $w, $h), (New-Object System.Drawing.Rectangle 0, $t, $w, $h), [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($srcB, (New-Object System.Drawing.Rectangle ($w + $pad * 2), 34, $w, $h), (New-Object System.Drawing.Rectangle 0, $t, $w, $h), [System.Drawing.GraphicsUnit]::Pixel)
$font = New-Object System.Drawing.Font("Consolas", 14, [System.Drawing.FontStyle]::Bold)
$g.DrawString("BEFORE (y=$t)", $font, [System.Drawing.Brushes]::Black, $pad, 6)
$g.DrawString("AFTER (y=$t)", $font, [System.Drawing.Brushes]::Black, ($w + $pad * 2), 6)
$g.Dispose()
$out = "mobile-audit/after/_cmp-$Name-$Width-$t.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $srcA.Dispose(); $srcB.Dispose()
Write-Output $out
