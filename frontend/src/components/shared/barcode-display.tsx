'use client';

import Barcode from 'react-barcode';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface BarcodeDisplayProps {
  value: string;
  label?: string;
}

export function BarcodeDisplay({ value, label }: BarcodeDisplayProps) {
  return (
    <Card className="inline-block border-none shadow-none bg-white p-2">
      <CardContent className="p-0 flex flex-col items-center">
        <Barcode 
          value={value} 
          width={1.5} 
          height={50} 
          fontSize={12} 
          background="transparent"
          lineColor="#000000"
        />
        {label && <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-tighter">{label}</p>}
      </CardContent>
    </Card>
  );
}
