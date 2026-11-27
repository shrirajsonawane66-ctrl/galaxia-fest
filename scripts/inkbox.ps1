param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Left = "0",
  [string]$Right = "0",
  [string]$Top = "0",
  [string]$Height = "40",
  [int]$Bright = 150,
  [int]$MinCount = 1
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Ink
{
    public int W, H;
    public byte[] L;
    public static Ink Load(string path)
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
            return new Ink { W = bmp.Width, H = bmp.Height, L = g };
        }
    }
    public static string Box(Ink img, int left, int right, int top, int height, int bright, int minCount)
    {
        int l = Math.Max(0, left), r = Math.Min(img.W, right);
        int t = Math.Max(0, top), b = Math.Min(img.H, top + height);
        int minX = int.MaxValue, maxX = -1, minY = int.MaxValue, maxY = -1, n = 0;
        for (int y = t; y < b; y++)
        {
            int o = y * img.W, row = 0, rowMin = int.MaxValue, rowMax = -1;
            for (int x = l; x < r; x++)
            {
                if (img.L[o + x] > bright)
                {
                    row++;
                    if (x < rowMin) rowMin = x;
                    if (x > rowMax) rowMax = x;
                }
            }
            if (row >= minCount)
            {
                n += row;
                if (rowMin < minX) minX = rowMin;
                if (rowMax > maxX) maxX = rowMax;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
        if (maxX < 0) return "no ink";
        return "x " + minX + ".." + maxX + " (w=" + (maxX - minX + 1) + "), y " + minY + ".." + maxY + ", px=" + n;
    }
}
'@

$r = [int]$Right
if ($r -le 0) { $r = 100000 }
$a = [Ink]::Load((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$b = [Ink]::Load((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
Write-Output ("BEFORE " + [Ink]::Box($a, $Left, $r, [int]$Top, [int]$Height, $Bright, $MinCount))
Write-Output ("AFTER  " + [Ink]::Box($b, $Left, $r, [int]$Top, [int]$Height, $Bright, $MinCount))
