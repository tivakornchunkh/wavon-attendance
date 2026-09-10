'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QrCodeSvg({ value, size = 256, className = '' }: QrCodeSvgProps) {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      color: {
        dark: '#0F1115',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        setSvgString(svg);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });
  }, [value, size]);

  if (!svgString) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-zinc-100 rounded-2xl animate-pulse ${className}`}
      >
        <span className="text-zinc-400 text-xs">กำลังสร้าง QR...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-block overflow-hidden rounded-2xl bg-white p-2 shadow-xs ${className}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
