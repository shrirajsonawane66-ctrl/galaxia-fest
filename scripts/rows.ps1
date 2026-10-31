param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Left = "0",
  [string]$Right = "0",
  [string]$Top = "0",
  [string]$Height = "300",
  [int]$MinCount = 8
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Rows
{
    public int W, H;
    public byte[] L;

    public static Rows Load(string path)
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
            return new Rows { W = bmp.Width, H = bmp.Height, L = g };
        }
    }

    public static string Profile(Rows img, int left, int right, int top, int height, int minCount, int bright)
    {
        int l = Math.Max(0, left), r = Math.Min(img.W, right);
        int t = top, b = Math.Min(img.H, top + height);
        var sb = new System.Text.StringBuilder();
        int runStart = -1;
        for (int y = t; y < b; y++)
        {
            int n = 0;
            int o = y * img.W;
            for (int x = l; x < r; x++) if (img.L[o + x] > bright) n++;
            bool on = n >= minCount;
            if (on && runStart < 0) runStart = y;
            if (!on && runStart >= 0)
            {
                sb.Append("[" + runStart + ".." + (y - 1) + " h=" + (y - runStart) + "] ");
                runStart = -1;
            }
        }
        if (runStart >= 0) sb.Append("[" + runStart + ".." + (b - 1) + " h=" + (b - runStart) + "] ");
        return sb.ToString();
    }
}
'@

$r = [int]$Right
if ($r -le 0) { $r = 100000 }
$a = [Rows]::Load((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$b = [Rows]::Load((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
$bright = 120
Write-Output ("BEFORE $Name-$Width y$Top..$($Top+$Height) x$Left..$r bright>$($bright)")
Write-Output ("  " + [Rows]::Profile($a, $Left, $r, [int]$Top, [int]$Height, $MinCount, $bright))
Write-Output ("AFTER:")
Write-Output ("  " + [Rows]::Profile($b, $Left, $r, [int]$Top, [int]$Height, $MinCount, $bright))
$a = $null; $b = $null
