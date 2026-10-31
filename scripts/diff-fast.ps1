Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImgDiff
{
    public int W, H;
    public byte[] G; // luminance per pixel

    public static ImgDiff Load(string path)
    {
        using (Bitmap bmp = new Bitmap(path))
        {
            var r = new Rectangle(0, 0, bmp.Width, bmp.Height);
            BitmapData d = bmp.LockBits(r, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int stride = Math.Abs(d.Stride);
            byte[] buf = new byte[stride * bmp.Height];
            Marshal.Copy(d.Scan0, buf, 0, buf.Length);
            bmp.UnlockBits(d);
            return new ImgDiff { W = bmp.Width, H = bmp.Height, G = ToGray(buf, stride, bmp.Width, bmp.Height) };
        }
    }

    static byte[] ToGray(byte[] buf, int stride, int w, int h)
    {
        byte[] g = new byte[w * h];
        for (int y = 0; y < h; y++)
        {
            int b = y * stride;
            int o = y * w;
            for (int x = 0; x < w; x++)
            {
                int i = b + x * 4;
                g[o + x] = (byte)((buf[i] + buf[i + 1] + buf[i + 2]) / 3);
            }
        }
        return g;
    }

    public static int BandDiff(ImgDiff a, ImgDiff b, int top, int height, int threshold)
    {
        int w = Math.Min(a.W, b.W);
        int bottom = Math.Min(Math.Min(a.H, b.H), top + height);
        int n = 0;
        for (int y = top; y < bottom; y++)
        {
            int oa = y * a.W;
            int ob = y * b.W;
            for (int x = 0; x < w; x++)
            {
                if (Math.Abs(a.G[oa + x] - b.G[ob + x]) > threshold) n++;
            }
        }
        return n;
    }

    // Count differing pixels when B is shifted by (dx,dy) relative to A.
    public static int ShiftDiff(ImgDiff a, ImgDiff b, int top, int height, int dx, int dy, int threshold)
    {
        int w = Math.Min(a.W, b.W);
        int bottom = Math.Min(Math.Min(a.H, b.H), top + height);
        int n = 0;
        for (int y = top; y < bottom; y++)
        {
            int yb = y + dy;
            if (yb < 0 || yb >= b.H) { n += w; continue; }
            int oa = y * a.W;
            int ob = yb * b.W;
            for (int x = 0; x < w; x++)
            {
                int xb = x + dx;
                if (xb < 0 || xb >= b.W) { n++; continue; }
                if (Math.Abs(a.G[oa + x] - b.G[ob + xb]) > threshold) n++;
            }
        }
        return n;
    }

    public static string BestShift(ImgDiff a, ImgDiff b, int top, int height, int maxShift, int threshold)
    {
        int bestDx = 0, bestDy = 0, bestN = int.MaxValue;
        for (int dy = -maxShift; dy <= maxShift; dy++)
            for (int dx = -maxShift; dx <= maxShift; dx++)
            {
                int n = ShiftDiff(a, b, top, height, dx, dy, threshold);
                if (n < bestN) { bestN = n; bestDx = dx; bestDy = dy; }
            }
        return "best dx=" + bestDx + " dy=" + bestDy + " diff=" + bestN;
    }

    // Difference bbox inside a band.
    public static string DiffBox(ImgDiff a, ImgDiff b, int top, int height, int threshold)
    {
        int w = Math.Min(a.W, b.W);
        int bottom = Math.Min(Math.Min(a.H, b.H), top + height);
        int minX = int.MaxValue, maxX = -1, minY = int.MaxValue, maxY = -1, n = 0;
        for (int y = top; y < bottom; y++)
        {
            int oa = y * a.W;
            int ob = y * b.W;
            for (int x = 0; x < w; x++)
            {
                if (Math.Abs(a.G[oa + x] - b.G[ob + x]) > threshold)
                {
                    n++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (n == 0) return "identical";
        return n + " px differ, x " + minX + ".." + maxX + ", y " + minY + ".." + maxY;
    }
}
'@

function Report($name, $width, $bands) {
  $a = [ImgDiff]::Load((Resolve-Path "mobile-audit/before/$name-$width.png"))
  $b = [ImgDiff]::Load((Resolve-Path "mobile-audit/after/$name-$width.png"))
  Write-Output ("=== $name $width  before ${($a.W)}x$($a.H)  after $($b.W)x$($b.H) ===")
  foreach ($band in $bands) {
    $top = $band[0]; $h = $band[1]
    $shift = [ImgDiff]::BestShift($a, $b, $top, $h, 6, 14)
    $box = [ImgDiff]::DiffBox($a, $b, $top, $h, 14)
    Write-Output ("  y {0,5}..{1,5} (h={2,4})  {3}   {4}" -f $top, ($top + $h - 1), $h, $shift, $box)
  }
}

Report "home" 1280 @(
  @(0, 200), @(200, 200), @(400, 400),
  @(800, 200), @(1000, 300), @(1300, 300),
  @(1600, 400), @(2000, 600), @(2600, 600),
  @(3200, 500), @(3700, 500), @(4200, 500),
  @(4700, 400), @(5100, 300), @(5400, 400),
  @(5800, 500), @(6300, 400), @(6700, 296)
)
Report "home" 1440 @(
  @(0, 200), @(200, 200), @(400, 400),
  @(800, 200), @(1000, 300), @(1300, 300),
  @(1600, 400), @(2000, 600), @(2600, 600),
  @(3200, 500), @(3700, 500), @(4200, 500),
  @(4700, 400), @(5100, 300), @(5400, 400),
  @(5800, 500), @(6400, 400), @(6800, 312)
)
