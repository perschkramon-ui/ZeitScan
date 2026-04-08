"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 200 }: QRCodeProps) {
  if (!value) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md inline-block border-4 border-primary/10">
      <QRCodeSVG 
        value={value} 
        size={size}
        level="H"
        includeMargin={false}
        className="mx-auto"
      />
    </div>
  );
}
