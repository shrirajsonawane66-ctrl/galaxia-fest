param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$X = "200",
  [string]$Top = "0",
  [string]$Height = "60"
)

Add-Type -AssemblyName System.Drawing
$a = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$b = [System.Drawing.Bitmap]::FromFile((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
$x = [int]$X
$t = [int]$Top
$h = [int]$Height
Write-Output ("col x=$x rows $t..$($t+$h-1)")
for ($y = $t; $y -lt $t + $h; $y++) {
  $pa = $a.GetPixel($x, $y)
  $pb = $b.GetPixel($x, $y)
  $la = [math]::Round(($pa.R + $pa.G + $pa.B) / 3)
  $lb = [math]::Round(($pb.R + $pb.G + $pb.B) / 3)
  $mark = ""
  if ([math]::Abs($la - $lb) -gt 2) { $mark = "  <-- diff" }
  Write-Output ("y={0}  before={1,3} (r{2} g{3} b{4})  after={5,3} (r{6} g{7} b{8}){9}" -f $y, $la, $pa.R, $pa.G, $pa.B, $lb, $pb.R, $pb.G, $pb.B, $mark)
}
$a.Dispose(); $b.Dispose()
