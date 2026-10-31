param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Top = "0",
  [string]$Height = "300"
)

Add-Type -AssemblyName System.Drawing

$srcA = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$srcB = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
$w = [math]::Min($srcA.Width, $srcB.Width)
$t = [int]$Top
$h = [math]::Min([int]$Height, [math]::Min($srcA.Height - $t, $srcB.Height - $t))
$dmr = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$da = $srcA.LockBits($dmr, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$db = $srcB.LockBits($dmr, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = [math]::Abs($da.Stride)
$len = $stride * $h
$ba = New-Object byte[] $len
$bb = New-Object byte[] $len
[System.Runtime.InteropServices.Marshal]::Copy($da.Scan0, $ba, 0, $len)
[System.Runtime.InteropServices.Marshal]::Copy($db.Scan0, $bb, 0, $len)
$srcA.UnlockBits($da); $srcB.UnlockBits($db)

function At($buf, $x, $y) {
  $i = $y * $script:stride + $x * 4
  return [int]$buf[$i] + [int]$buf[$i+1] + [int]$buf[$i+2]
}

$best = $null
foreach ($dy in -4..4) {
  foreach ($dx in -4..4) {
    $count = 0
    $samples = 0
    for ($y = [math]::Max(0, 4); $y -lt $h - 4; $y += 1) {
      for ($x = 4; $x -lt $w - 4; $x += 1) {
        $a = At $ba $x $y
        $b = At $bb ($x + $dx) ($y + $dy)
        if ([math]::Abs($a - $b) -gt 24) { $count++ }
        $samples++
      }
    }
    $pct = [math]::Round(100.0 * $count / $samples, 3)
    if ($null -eq $best -or $pct -lt $best.pct) {
      $best = [pscustomobject]@{ dx = $dx; dy = $dy; pct = $pct }
    }
  }
}
Write-Output ("{0}-{1} y{2}..{3}: best shift dx={4} dy={5} -> {6}% differ (after vs before shifted)" -f $Name, $Width, $t, ($t + $h - 1), $best.dx, $best.dy, $best.pct)
$srcA.Dispose(); $srcB.Dispose()
