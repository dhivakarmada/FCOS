import { useState, useRef, useEffect } from 'react';
import { useExecutionStore } from '@/store/execution-store';
import { useInventory } from '@/hooks/use-inventory';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function BarcodeScannerInput() {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { scanItem, isVoiceEnabled, toggleVoice, orderId, taskType } = useExecutionStore();
  const { scanOut } = useInventory();

  // Keep focus on input so hardware scanners work seamlessly
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'BUTTON') {
        inputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const speak = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3;
    window.speechSynthesis.speak(utterance);
  };

  const playBeep = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Audio beep failed', e);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const scannedCode = code.trim();
    if (!scannedCode) return;
    setCode(''); // reset for next scan immediately

    // 1. Local validation (Is it in the required items list?)
    const result = scanItem(scannedCode);
    
    if (result.success) {
      // 2. Only perform API scan-out for PICKING tasks
      if (taskType === 'PICKING' && orderId) {
        try {
          await scanOut.mutateAsync({
            barcode: scannedCode,
            quantity: 1,
            orderId
          });
          playBeep('success');
          speak('Accepted');
        } catch (error: any) {
          playBeep('error');
          // Revert local state if API fails? 
          // For now, scanItem just updates UI, so we might need a way to revert.
          // But scanOut already emits events, so UI will sync via WebSocket anyway.
          speak(error.response?.data?.message || 'Stock error');
        }
      } else {
        playBeep('success');
        speak('Next item');
      }
    } else {
      playBeep('error');
      speak(result.message || 'Wrong item');
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
              {scanOut.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanBarcode className="w-6 h-6 animate-pulse" />}
            </div>
            <h3 className="font-bold text-lg">{scanOut.isPending ? 'Syncing...' : 'Scan Item'}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleVoice} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
          >
            {isVoiceEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
          </Button>
        </div>

        <form onSubmit={handleScan} className="relative">
          <Input 
            ref={inputRef}
            autoFocus
            disabled={scanOut.isPending}
            placeholder={scanOut.isPending ? "Waiting for system..." : "Awaiting scanner input..."} 
            value={code} 
            onChange={e => setCode(e.target.value)}
            className="bg-slate-950 border-slate-800 text-green-400 font-mono text-2xl h-16 px-6 tracking-widest ring-offset-slate-900 focus-visible:ring-blue-500 rounded-2xl w-full disabled:opacity-50"
          />
          <button type="submit" className="hidden">Submit</button>
        </form>
      </div>
    </div>
  );
}
