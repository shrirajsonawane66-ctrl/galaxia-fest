param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Top = "6381",
  [string]$Height = "280",
  [int]$Limit = 12
)

Add-Type -AssemblyName System.Drawing

$a = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$b = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
$t = [int]$Top
$h = [int]$Height
$w = [math]::Min($a.Width, $b.Width)
$rows = @{}
$samples = @()
for ($y = $t; $y -lt $t + $h; $y++) {
  $n = 0
  for ($x = 0; $x -lt $w; $x++) {
    $pa = $a.GetPixel($x, $y); $pb = $b.GetPixel($x, $y)
    $d = [math]::Abs($pa.R - $pb.R) + [math]::Abs($pa.G - $pb.G) + [math]::Abs($pa.B - $pb.B)
    if ($d -gt 12) {
      $n++
      if ($samples.Count -lt $Limit) {
        $samples += ("x={0} y={1}  before=({2},{3},{4}) after=({5},{6},{7})  d={8}" -f $x, $y, $pa.R, $pa.G, $pa.B, $pb.R, $pb.G, $pb.B, $d)
      }
    }
  }
  if ($n -gt 0) { $rows[$y] = $n }
}
Write-Output "rows with diffs: $($rows.Count)"
$rows.GetEnumerator() | Sort-Object Name | Select-Object -First 12 | ForEach-Object { "  y=$($_.Name) n=$($_.Value)" }
Write-Output "samples:"
$samples | ForEach-Object { "  $_" }
$a.Dispose(); $b.Dispose()
