import { useEffect, useRef, useState } from 'react';
import { decodeImageData } from '../../lib/qr';
import Icon from '../ui/Icon';

/**
 * Live camera QR reader.
 * getUserMedia (rear camera preferred) → <video> → offscreen canvas every ~120 ms
 * → jsQR. Calls onDecode(text) once and stops the stream. Stream is always
 * stopped on unmount so the camera light never stays on.
 */
export default function QrCamera({ onDecode, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | denied | unsupported | error

  useEffect(() => {
    let stream;
    let timer;
    let done = false;

    const stop = () => {
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || done) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const code = decodeImageData(ctx.getImageData(0, 0, w, h));
      if (code?.data) {
        done = true;
        stop();
        onDecode(code.data.trim());
      }
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        onError?.('Camera is not supported in this browser. Upload a photo of the QR code instead.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setStatus('scanning');
        timer = setInterval(tick, 120);
      } catch (err) {
        const denied = err.name === 'NotAllowedError' || err.name === 'SecurityError';
        setStatus(denied ? 'denied' : 'error');
        onError?.(denied ? 'Camera permission was denied. Allow camera access or upload an image instead.' : 'Could not start the camera. Upload an image instead.');
      }
    })();

    return stop;
  }, [onDecode, onError]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-cyber-cyan/30">
      <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      {/* Viewfinder */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-[60%] w-[60%] max-w-xs">
          {['top-0 left-0 border-t-2 border-l-2 rounded-tl-lg', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg'].map((c) => (
            <span key={c} className={`absolute h-8 w-8 border-cyber-cyan ${c}`} />
          ))}
          {status === 'scanning' && <span className="scanline top-1/2" />}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-xs text-slate-200">
        <Icon name="camera" className="h-4 w-4 text-cyber-cyan" />
        {status === 'starting' && 'Starting camera…'}
        {status === 'scanning' && 'Point the camera at a QR code'}
        {status === 'denied' && 'Camera permission denied'}
        {(status === 'error' || status === 'unsupported') && 'Camera unavailable'}
      </div>
    </div>
  );
}
