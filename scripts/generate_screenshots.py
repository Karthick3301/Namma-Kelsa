import zlib
import struct

def make_png(width, height, r, g, b, output_path):
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    # Width, Height, Bit depth (8), Color type (2 = Truecolor RGB), Compression (0), Filter (0), Interlace (0)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Image data: scanlines with filter byte 0 (None)
    # Fill background with (r, g, b)
    raw_row = b'\x00' + bytes([r, g, b]) * width
    raw_data = raw_row * height
    
    idat_data = zlib.compress(raw_data, 9)
    idat_crc = zlib.crc32(b'IDAT' + idat_data)
    png += struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Created {output_path} ({width}x{height})")

if __name__ == '__main__':
    # Emerald dark green: r=6, g=78, b=59 (#064e3b)
    make_png(1080, 1920, 6, 78, 59, 'public/screenshot-mobile.png')
    make_png(1920, 1080, 6, 78, 59, 'public/screenshot-desktop.png')
