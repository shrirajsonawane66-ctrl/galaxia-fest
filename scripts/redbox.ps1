param(
  [string]$Name = "home",
  [string]$Width = "1280",
  [string]$Top = "0",
  [string]$Height = "200"
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public class RedBox {
  public int W,H; public byte[] R,G,B;
  public static RedBox Load(string p){ using(var b=new Bitmap(p)){ var r=new Rectangle(0,0,b.Width,b.Height); var d=b.LockBits(r,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb); int st=Math.Abs(d.Stride); var buf=new byte[st*b.Height]; Marshal.Copy(d.Scan0,buf,0,buf.Length); b.UnlockBits(d); int n=b.Width*b.Height; var rr=new byte[n]; var gg=new byte[n]; var bb=new byte[n]; for(int y=0;y<b.Height;y++){int s=y*st,o=y*b.Width; for(int x=0;x<b.Width;x++){int i=s+x*4; bb[o+x]=buf[i]; gg[o+x]=buf[i+1]; rr[o+x]=buf[i+2];} } return new RedBox{W=b.Width,H=b.Height,R=rr,G=gg,B=bb}; } }
  public static string Box(RedBox im,int t,int h){ int minX=int.MaxValue,maxX=-1,minY=int.MaxValue,maxY=-1,n=0; int b=Math.Min(im.H,t+h); for(int y=t;y<b;y++){ int o=y*im.W; for(int x=0;x<im.W;x++){ if(im.R[o+x]>140 && im.G[o+x]<80 && im.B[o+x]<80){ n++; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } } } if(maxX<0) return "no red"; return "x "+minX+".."+maxX+" (w="+(maxX-minX+1)+"), y "+minY+".."+maxY+" (h="+(maxY-minY+1)+"), px="+n; }
}
'@

$a = [RedBox]::Load((Resolve-Path "mobile-audit/before/$Name-$Width.png"))
$b = [RedBox]::Load((Resolve-Path "mobile-audit/after/$Name-$Width.png"))
Write-Output ("BEFORE " + [RedBox]::Box($a, [int]$Top, [int]$Height))
Write-Output ("AFTER  " + [RedBox]::Box($b, [int]$Top, [int]$Height))
