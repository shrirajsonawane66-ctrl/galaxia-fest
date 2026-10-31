Add-Type -AssemblyName System.Drawing

function Compare-Partial($aPath, $bPath, $outPath) {
  $a = [System.Drawing.Bitmap]::FromFile((Resolve-Path $aPath))
  $b = [System.Drawing.Bitmap]::FromFile((Resolve-Path $bPath))
  $w = [math]::Min($a.Width, $b.Width)
  $h = [math]::Min($a.Height, $b.Height)
  $rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
  $da = $a.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $db = $b.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $da.Stride
  $len = [math]::Abs($stride) * $h
  $ba = New-Object byte[] $len
  $bb = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($da.Scan0, $ba, 0, $len)
  [System.Runtime.InteropServices.Marshal]::Copy($db.Scan0, $bb, 0, $len)
  $a.UnlockBits($da); $b.UnlockBits($db)

  $rows = @()
  $first = -1; $last = -1; $diff = 0
  for ($y = 0; $y -lt $h; $y++) {
    $rowDiff = 0
    $base = $y * [math]::Abs($stride)
    for ($x = 0; $x -lt $w; $x++) {
      $i = $base + $x * 4
      $d = [math]::Abs($ba[$i] - $bb[$i]) + [math]::Abs($ba[$i+1] - $bb[$i+1]) + [math]::Abs($ba[$i+2] - $bb[$i+2])
      if ($d -gt 12) { $rowDiff++ }
    }
    if ($rowDiff -gt 0) {
      $diff += $rowDiff
      if ($first -lt 0) { $first = $y }
      $last = $y
      if ($rows.Count -lt 15) { $rows += "$y($rowDiff)" }
    }
  }
  Write-Output ("{0}: {1} diff px in rows {2}..{3} (overlap h={4}, a={5}, b={6})" -f (Split-Path $bPath -Leaf), $diff, $first, $last, $h, $a.Height, $b.Height)
  if ($rows.Count) { Write-Output ("   first rows: " + ($rows -join ", ")) }
  $a.Dispose(); $b.Dispose()
}

Compare-Partial "mobile-audit/before/home-1280.png" "mobile-audit/after/home-1280.png" ""
Compare-Partial "mobile-audit/before/home-1440.png" "mobile-audit/after/home-1440.png" ""
