Add-Type -AssemblyName System.Drawing

function Band-Profile($aPath, $bPath, $bandHeight = 100) {
  $a = [System.Drawing.Bitmap]::FromFile((Resolve-Path $aPath))
  $b = [System.Drawing.Bitmap]::FromFile((Resolve-Path $bPath))
  $w = [math]::Min($a.Width, $b.Width)
  $h = [math]::Min($a.Height, $b.Height)
  $rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
  $da = $a.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $db = $b.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = [math]::Abs($da.Stride)
  $len = $stride * $h
  $ba = New-Object byte[] $len
  $bb = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($da.Scan0, $ba, 0, $len)
  [System.Runtime.InteropServices.Marshal]::Copy($db.Scan0, $bb, 0, $len)
  $a.UnlockBits($da); $b.UnlockBits($db)

  Write-Output ("=== {0} (h {1} vs {2}) ===" -f (Split-Path $bPath -Leaf), $a.Height, $b.Height)
  for ($start = 0; $start -lt $h; $start += $bandHeight) {
    $end = [math]::Min($start + $bandHeight - 1, $h - 1)
    $count = 0
    $minX = $w; $maxX = -1
    for ($y = $start; $y -le $end; $y++) {
      $base = $y * $stride
      for ($x = 0; $x -lt $w; $x++) {
        $i = $base + $x * 4
        $d = [math]::Abs($ba[$i] - $bb[$i]) + [math]::Abs($ba[$i+1] - $bb[$i+1]) + [math]::Abs($ba[$i+2] - $bb[$i+2])
        if ($d -gt 12) {
          $count++
          if ($x -lt $minX) { $minX = $x }
          if ($x -gt $maxX) { $maxX = $x }
        }
      }
    }
    if ($count -gt 0) {
      Write-Output ("  rows {0,5}-{1,5}: {2,7} px  x {3}..{4}" -f $start, $end, $count, $minX, $maxX)
    }
  }
  $a.Dispose(); $b.Dispose()
}

Band-Profile "mobile-audit/before/home-1280.png" "mobile-audit/after/home-1280.png"
Band-Profile "mobile-audit/before/home-1440.png" "mobile-audit/after/home-1440.png"
