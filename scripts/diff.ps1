Add-Type -AssemblyName System.Drawing

function Compare-Images($aPath, $bPath, $outPath) {
  $a = [System.Drawing.Bitmap]::FromFile((Resolve-Path $aPath))
  $b = [System.Drawing.Bitmap]::FromFile((Resolve-Path $bPath))
  if ($a.Width -ne $b.Width -or $a.Height -ne $b.Height) {
    Write-Output ("SIZE MISMATCH {0}x{1} vs {2}x{3}" -f $a.Width,$a.Height,$b.Width,$b.Height)
    return
  }
  $w = $a.Width; $h = $a.Height
  $rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
  $da = $a.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $db = $b.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $len = [math]::Abs($da.Stride) * $h
  $ba = New-Object byte[] $len
  $bb = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($da.Scan0, $ba, 0, $len)
  [System.Runtime.InteropServices.Marshal]::Copy($db.Scan0, $bb, 0, $len)
  $a.UnlockBits($da); $b.UnlockBits($db)

  $diff = 0
  $worst = 0
  for ($i = 0; $i -lt $len; $i += 4) {
    $d = [math]::Abs($ba[$i] - $bb[$i]) + [math]::Abs($ba[$i+1] - $bb[$i+1]) + [math]::Abs($ba[$i+2] - $bb[$i+2])
    if ($d -gt 12) { $diff++ }
    if ($d -gt $worst) { $worst = $d }
  }
  $total = $w * $h
  $pct = [math]::Round(100.0 * $diff / $total, 3)

  $out = New-Object System.Drawing.Bitmap $w, $h
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $i = ($y * $w + $x) * 4
      $d = [math]::Abs($ba[$i] - $bb[$i]) + [math]::Abs($ba[$i+1] - $bb[$i+1]) + [math]::Abs($ba[$i+2] - $bb[$i+2])
      if ($d -gt 12) { $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 0, 120)) }
      else { $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 12, 16, 34)) }
    }
  }
  $out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose(); $a.Dispose(); $b.Dispose()
  Write-Output ("{0}: {1}% pixels differ (worst channel sum {2})" -f (Split-Path $bPath -Leaf), $pct, $worst)
}

$pairs = @(
  @("home", "1280"), @("home", "1440"),
  @("events", "1280"), @("events", "1440"),
  @("admin-login", "1280"), @("admin-login", "1440"),
  @("booking-success", "1280"), @("booking-success", "1440")
)
foreach ($p in $pairs) {
  $name = $p[0]; $width = $p[1]
  Compare-Images "mobile-audit/before/$name-$width.png" "mobile-audit/after/$name-$width.png" "mobile-audit/after/_diff-$name-$width.png"
}
