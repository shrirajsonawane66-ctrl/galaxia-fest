param(
  [string]$A,
  [string]$B,
  [string]$Label = "pair"
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class PairDiff
{
    public int W, H;
    public byte[] G;

    public static PairDiff Load(string path)
    {
        using (Bitmap bmp = new Bitmap(path))
        {
            var r = new Rectangle(0, 0, bmp.Width, bmp.Height);
            BitmapData d = bmp.LockBits(r, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int stride = Math.Abs(d.Stride);
            byte[] buf = new byte[stride * bmp.Height];
            Marshal.Copy(d.Scan0, buf, 0, buf.Length);
            bmp.UnlockBits(d);
            byte[] g = new byte[bmp.Width * bmp.Height];
            for (int y = 0; y < bmp.Height; y++)
            {
                int b = y * stride, o = y * bmp.Width;
                for (int x = 0; x < bmp.Width; x++)
                {
                    int i = b + x * 4;
                    g[o + x] = (byte)((buf[i] + buf[i + 1] + buf[i + 2]) / 3);
                }
            }
            return new PairDiff { W = bmp.Width, H = bmp.Height, G = g };
        }
    }

    public static int Band(PairDiff a, PairDiff b, int top, int height, int threshold)
    {
        int w = Math.Min(a.W, b.W);
        int bottom = Math.Min(Math.Min(a.H, b.H), top + height);
        int n = 0;
        for (int y = top; y < bottom; y++)
        {
            int oa = y * a.W, ob = y * b.W;
            for (int x = 0; x < w; x++)
                if (Math.Abs(a.G[oa + x] - b.G[ob + x]) > threshold) n++;
        }
        return n;
    }
}
'@

$a = [PairDiff]::Load((Resolve-Path $A))
$b = [PairDiff]::Load((Resolve-Path $B))
Write-Output ("$Label  ${($a.W)}x$($a.H) vs $($b.W)x$($b.H)")
$h = [math]::Min($a.H, $b.H)
$total = 0
for ($top = 0; $top -lt $h; $top += 200) {
  $n = [PairDiff]::Band($a, $b, $top, 200, 12)
  $total += $n
  if ($n -gt 0) { Write-Output ("  y {0,5}..{1,5}: {2,7} px" -f $top, [math]::Min($top + 199, $h - 1), $n) }
}
Write-Output ("  total differing px: $total")
