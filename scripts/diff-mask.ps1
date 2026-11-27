param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Top = "0",
  [string]$Height = "400",
  [string]$Scale = "1"
)

Add-Type -AssemblyName System.Drawing
$pad = 6

$srcA = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$srcB = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
$w = [math]::Min($srcA.Width, $srcB.Width)
$t = [int]$Top
$h = [math]::Min([int]$Height, [math]::Min($srcA.Height - $t, $srcB.Height - $t))

$panelW = [int]($w * [double]$Scale)
$panelH = [int]($h * [double]$Scale)

$before = New-Object System.Drawing.Bitmap $panelW, $panelH
$after = New-Object System.Drawing.Bitmap $panelW, $panelH
$mask = New-Object System.Drawing.Bitmap $panelW, $panelH
$g1 = [System.Drawing.Graphics]::FromImage($before)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2 = [System.Drawing.Graphics]::FromImage($after)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$rectSrc = New-Object System.Drawing.Rectangle 0, $t, $w, $h
$g1.DrawImage($srcA, (New-Object System.Drawing.Rectangle 0, 0, $panelW, $panelH), $rectSrc, [System.Drawing.GraphicsUnit]::Pixel)
$g2.DrawImage($srcB, (New-Object System.Drawing.Rectangle 0, 0, $panelW, $panelH), $rectSrc, [System.Drawing.GraphicsUnit]::Pixel)
$g1.Dispose(); $g2.Dispose()

# diff mask at full resolution
$dm = New-Object System.Drawing.Bitmap $w, $h
$dmr = New-Object System.Drawing.Rectangle 0, $t, $w, $h
$da = $srcA.LockBits($dmr, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$db = $srcB.LockBits($dmr, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = [math]::Abs($da.Stride)
$len = $stride * $h
$ba = New-Object byte[] $len
$bb = New-Object byte[] $len
[System.Runtime.InteropServices.Marshal]::Copy($da.Scan0, $ba, 0, $len)
[System.Runtime.InteropServices.Marshal]::Copy($db.Scan0, $bb, 0, $len)
$srcA.UnlockBits($da); $srcB.UnlockBits($db)

# row/col extents of differences
$minX = $w; $maxX = -1; $minY = $h; $maxY = -1; $count = 0
for ($y = 0; $y -lt $h; $y++) {
  $base = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $base + $x * 4
    $d = [math]::Abs($ba[$i] - $bb[$i]) + [math]::Abs($ba[$i+1] - $bb[$i+1]) + [math]::Abs($ba[$i+2] - $bb[$i+2])
    if ($d -gt 12) {
      $count++
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
      $dm.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 0, 120))
    } else {
      $dm.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 240, 240, 240))
    }
  }
}

$g3 = [System.Drawing.Graphics]::FromImage($mask)
$g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g3.DrawImage($dm, (New-Object System.Drawing.Rectangle 0, 0, $panelW, $panelH), (New-Object System.Drawing.Rectangle 0, 0, $w, $h), [System.Drawing.GraphicsUnit]::Pixel)
$g3.Dispose()
$dm.Dispose()

$out = New-Object System.Drawing.Bitmap ($panelW * 3 + $pad * 4), ($panelH + 34)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.Clear([System.Drawing.Color]::FromArgb(255, 210, 210, 210))
$g.DrawImage($before, $pad, 30)
$g.DrawImage($after, $panelW + $pad * 2, 30)
$g.DrawImage($mask, $panelW * 2 + $pad * 3, 30)
$font = New-Object System.Drawing.Font("Consolas", 12, [System.Drawing.FontStyle]::Bold)
$g.DrawString("BEFORE y=$t", $font, [System.Drawing.Brushes]::Black, $pad, 8)
$g.DrawString("AFTER y=$t", $font, [System.Drawing.Brushes]::Black, ($panelW + $pad * 2), 8)
$g.DrawString("DIFF ($count px, x $minX..$maxX, y $($t+$minY)..$($t+$maxY))", $font, [System.Drawing.Brushes]::Black, ($panelW * 2 + $pad * 3), 8)
$g.Dispose()

$path = "mobile-audit/after/_diffmask-$Name-$Width-$t.png"
$out.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$before.Dispose(); $after.Dispose(); $mask.Dispose(); $out.Dispose(); $srcA.Dispose(); $srcB.Dispose()
Write-Output "$path  ($count px differ, x $minX..$maxX, y $($t+$minY)..$($t+$maxY))"
