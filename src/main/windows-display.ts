import { execFile } from 'node:child_process'
import { join } from 'node:path'

/** Current primary desktop dimensions in physical pixels, independent of Windows DPI scaling. */
export interface DisplayResolution {
  readonly width: number
  readonly height: number
}

// EnumDisplaySettingsW reads the primary desktop's current mode without changing it. The explicit
// DEVMODEW offsets/size are fixed by the Windows SDK, including its otherwise unused unions.
// No renderer input, device identifiers, desktop images, or user files enter this fixed command.
const resolutionScript = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ManagerDisplayMode {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct Device {
    public uint Size;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string Name;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Description;
    public uint Flags;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Id;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string Key;
  }
  [StructLayout(LayoutKind.Explicit, Size = 220)]
  public struct Mode {
    [FieldOffset(68)] public ushort Size;
    [FieldOffset(72)] public uint Fields;
    [FieldOffset(172)] public uint Width;
    [FieldOffset(176)] public uint Height;
  }
  [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Unicode)]
  [return: MarshalAs(UnmanagedType.Bool)]
  private static extern bool EnumDisplayDevicesW(string deviceName, uint index, ref Device device, uint flags);
  [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Unicode)]
  [return: MarshalAs(UnmanagedType.Bool)]
  private static extern bool EnumDisplaySettingsW(string deviceName, int modeNumber, ref Mode mode);
  public static void Read() {
    const uint attachedToDesktop = 0x00000001;
    const uint primaryDevice = 0x00000004;
    const int currentSettings = -1;
    const uint dimensions = 0x00080000 | 0x00100000;
    for (uint index = 0; index < 64; index++) {
      var device = new Device { Size = (uint)Marshal.SizeOf(typeof(Device)) };
      if (!EnumDisplayDevicesW(null, index, ref device, 0)) break;
      // Select the desktop's current primary adapter, not an arbitrary connected panel.
      if ((device.Flags & (attachedToDesktop | primaryDevice)) != (attachedToDesktop | primaryDevice)) continue;
      var mode = new Mode { Size = (ushort)Marshal.SizeOf(typeof(Mode)) };
      if (!EnumDisplaySettingsW(device.Name, currentSettings, ref mode) || (mode.Fields & dimensions) != dimensions)
        break;
      Console.WriteLine("{\\"width\\":" + mode.Width + ",\\"height\\":" + mode.Height + "}");
      return;
    }
    throw new InvalidOperationException("Primary display dimensions unavailable.");
  }
}
'@
[ManagerDisplayMode]::Read()
`

/**
 * Queries the primary Windows desktop mode with a hidden, bounded, read-only native call.
 *
 * @param signal - The window owner cancels pending work on refresh or disposal.
 * @returns Exact OS-reported pixel dimensions, or null if querying is blocked/unavailable.
 * @remarks
 * Electron exposes rounded DIP bounds; multiplying them by scaleFactor can add pixels at fractional
 * DPI. Do not silently substitute that estimate. No display mode, refresh rate, or privileges change.
 * Windows PowerShell or native interop may be blocked by local policy; that is an unavailable result,
 * not a reason to bypass policy or replace the detected resolution with a rounded estimate.
 */
export function readPrimaryDisplayResolution(
  signal: AbortSignal
): Promise<DisplayResolution | null> {
  const executable = join(
    process.env['SystemRoot'] ?? 'C:\\Windows',
    'System32/WindowsPowerShell/v1.0/powershell.exe'
  )
  return new Promise((resolve) => {
    execFile(
      executable,
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-EncodedCommand',
        Buffer.from(resolutionScript, 'utf16le').toString('base64')
      ],
      { windowsHide: true, timeout: 5000, maxBuffer: 4096, encoding: 'utf8', signal },
      (error, stdout) => {
        if (error) return resolve(null)
        try {
          const result: unknown = JSON.parse(stdout.trim())
          if (
            typeof result === 'object' &&
            result !== null &&
            'width' in result &&
            'height' in result &&
            typeof result.width === 'number' &&
            Number.isSafeInteger(result.width) &&
            result.width > 0 &&
            typeof result.height === 'number' &&
            Number.isSafeInteger(result.height) &&
            result.height > 0
          ) {
            resolve({ width: result.width, height: result.height })
          } else resolve(null)
        } catch {
          resolve(null)
        }
      }
    )
  })
}
